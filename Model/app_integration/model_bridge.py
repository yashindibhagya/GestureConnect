#!/usr/bin/env python3
"""
GestureConnect model bridge.

Serves the trained sign-language model to the mobile app. The app streams camera
frames over the /ws WebSocket; this process extracts MediaPipe Holistic keypoints,
runs a sliding-window prediction, and pushes back a *continuously growing sentence*
rather than one word per recording.

Why a server and not on-device inference: the Keras model consumes 1662-dimensional
MediaPipe Holistic keypoints (pose + face + both hands) in 30-frame windows.
MediaPipe Holistic has no React Native binding, so keypoint extraction has to happen
here. See README for how the phone reaches this host.
"""

import argparse
import asyncio
import base64
import binascii
import os
import sys
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Dict, List, Optional

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.mediapipe_utils import extract_keypoints
from utils.config import (
    MODELS_PATH, ACTIONS, SEQUENCE_LENGTH, PREDICTION_THRESHOLD,
    MP_DETECTION_CONFIDENCE, MP_TRACKING_CONFIDENCE,
    API_HOST, API_PORT, KEYPOINT_DIMENSIONS,
)

# --- Sentence-assembly tuning -------------------------------------------------
# A sign is only committed to the sentence once the model agrees with itself for
# STABLE_FRAMES consecutive windows. This is what stops a single sign from being
# emitted several times as the 30-frame window slides across it, and what keeps
# transitions between signs (hands moving) out of the sentence.
STABLE_FRAMES = 4

# After committing a word, wait this many frames before committing anything else.
# Roughly half a window, so the next prediction is mostly fed by new frames.
COMMIT_COOLDOWN_FRAMES = SEQUENCE_LENGTH // 2

# Before the *same* word may be committed twice in a row, the model has to leave
# that word for this many frames. Without this a held sign repeats forever; with
# it, deliberately signing the same letter twice still works.
REPEAT_RELEASE_FRAMES = 3

# Predict at most every Nth frame. 1 = every frame. Raise it if the host CPU
# cannot keep up with the incoming frame rate.
PREDICT_EVERY_N_FRAMES = 1

# A window needs hands in at least this many of its frames before anything from it
# may be committed. The model was trained only on frames containing hands, so an
# all-zero hand vector still yields a confident-looking class; without this check
# an empty camera steadily appends nonsense words.
MIN_HAND_FRAMES_IN_WINDOW = SEQUENCE_LENGTH // 2

