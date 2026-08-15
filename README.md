# GestureConnect

Sign language recognition app. Three components that run as separate processes:

| Component | Stack | Port | Entry point |
|---|---|---|---|
| `Frontend/` | Expo / React Native (SDK 54) | Metro 8081 | `npx expo start` |
| `Backend/`  | Node / Express | 5000 | `npm start` (`server.js`) |
| `Model/`    | Python / FastAPI + TensorFlow + MediaPipe | 8000 | `app_integration/model_bridge.py` |

## Prerequisites

- Node.js 18+ (verified on 24.18.0)
- Python 3.9 (the pinned ML stack targets 3.9; see `Model/requirements.txt`)

## Setup

### Backend

```bash
cd Backend
cp .env.example .env     # then fill in your keys
npm install
npm start                # http://localhost:5000
```

Health check: `curl http://localhost:5000/health`

Credentials come from `Backend/.env` — nothing is hardcoded. See `.env.example`
for the full list. Firebase Admin needs either a `Backend/serviceAccountKey.json`
or the `FIREBASE_*` variables; it fails at startup with an explicit message if
neither is present. Both files are gitignored.

### Model

```bash
cd Model
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app_integration/model_bridge.py --host 0.0.0.0 --port 8000
```

Serves the pre-trained `models/sign_language_model.keras`. Check it came up with
`curl http://localhost:8000/actions`.

Bind `0.0.0.0`, not `127.0.0.1` — a phone cannot reach a loopback-only server.

The dependency pins in `requirements.txt` are load-bearing — see the comments in that
file before loosening them. In short: mediapipe >= 0.10.30 removed the `mp.solutions`
API this codebase uses, and that pin transitively fixes numpy and opencv.
`websockets` is required: without it uvicorn cannot serve `/ws`, and the app's
sign-to-text screen has no transport.

### Frontend

```bash
cd Frontend
npm install
npx expo start           # then press i / a, or scan the QR code
```

Point `API_BASE_URL` in `Frontend/config/constants.js` at your machine's LAN IP
instead of `localhost` when running on a physical device.

The model server address is resolved automatically and needs no editing — see below.

## Running all three

Each in its own terminal: Backend on 5000, Model on 8000, then the Expo dev server.

## How sign-to-text works

The trained model consumes MediaPipe Holistic keypoints — 1662 values per frame, in
30-frame windows. MediaPipe Holistic has no React Native binding, so keypoint
extraction cannot happen on the phone. Instead:

1. `Components/SignLanguage/SignLanguageCamera.jsx` captures JPEG frames from
   `expo-camera` and streams them over a WebSocket to `/ws`.
2. The model server extracts keypoints, keeps a rolling 30-frame window, and predicts
   on every frame.
3. A sign is appended to the sentence only once the model agrees with itself for
   several consecutive windows, hands are visible in at least half the window, and a
   cooldown since the last word has passed. The sentence keeps growing, so the user
   signs word after word without stopping or restarting.
4. The app mirrors the server's sentence, and can save, clear, backspace or share it.

Saved translations live in `savedSignTranslations.json` in the app's document
directory, and additionally in Firestore when a user is signed in.

### Connecting a physical phone

The app derives the model host from the Expo dev server's address, so a phone on the
same Wi-Fi finds it with no configuration. Emulators fall back to `10.0.2.2`
(Android) or `localhost` (iOS simulator).

To point at a different machine, set it in `Frontend/app.json`:

```json
"extra": { "modelServerHost": "192.168.1.20:8000" }
```

iOS needs plaintext local-network access for this, which `app.json` already grants
via `NSAllowsLocalNetworking` and `NSLocalNetworkUsageDescription`.

### Tuning recognition

| What | Where |
|---|---|
| Confidence threshold, window length, actions | `Model/utils/config.py` |
| Stability / cooldown / hand-visibility gates | top of `Model/app_integration/model_bridge.py` |
| Frame rate and JPEG quality | `RECOGNITION_CONFIG` in `Frontend/config/constants.js` |

If recognition is poor on a particular phone, try the mirror flag: the model was
trained on an unmirrored webcam feed, and a mirrored frame swaps MediaPipe's
left/right hand labels. Send `"mirror": true` with the frame message (see the `/ws`
docstring) to flip it server-side.

**Vocabulary is limited to 11 signs** — `A`, `B`, `C`, `what`, `name`, `how`, `you`,
`thankyou`, `ayanna`, `aayanna`, `aeyanna` (`ACTIONS` in `Model/utils/config.py`).
Sentences can only be built from these. Recognising more requires collecting data and
retraining (`python main.py collect` → `prepare` → `train`).

## Known issues

- **Web target is broken.** `firebase/auth` does not export `getReactNativePersistence`
  in its browser build, so `Frontend/config/firebaseConfig.jsx` throws under
  `expo start --web`. iOS and Android bundle and run fine.
- **`Backend/app.js` is not wired into `server.js`** — `npm start` only serves the
  transcription and model endpoints, not the Firebase auth/user/sign routes.
- **Sign-in and sign-up are bypassed** (see commit "Temporarily disable Firebase sign
  in and sign up"), so `auth.currentUser` is always null and saved translations go to
  device storage rather than Firestore.
- **Gesture-based auth is not implemented.** `/auth/gestureSignIn` and
  `/auth/gestureSignUp` are placeholders that redirect to the typing flow.
- **`app/courseView/[id]/details.jsx` is unreachable.** Every caller navigates to
  `/courseView/courseDetails`, so this duplicate screen is dead code.
- **Frame rate is capture-bound.** The model server itself sustains ~40 fps, but
  `takePictureAsync` is the bottleneck on device. The model was trained on 30-frame
  windows from a webcam, so a much slower capture rate stretches each sign across a
  longer real-time span than it saw in training and can cost accuracy.
- **26 ESLint warnings remain**, all pre-existing: unused handlers that look like
  unwired features (`findSignForPhrase`, `setContinuousRecording`) and
  `react-hooks/exhaustive-deps` warnings whose fixes could change re-render behavior.
  Left for a human to decide.
