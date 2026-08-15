import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Client for the GestureConnect model server (Model/app_integration/model_bridge.py).
 *
 * The server owns the MediaPipe keypoint extraction, the 30-frame sliding window and
 * the sentence assembly, because MediaPipe Holistic has no React Native binding. This
 * class just streams JPEG frames up the WebSocket and hands prediction updates back to
 * the UI.
 */

const MODEL_PORT = 8000;

/**
 * Work out where the model server lives.
 *
 * On a physical phone `localhost` is the phone itself, so a hardcoded localhost URL can
 * never reach the laptop running the model. During development Expo already knows the
 * machine's LAN address (it is serving the bundle from it), so we reuse that host and
 * swap in the model port. Override with `extra.modelServerHost` in app.json when the
 * server runs somewhere else.
 */
export const resolveModelHost = () => {
    const configured = Constants.expoConfig?.extra?.modelServerHost;
    if (configured) return configured;

    // hostUri looks like "192.168.1.14:8081" (or "localhost:8081" on a simulator).
    const hostUri =
        Constants.expoConfig?.hostUri ||
        Constants.expoGoConfig?.debuggerHost ||
        Constants.manifest2?.extra?.expoGo?.debuggerHost;

    const lanHost = hostUri?.split(':')[0];
    if (lanHost && lanHost !== 'localhost' && lanHost !== '127.0.0.1') {
        return `${lanHost}:${MODEL_PORT}`;
    }

    // Emulators: Android maps the host machine to 10.0.2.2, the iOS simulator
    // shares the Mac's loopback.
    return Platform.OS === 'android'
        ? `10.0.2.2:${MODEL_PORT}`
        : `localhost:${MODEL_PORT}`;
};

export const getModelBaseUrl = () => `http://${resolveModelHost()}`;
export const getModelSocketUrl = () => `ws://${resolveModelHost()}/ws`;

class SignLanguageService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isConnecting = false;

        // Set while a frame is in flight. The camera checks this before grabbing the
        // next frame so we never queue frames faster than the server can consume them
        // — otherwise latency grows without bound and the sentence lags behind the user.
        this.awaitingPrediction = false;

        this.listeners = {
            prediction: new Set(),
            status: new Set(),
            error: new Set(),
        };

        this.shouldReconnect = false;
        this.reconnectAttempts = 0;
        this.maxReconnectDelay = 10000;
        this.reconnectTimer = null;
        this.actions = [];
    }

    // -- listener plumbing ----------------------------------------------------

    /** Subscribe to an event. Returns an unsubscribe function. */
    on(event, handler) {
        if (!this.listeners[event]) this.listeners[event] = new Set();
        this.listeners[event].add(handler);
        return () => this.listeners[event].delete(handler);
    }

    emit(event, payload) {
        this.listeners[event]?.forEach(handler => {
            try {
                handler(payload);
            } catch (err) {
                console.error(`SignLanguageService ${event} listener failed:`, err);
            }
        });
    }

    // -- connection -----------------------------------------------------------

    connect() {
        if (this.isConnected || this.isConnecting) return;

        this.shouldReconnect = true;
        this.isConnecting = true;
        this.emit('status', { state: 'connecting', url: getModelSocketUrl() });

        let socket;
        try {
            socket = new WebSocket(getModelSocketUrl());
        } catch (err) {
            this.isConnecting = false;
            this.emit('error', { message: `Could not open socket: ${err.message}` });
            this.scheduleReconnect();
            return;
        }

        this.socket = socket;

        socket.onopen = () => {
            this.isConnected = true;
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.awaitingPrediction = false;
            this.emit('status', { state: 'connected', url: getModelSocketUrl() });
        };

        socket.onmessage = event => {
            let message;
            try {
                message = JSON.parse(event.data);
            } catch {
                return;
            }

            switch (message.type) {
                case 'prediction':
                    this.awaitingPrediction = false;
                    this.emit('prediction', message.data);
                    break;
                case 'connection_status':
                    this.actions = message.actions || [];
                    break;
                case 'actions':
                    this.actions = message.data?.actions || [];
                    break;
                case 'error':
                    // A per-frame server error still frees the slot, otherwise one bad
                    // frame would stall the capture loop forever.
                    this.awaitingPrediction = false;
                    this.emit('error', { message: message.message });
                    break;
                default:
                    break;
            }
        };

        socket.onerror = () => {
            this.emit('error', {
                message: `Cannot reach the model server at ${resolveModelHost()}.`,
            });
        };

        socket.onclose = () => {
            const wasConnected = this.isConnected;
            this.isConnected = false;
            this.isConnecting = false;
            this.awaitingPrediction = false;
            this.socket = null;

            if (wasConnected) this.emit('status', { state: 'disconnected' });
            this.scheduleReconnect();
        };
    }

    scheduleReconnect() {
        if (!this.shouldReconnect || this.reconnectTimer) return;

        // Exponential backoff, capped, so a server that is simply not running does
        // not get hammered while the screen stays open.
        const delay = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxReconnectDelay);
        this.reconnectAttempts += 1;

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.shouldReconnect) this.connect();
        }, delay);
    }

    disconnect() {
        this.shouldReconnect = false;

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.socket) {
            // Drop handlers first so the close does not trigger a reconnect.
            this.socket.onclose = null;
            this.socket.onerror = null;
            try {
                this.socket.close();
            } catch {
                // Already closing; nothing to do.
            }
            this.socket = null;
        }

        this.isConnected = false;
        this.isConnecting = false;
        this.awaitingPrediction = false;
    }

    // -- streaming ------------------------------------------------------------

    send(payload) {
        if (!this.isConnected || this.socket?.readyState !== WebSocket.OPEN) return false;

        try {
            this.socket.send(JSON.stringify(payload));
            return true;
        } catch (err) {
            this.emit('error', { message: `Send failed: ${err.message}` });
            return false;
        }
    }

    /** True when the server has answered the previous frame and wants another. */
    get readyForFrame() {
        return this.isConnected && !this.awaitingPrediction;
    }

    /**
     * Stream one base64 JPEG frame. Returns false if the previous frame is still
     * being processed, in which case the caller should skip this capture.
     */
    sendFrame(base64Frame) {
        if (!this.readyForFrame || !base64Frame) return false;

        this.awaitingPrediction = true;
        const sent = this.send({ type: 'frame', data: base64Frame });
        if (!sent) this.awaitingPrediction = false;
        return sent;
    }

    /** Clear the buffered frames and the sentence built so far. */
    reset() {
        return this.send({ type: 'reset' });
    }

    /** Drop buffered frames but keep the sentence (used when pausing the camera). */
    clearBuffer() {
        return this.send({ type: 'clear_buffer' });
    }

    /** Remove the last committed word. */
    backspace() {
        return this.send({ type: 'backspace' });
    }

    // -- one-off REST calls ---------------------------------------------------

    /** Check the server is reachable before opening a socket. */
    async checkConnection(timeoutMs = 4000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`${getModelBaseUrl()}/health`, {
                signal: controller.signal,
            });
            return response.ok;
        } catch {
            return false;
        } finally {
            clearTimeout(timer);
        }
    }

    async getAvailableActions() {
        const response = await fetch(`${getModelBaseUrl()}/actions`);
        if (!response.ok) throw new Error(`Server returned ${response.status}`);

        const body = await response.json();
        this.actions = body.actions || [];
        return this.actions;
    }
}

export default new SignLanguageService();