app = FastAPI(
    title="GestureConnect API",
    description="Real-time sign language recognition for the GestureConnect app",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mp_holistic = mp.solutions.holistic

model = None
_model_lock = asyncio.Lock()


class FrameData(BaseModel):
    frame_index: int
    keypoints: List[float]


def load_model():
    """Load the Keras model once and cache it."""
    global model

    if model is None:
        model_path = os.path.join(MODELS_PATH, 'sign_language_model.keras')

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")

        # compile=False: we only ever call predict, and skipping compilation
        # avoids rebuilding the optimizer state on every server start.
        model = tf.keras.models.load_model(model_path, compile=False)
        print(f"Loaded model from {model_path} (input {model.input_shape})")

    return model


def decode_frame(data) -> Optional[np.ndarray]:
    """Decode a base64 data URI, raw base64 string, or raw bytes into a BGR image."""
    try:
        if isinstance(data, str):
            # Strip an optional "data:image/jpeg;base64," prefix
            payload = data.split(',', 1)[1] if ',' in data else data
            raw = base64.b64decode(payload, validate=False)
        else:
            raw = data

        buffer = np.frombuffer(raw, np.uint8)
        if buffer.size == 0:
            return None
        return cv2.imdecode(buffer, cv2.IMREAD_COLOR)
    except (binascii.Error, ValueError) as exc:
        print(f"Could not decode frame: {exc}")
        return None


class RecognitionSession:
    """
    Per-client recognition state.

    Each connected app gets its own MediaPipe graph, frame buffer and sentence.
    MediaPipe's Holistic object keeps tracking state between frames and is not
    thread-safe, so every session owns a single-threaded executor and all of its
    CPU work is serialised onto that one thread. That also keeps the asyncio event
    loop free while TensorFlow and MediaPipe run.
    """

    def __init__(self, session_id: str):
        self.session_id = session_id
        self.sequence: deque = deque(maxlen=SEQUENCE_LENGTH)
        self.hand_flags: deque = deque(maxlen=SEQUENCE_LENGTH)
        self.recent: deque = deque(maxlen=STABLE_FRAMES)
        self.words: List[str] = []
        self.frames_seen = 0
        self.frames_since_commit = COMMIT_COOLDOWN_FRAMES
        self.refractory_word: Optional[str] = None
        self.frames_away_from_refractory = 0
        self.hands_visible = False
        self.hands_in_window = 0
        self._executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix=f"sess-{session_id}")
        self._holistic = mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,
            min_detection_confidence=MP_DETECTION_CONFIDENCE,
            min_tracking_confidence=MP_TRACKING_CONFIDENCE,
        )

    # -- lifecycle ------------------------------------------------------------

    def close(self):
        try:
            self._holistic.close()
        finally:
            self._executor.shutdown(wait=False)

    def reset(self, clear_sentence: bool = True):
        """Drop buffered frames. Optionally keep the sentence built so far."""
        self.sequence.clear()
        self.hand_flags.clear()
        self.recent.clear()
        self.frames_seen = 0
        self.frames_since_commit = COMMIT_COOLDOWN_FRAMES
        self.refractory_word = None
        self.frames_away_from_refractory = 0
        self.hands_visible = False
        self.hands_in_window = 0
        if clear_sentence:
            self.words = []

    @property
    def sentence(self) -> str:
        return " ".join(self.words)

    # -- frame processing -----------------------------------------------------

    async def process_frame(self, frame_data, mirror: bool = False) -> dict:
        """Extract keypoints, then predict if the window is full."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            self._executor, self._process_frame_sync, frame_data, mirror
        )

    def _process_frame_sync(self, frame_data, mirror: bool = False) -> dict:
        frame = decode_frame(frame_data)
        if frame is None:
            return self._status(error="Could not decode frame")

        # The training data came from an unmirrored webcam feed, where the signer's
        # right hand appears on the left of the image. MediaPipe assigns left/right
        # hand labels from the apparent anatomy, so a mirrored frame swaps the two
        # 63-value hand blocks and inverts x — the model then sees a sign it was
        # never trained on. Front-camera capture is unmirrored on most devices,
        # hence the default, but flip here if recognition is poor on a given phone.
        if mirror:
            frame = cv2.flip(frame, 1)

        keypoints = self._extract(frame)
        if keypoints is None:
            return self._status(error="Could not extract keypoints")

        self.sequence.append(keypoints)
        self.frames_seen += 1
        self.frames_since_commit += 1

        if len(self.sequence) < SEQUENCE_LENGTH:
            return self._status(buffering=True)

        if self.frames_seen % PREDICT_EVERY_N_FRAMES != 0:
            return self._status()

        return self._predict_and_commit()

    def _extract(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """Run MediaPipe on one BGR frame and return the flat keypoint vector."""
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame_rgb.flags.writeable = False
        results = self._holistic.process(frame_rgb)

        keypoints = extract_keypoints(results)
        if keypoints.shape[0] != KEYPOINT_DIMENSIONS:
            print(
                f"Unexpected keypoint length {keypoints.shape[0]}, "
                f"expected {KEYPOINT_DIMENSIONS}"
            )
            return None

        # With no hands in shot there is no sign to read, but the model still
        # returns a high-confidence class for an all-zero hand vector. Track hand
        # presence so _should_commit can refuse to write that noise into the
        # sentence.
        self.hands_visible = bool(results.left_hand_landmarks or results.right_hand_landmarks)
        self.hand_flags.append(self.hands_visible)
        return keypoints

    def _predict_and_commit(self) -> dict:
        active_model = load_model()

        window = np.asarray(self.sequence, dtype=np.float32)[np.newaxis, ...]
        # model(...) rather than .predict(...): predict() rebuilds a tf.function
        # graph and logs progress on every single call, which is wasteful for the
        # one-sample-at-a-time use here.
        probabilities = np.asarray(active_model(window, training=False))[0]

        top_index = int(np.argmax(probabilities))
        confidence = float(probabilities[top_index])
        candidate = ACTIONS[top_index]

        confident = confidence >= PREDICTION_THRESHOLD
        self.recent.append(candidate if confident else None)

        # Track how long we have been away from the last committed word, so the
        # same sign can be signed twice in a row on purpose.
        if self.refractory_word is not None:
            if confident and candidate == self.refractory_word:
                self.frames_away_from_refractory = 0
            else:
                self.frames_away_from_refractory += 1
                if self.frames_away_from_refractory >= REPEAT_RELEASE_FRAMES:
                    self.refractory_word = None
                    self.frames_away_from_refractory = 0

        committed = None
        if self._should_commit(candidate, confident):
            self.words.append(candidate)
            committed = candidate
            self.refractory_word = candidate
            self.frames_away_from_refractory = 0
            self.frames_since_commit = 0
            self.recent.clear()

        return self._status(
            word=candidate if confident else None,
            confidence=confidence,
            committed=committed,
            probabilities={action: float(p) for action, p in zip(ACTIONS, probabilities)},
        )

    def _should_commit(self, candidate: str, confident: bool) -> bool:
        if not confident:
            return False
        if not self._window_has_hands():
            return False
        if self.frames_since_commit < COMMIT_COOLDOWN_FRAMES:
            return False
        if candidate == self.refractory_word:
            return False
        # Require the model to agree with itself across consecutive windows.
        return len(self.recent) == STABLE_FRAMES and all(r == candidate for r in self.recent)

    def _window_has_hands(self) -> bool:
        """True when hands are present in enough of the window to be a real sign."""
        if not self.hand_flags:
            return False
        return sum(self.hand_flags) >= MIN_HAND_FRAMES_IN_WINDOW

    def _status(
        self,
        word: Optional[str] = None,
        confidence: float = 0.0,
        committed: Optional[str] = None,
        probabilities: Optional[dict] = None,
        buffering: bool = False,
        error: Optional[str] = None,
    ) -> dict:
        payload = {
            "sentence": self.sentence,
            "words": list(self.words),
            "word": word,
            "committed": committed,
            "confidence": confidence,
            "buffering": buffering,
            "buffer_progress": len(self.sequence) / SEQUENCE_LENGTH,
            "hands_visible": getattr(self, "hands_visible", False),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if probabilities is not None:
            payload["all_probabilities"] = probabilities
        if error is not None:
            payload["error"] = error
        return payload


# The REST endpoints below operate on one shared session so that the original
# stateless HTTP flow keeps working. The app uses the WebSocket instead.
_rest_session: Optional[RecognitionSession] = None
_ws_sessions: Dict[str, RecognitionSession] = {}


def get_rest_session() -> RecognitionSession:
    global _rest_session
    if _rest_session is None:
        _rest_session = RecognitionSession("rest")
    return _rest_session


@app.get("/")
async def root():
    return {
        "message": "GestureConnect API is running",
        "actions": ACTIONS,
        "sequence_length": SEQUENCE_LENGTH,
        "model_loaded": model is not None,
    }


@app.get("/health")
async def health():
    """Cheap endpoint the app polls to find a reachable server."""
    return {"status": "ok"}


@app.post("/predict/frame")
async def predict_from_frame(file: UploadFile = File(...)):
    """Push one image frame into the shared buffer and return the current state."""
    session = get_rest_session()
    try:
        contents = await file.read()
        return await session.process_frame(contents)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/predict/keypoints")
async def predict_from_keypoints(frame_data: FrameData):
    """Push a pre-extracted keypoint vector into the shared buffer."""
    session = get_rest_session()

    if len(frame_data.keypoints) != KEYPOINT_DIMENSIONS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Expected {KEYPOINT_DIMENSIONS} keypoints, "
                f"received {len(frame_data.keypoints)}"
            ),
        )

    vector = np.asarray(frame_data.keypoints, dtype=np.float32)
    session.sequence.append(vector)
    # extract_keypoints lays out pose(132) + face(1404) + left hand(63) + right
    # hand(63); a missing hand is written as zeros, so a non-zero tail means at
    # least one hand was detected for this frame.
    session.hands_visible = bool(np.any(vector[-126:]))
    session.hand_flags.append(session.hands_visible)
    session.frames_seen += 1
    session.frames_since_commit += 1

    if len(session.sequence) < SEQUENCE_LENGTH:
        return session._status(buffering=True)

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(session._executor, session._predict_and_commit)


@app.get("/predict")
async def get_prediction():
    """Predict from whatever is currently in the shared buffer."""
    session = get_rest_session()

    if len(session.sequence) < SEQUENCE_LENGTH:
        return session._status(buffering=True)

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(session._executor, session._predict_and_commit)


@app.post("/reset")
async def reset():
    get_rest_session().reset()
    return {"status": "success"}


@app.get("/actions")
async def get_actions():
    return {"actions": ACTIONS}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Streaming endpoint used by the app.

    Client sends: {"type": "frame", "data": "<base64 jpeg>", "mirror": false}
                  {"type": "reset"}            - clear buffer and sentence
                  {"type": "clear_buffer"}     - clear buffer, keep sentence
                  {"type": "backspace"}        - drop the last committed word
                  {"type": "get_actions"}
    Server sends: {"type": "prediction", "data": {sentence, word, committed, ...}}
    """
    await websocket.accept()

    session_id = str(id(websocket))
    session = RecognitionSession(session_id)
    _ws_sessions[session_id] = session
    print(f"Client {session_id} connected. Active sessions: {len(_ws_sessions)}")

    try:
        await websocket.send_json({
            "type": "connection_status",
            "status": "connected",
            "actions": ACTIONS,
            "sequence_length": SEQUENCE_LENGTH,
        })

        while True:
            message = await websocket.receive_json()
            message_type = message.get("type")

            if message_type == "frame":
                result = await session.process_frame(
                    message.get("data"), mirror=bool(message.get("mirror", False))
                )
                await websocket.send_json({"type": "prediction", "data": result})

            elif message_type == "reset":
                session.reset(clear_sentence=True)
                await websocket.send_json({"type": "prediction", "data": session._status()})

            elif message_type == "clear_buffer":
                session.reset(clear_sentence=False)
                await websocket.send_json({"type": "prediction", "data": session._status()})

            elif message_type == "backspace":
                if session.words:
                    session.words.pop()
                session.reset(clear_sentence=False)
                await websocket.send_json({"type": "prediction", "data": session._status()})

            elif message_type == "get_actions":
                await websocket.send_json({"type": "actions", "data": {"actions": ACTIONS}})

            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: {message_type!r}",
                })

    except WebSocketDisconnect:
        print(f"Client {session_id} disconnected")
    except Exception as exc:
        print(f"Session {session_id} failed: {exc}")
    finally:
        _ws_sessions.pop(session_id, None)
        session.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start the GestureConnect API server")
    parser.add_argument("--host", type=str, default=API_HOST, help="Host to bind")
    parser.add_argument("--port", type=int, default=API_PORT, help="Port to bind")
    args = parser.parse_args()

    try:
        load_model()
        print(f"Model ready. Recognised signs: {ACTIONS}")
    except Exception as exc:
        print(f"Warning: failed to load model at startup: {exc}")
        print("The API will still start; the model loads on first prediction.")

    print(f"Starting GestureConnect API server on http://{args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)
