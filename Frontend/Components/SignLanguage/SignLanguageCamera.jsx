import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    AppState,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { MaterialIcons } from "@expo/vector-icons";

import signLanguageService, { resolveModelHost } from "../../services/signLanguageService";
import { RECOGNITION_CONFIG } from "../../config/constants";
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

// How long the capture loop pauses after a lens switch. expo-camera tears the
// old preview session down and starts a new one; capturing during that window
// fails. Roughly the worst case on a mid-range Android device.
const FLIP_SETTLE_MS = 700;

/**
 * Live sign-language camera.
 *
 * Streams frames to the model server for as long as `isRecording` is true. There is no
 * fixed recording length: the server keeps a rolling 30-frame window and appends each
 * recognised sign to a sentence, so the user can sign word after word continuously.
 *
 * expo-camera has no frame-processor API, so frames come from repeated
 * takePictureAsync calls. Each capture waits for the server to answer the previous
 * frame, which paces the loop to whatever the machine can actually handle instead of
 * building an ever-growing backlog.
 */
export default function SignLanguageCamera({
    isRecording = false,
    onPrediction,
    onStatusChange,
    onError,
    facing: initialFacing = "front",
}) {
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [connectionState, setConnectionState] = useState("idle");
    const [stats, setStats] = useState({ fps: 0, bufferProgress: 0, handsVisible: false });

    // Which lens is live. Seeded from the prop, then owned here so the flip
    // button can drive it: signing yourself wants the front camera, filming
    // someone else signing wants the back one.
    const [facing, setFacing] = useState(initialFacing);

    const cameraRef = useRef(null);
    const captureLoopRef = useRef(null);
    const isCapturingRef = useRef(false);
    const isMountedRef = useRef(true);
    const frameTimesRef = useRef([]);

    // Set while the preview is switching lenses. Capturing across that gap
    // either throws (the old session is already torn down) or returns a frame
    // from the wrong camera, so the loop skips instead.
    const isFlippingRef = useRef(false);
    const flipTimerRef = useRef(null);

    // Kept in a ref so the capture loop always sees the current value without being
    // torn down and restarted on every render.
    const isRecordingRef = useRef(isRecording);
    isRecordingRef.current = isRecording;

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
        };
    }, []);

    // -- connection lifecycle -------------------------------------------------

    useEffect(() => {
        const offStatus = signLanguageService.on("status", ({ state }) => {
            if (!isMountedRef.current) return;
            setConnectionState(state);
            onStatusChange?.(state);
        });

        const offError = signLanguageService.on("error", ({ message }) => {
            if (!isMountedRef.current) return;
            onError?.(message);
        });

        const offPrediction = signLanguageService.on("prediction", data => {
            if (!isMountedRef.current) return;

            setStats(prev => ({
                ...prev,
                bufferProgress: data.buffer_progress ?? 0,
                handsVisible: !!data.hands_visible,
            }));

            onPrediction?.(data);
        });

        signLanguageService.connect();

        return () => {
            offStatus();
            offError();
            offPrediction();
            signLanguageService.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -- frame capture --------------------------------------------------------

    const captureFrame = useCallback(async () => {
        if (isCapturingRef.current) return;
        if (isFlippingRef.current) return;
        if (!cameraRef.current || !isCameraReady) return;
        if (!signLanguageService.readyForFrame) return;

        isCapturingRef.current = true;

        try {
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                // Small and heavily compressed: MediaPipe downsamples anyway, and the
                // base64 payload size is what limits the achievable frame rate.
                quality: RECOGNITION_CONFIG.frameQuality,
                shutterSound: false,
                exif: false,
            });

            if (!isMountedRef.current) return;

            if (photo?.base64) {
                signLanguageService.sendFrame(photo.base64);

                const now = Date.now();
                const times = [...frameTimesRef.current, now].filter(t => now - t < 2000);
                frameTimesRef.current = times;
                if (times.length > 1) {
                    const seconds = (times[times.length - 1] - times[0]) / 1000;
                    setStats(prev => ({
                        ...prev,
                        fps: seconds > 0 ? (times.length - 1) / seconds : 0,
                    }));
                }
            }

            // takePictureAsync always writes the JPEG to the cache directory. Over a
            // long signing session that is thousands of files, so drop each one as
            // soon as its base64 has been sent.
            if (photo?.uri) {
                FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
            }
        } catch (err) {
            // A failed capture is usually a transient camera-busy error; keep going.
            if (__DEV__) console.warn("Frame capture failed:", err?.message);
        } finally {
            isCapturingRef.current = false;
        }
    }, [isCameraReady]);

    const startCaptureLoop = useCallback(() => {
        if (captureLoopRef.current) return;

        captureLoopRef.current = setInterval(() => {
            if (!isRecordingRef.current) return;
            captureFrame();
        }, RECOGNITION_CONFIG.captureIntervalMs);
    }, [captureFrame]);

    const stopCaptureLoop = useCallback(() => {
        if (captureLoopRef.current) {
            clearInterval(captureLoopRef.current);
            captureLoopRef.current = null;
        }
        frameTimesRef.current = [];
        setStats(prev => ({ ...prev, fps: 0 }));
    }, []);

    const toggleFacing = useCallback(() => {
        // Hold the loop off while the preview swaps lenses, and drop the frames
        // already queued on the server: the model reads a rolling 30-frame
        // window, so a window straddling the flip would be half one viewpoint
        // and half the other — and mirrored between the two. Clearing it costs
        // the user one window and avoids a garbage word.
        isFlippingRef.current = true;
        frameTimesRef.current = [];
        signLanguageService.clearBuffer();
        setStats(prev => ({ ...prev, fps: 0, bufferProgress: 0 }));

        setFacing(prev => (prev === "front" ? "back" : "front"));

        if (flipTimerRef.current) clearTimeout(flipTimerRef.current);
        flipTimerRef.current = setTimeout(() => {
            isFlippingRef.current = false;
            flipTimerRef.current = null;
        }, FLIP_SETTLE_MS);
    }, []);

    useEffect(() => {
        if (isRecording && isCameraReady) {
            startCaptureLoop();
        } else {
            stopCaptureLoop();
            // Drop the half-filled window so the next session does not start with
            // stale frames, but keep the sentence the user has built up.
            if (!isRecording) signLanguageService.clearBuffer();
        }

        return stopCaptureLoop;
    }, [isRecording, isCameraReady, startCaptureLoop, stopCaptureLoop]);

    // Release the camera and socket when the app is backgrounded, otherwise iOS
    // suspends mid-capture and the loop resumes against a dead camera handle.
    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextState => {
            if (nextState === "active") {
                signLanguageService.connect();
            } else {
                stopCaptureLoop();
                signLanguageService.disconnect();
            }
        });

        return () => subscription.remove();
    }, [stopCaptureLoop]);

    // -- permission states ----------------------------------------------------

    if (!permission) {
        return (
            <View style={styles.placeholder}>
                <ActivityIndicator color="#fff" />
            </View>
        );
    }

    if (!permission.granted) {
        const blocked = !permission.canAskAgain;

        return (
            <View style={styles.placeholder}>
                <MaterialIcons name="videocam-off" size={moderateScale(40)} color="#fff" />
                <Text style={styles.placeholderTitle}>Camera access needed</Text>
                <Text style={styles.placeholderText}>
                    GestureConnect needs the camera to read your signs.
                </Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={blocked ? () => Linking.openSettings() : requestPermission}
                >
                    <Text style={styles.permissionButtonText}>
                        {blocked ? "Open Settings" : "Grant permission"}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isConnected = connectionState === "connected";

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                // The preview is only a viewfinder; muting and disabling the shutter
                // animation keeps continuous capture from flashing and clicking.
                // Left active while idle so the user can frame themselves before
                // starting to sign.
                animateShutter={false}
                mute
                onCameraReady={() => setIsCameraReady(true)}
            />

            {/* Connection / status banner */}
            <View style={styles.topBar}>
                <View style={[styles.badge, isConnected ? styles.badgeOk : styles.badgeWarn]}>
                    <View style={[styles.dot, isConnected ? styles.dotOk : styles.dotWarn]} />
                    <Text style={styles.badgeText}>
                        {isConnected ? "Model connected" : "Connecting to model…"}
                    </Text>
                </View>

                <View style={styles.topRight}>
                    {isRecording && isConnected && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{stats.fps.toFixed(1)} fps</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.flipButton}
                        onPress={toggleFacing}
                        accessibilityRole="button"
                        accessibilityLabel={
                            facing === "front"
                                ? "Switch to the back camera"
                                : "Switch to the selfie camera"
                        }
                        // Generous tap target: the button sits over the preview,
                        // where the visible circle has to stay small.
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <MaterialIcons
                            name="flip-camera-ios"
                            size={moderateScale(20)}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Buffer fill indicator: the model needs 30 frames before its first word */}
            {isRecording && isConnected && stats.bufferProgress < 1 && (
                <View style={styles.bufferBarTrack}>
                    <View style={[styles.bufferBarFill, { width: `${stats.bufferProgress * 100}%` }]} />
                </View>
            )}

            {isRecording && (
                <View style={styles.bottomBar}>
                    <View style={styles.recordingPill}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>Signing</Text>
                    </View>

                    {!stats.handsVisible && (
                        <Text style={styles.hintText}>Show your hands in frame</Text>
                    )}
                </View>
            )}

            {!isConnected && (
                <View style={styles.offlineHint}>
                    <Text style={styles.offlineHintText}>
                        Waiting for the model server at {resolveModelHost()}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        flex: 1,
    },
    placeholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#333",
        padding: moderateScale(20),
    },
    placeholderTitle: {
        color: "#fff",
        fontSize: fontSize(16),
        fontWeight: "700",
        marginTop: verticalScale(10),
    },
    placeholderText: {
        color: "#ddd",
        fontSize: fontSize(13),
        textAlign: "center",
        marginTop: verticalScale(6),
    },
    permissionButton: {
        backgroundColor: "#26A69A",
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(20),
        borderRadius: moderateScale(20),
        marginTop: verticalScale(14),
    },
    permissionButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    topBar: {
        position: "absolute",
        top: verticalScale(10),
        left: scale(10),
        right: scale(10),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    topRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(8),
    },
    flipButton: {
        width: moderateScale(32),
        height: moderateScale(32),
        borderRadius: moderateScale(16),
        backgroundColor: "rgba(0,0,0,0.55)",
        alignItems: "center",
        justifyContent: "center",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.55)",
        paddingVertical: verticalScale(4),
        paddingHorizontal: scale(10),
        borderRadius: moderateScale(12),
    },
    badgeOk: {},
    badgeWarn: {},
    badgeText: {
        color: "#fff",
        fontSize: fontSize(11),
        fontWeight: "600",
    },
    dot: {
        width: moderateScale(7),
        height: moderateScale(7),
        borderRadius: moderateScale(4),
        marginRight: scale(6),
    },
    dotOk: {
        backgroundColor: "#4CAF50",
    },
    dotWarn: {
        backgroundColor: "#FFB300",
    },
    bufferBarTrack: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: verticalScale(3),
        backgroundColor: "rgba(255,255,255,0.25)",
    },
    bufferBarFill: {
        height: verticalScale(3),
        backgroundColor: "#4CAF50",
    },
    bottomBar: {
        position: "absolute",
        bottom: verticalScale(12),
        left: scale(10),
        right: scale(10),
        alignItems: "center",
    },
    recordingPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(211,47,47,0.85)",
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(12),
        borderRadius: moderateScale(14),
    },
    recordingDot: {
        width: moderateScale(8),
        height: moderateScale(8),
        borderRadius: moderateScale(4),
        backgroundColor: "#fff",
        marginRight: scale(6),
    },
    recordingText: {
        color: "#fff",
        fontSize: fontSize(12),
        fontWeight: "700",
    },
    hintText: {
        color: "#fff",
        fontSize: fontSize(12),
        marginTop: verticalScale(8),
        backgroundColor: "rgba(0,0,0,0.55)",
        paddingVertical: verticalScale(4),
        paddingHorizontal: scale(10),
        borderRadius: moderateScale(10),
        overflow: "hidden",
    },
    offlineHint: {
        position: "absolute",
        bottom: verticalScale(12),
        left: scale(10),
        right: scale(10),
        alignItems: "center",
    },
    offlineHintText: {
        color: "#fff",
        fontSize: fontSize(11),
        textAlign: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(10),
        borderRadius: moderateScale(10),
        overflow: "hidden",
    },
});
