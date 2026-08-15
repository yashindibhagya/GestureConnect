// Frontend/config/constants.js

// Backend (Node/Express) API. The model server is separate — see
// services/signLanguageService.js, which resolves its host automatically.
export const API_BASE_URL = 'http://localhost:5000'; // Change to your backend URL

// Sign recognition configuration.
//
// sequenceLength and confidenceThreshold mirror Model/utils/config.py; the model
// server is the authority on both, these are here for display purposes only.
export const RECOGNITION_CONFIG = {
    sequenceLength: 30,
    confidenceThreshold: 0.7,

    // How often to attempt a frame capture. The loop also waits for the server to
    // answer the previous frame, so this is a floor on the interval, not a fixed
    // rate — lowering it further does not help once the device is saturated.
    captureIntervalMs: 120,

    // JPEG quality for streamed frames. MediaPipe downsamples the image anyway, so
    // the payload size is what caps the frame rate. Raise only if recognition is
    // poor and the network is fast.
    frameQuality: 0.3,
};

// Development mode flag
export const DEV_MODE = __DEV__;
