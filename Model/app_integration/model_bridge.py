import os
import numpy as np
import json
import cv2
import mediapipe as mp
import tensorflow as tf
import sys
from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import List, Optional, Dict
import argparse
import base64
import asyncio
from datetime import datetime

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.mediapipe_utils import extract_keypoints
from utils.config import (
    MODELS_PATH, ACTIONS, SEQUENCE_LENGTH, PREDICTION_THRESHOLD,
    MP_DETECTION_CONFIDENCE, MP_TRACKING_CONFIDENCE,
    API_HOST, API_PORT
)

# Initialize FastAPI app
app = FastAPI(title="GestureConnect API", 
              description="API for sign language recognition",
              version="1.0.0")

# Configure CORS (important for React Native app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize MediaPipe models
mp_holistic = mp.solutions.holistic

# Data models
class PredictionResult(BaseModel):
    action: str
    confidence: float
    all_probabilities: dict

class FrameData(BaseModel):
    frame_index: int
    keypoints: List[float]

# Global variables
model = None
sequence_buffer = []
connected_clients: Dict[str, WebSocket] = {}

def load_model():
    """Load the TensorFlow model"""
    global model
    
    if model is None:
        model_path = os.path.join(MODELS_PATH, 'sign_language_model.keras')
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
        
        model = tf.keras.models.load_model(model_path)
        print(f"Loaded model from {model_path}")
    
    return model

def process_frame(frame_data):
    """
    Process a single frame containing keypoints
    
    Args:
        frame_data: Raw frame data or keypoints array
        
    Returns:
        keypoints: Extracted keypoints from the frame
    """
    global sequence_buffer
    
    try:
        # If frame_data is base64 encoded image
        if isinstance(frame_data, str):
            # Decode base64 image
            frame_bytes = base64.b64decode(frame_data.split(',')[1] if ',' in frame_data else frame_data)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(frame_data, list):
            # Frame data is already keypoints
            keypoints = np.array(frame_data)
            return keypoints
        else:
            # Raw bytes
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Make MediaPipe detection
        with mp_holistic.Holistic(
            static_image_mode=True,
            min_detection_confidence=MP_DETECTION_CONFIDENCE) as holistic:
            
            # Convert to RGB for MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_rgb.flags.writeable = False
            
            # Make detection
            results = holistic.process(frame_rgb)
            
            # Extract keypoints
            keypoints = extract_keypoints(results)
            
            return keypoints
            
    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        return None

def make_prediction():
    """
    Make a prediction based on the current sequence buffer
    
    Returns:
        dict: Prediction result with action, confidence, and all probabilities
    """
    global sequence_buffer
    
    try:
        # Load model if not already loaded
        model = load_model()
        
        # Check if we have enough frames
        if len(sequence_buffer) < SEQUENCE_LENGTH:
            return {
                "action": "insufficient_data",
                "confidence": 0.0,
                "all_probabilities": {}
            }
        
        # Prepare sequence for prediction
        while len(sequence_buffer) > SEQUENCE_LENGTH:
            sequence_buffer.pop(0)
        
        # Make prediction
        sequence_array = np.array([sequence_buffer])
        res = model.predict(sequence_array)[0]
        
        # Get predicted action and confidence
        predicted_idx = np.argmax(res)
        confidence = float(res[predicted_idx])
        predicted_action = ACTIONS[predicted_idx] if confidence >= PREDICTION_THRESHOLD else "unknown"
        
        # Create dictionary of all probabilities
        all_probs = {action: float(prob) for action, prob in zip(ACTIONS, res)}
        
        return {
            "action": predicted_action,
            "confidence": confidence,
            "all_probabilities": all_probs,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"Error making prediction: {str(e)}")
        return {
            "action": "error",
            "confidence": 0.0,
            "all_probabilities": {},
            "error": str(e)
        }

def reset_sequence():
    """Reset the sequence buffer"""
    global sequence_buffer
    sequence_buffer = []
    return {"status": "success", "message": "Sequence buffer reset"}

@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {"message": "GestureConnect API is running"}

@app.post("/predict/frame")
async def predict_from_frame(file: UploadFile = File(...)):
    """
    Process a single frame and update the sequence buffer
    
    Args:
        file: Image file to process
        
    Returns:
        dict: Status and frame index
    """
    try:
        # Read file content
        contents = await file.read()
        
        # Process frame
        keypoints = process_frame(contents)
        
        return {
            "status": "success",
            "frame_index": len(sequence_buffer)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/keypoints")
async def predict_from_keypoints(frame_data: FrameData):
    """
    Process keypoints directly without image processing
    
    Args:
        frame_data: Object containing keypoints
        
    Returns:
        dict: Status and frame index
    """
    try:
        # Process keypoints
        process_frame(frame_data.keypoints)
        
        return {
            "status": "success",
            "frame_index": len(sequence_buffer)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predict")
async def get_prediction():
    """
    Get prediction based on current sequence buffer
    
    Returns:
        PredictionResult: Prediction result
    """
    try:
        # Make prediction
        result = make_prediction()
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset")
async def reset():
    """
    Reset the sequence buffer
    
    Returns:
        dict: Status
    """
    try:
        reset_sequence()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/actions")
async def get_actions():
    """
    Get list of supported actions
    
    Returns:
        dict: List of supported actions
    """
    return {"actions": ACTIONS}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication"""
    client_id = str(id(websocket))
    
    try:
        await websocket.accept()
        connected_clients[client_id] = websocket
        print(f"Client {client_id} connected. Total clients: {len(connected_clients)}")
        
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection_status",
            "status": "connected",
            "message": "Connected to GestureConnect WebSocket server"
        })
        
        while True:
            try:
                # Receive message from client
                message = await websocket.receive_json()
                
                if message["type"] == "frame":
                    # Process frame
                    keypoints = process_frame(message["data"])
                    if keypoints is not None:
                        sequence_buffer.append(keypoints)
                        
                        # Make prediction if we have enough frames
                        prediction = make_prediction()
                        await websocket.send_json({
                            "type": "prediction",
                            "data": prediction
                        })
                
                elif message["type"] == "reset":
                    # Reset sequence buffer
                    result = reset_sequence()
                    await websocket.send_json({
                        "type": "reset_status",
                        "data": result
                    })
                
                elif message["type"] == "get_actions":
                    # Send available actions
                    await websocket.send_json({
                        "type": "actions",
                        "data": {"actions": ACTIONS}
                    })
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                # Send error to client
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except WebSocketDisconnect:
        print(f"Client {client_id} disconnected")
    finally:
        # Clean up on disconnect
        if client_id in connected_clients:
            del connected_clients[client_id]
        reset_sequence()

if __name__ == "__main__":
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Start the GestureConnect API server")
    parser.add_argument("--host", type=str, default=API_HOST, help="Host to run the server on")
    parser.add_argument("--port", type=int, default=API_PORT, help="Port to run the server on")
    args = parser.parse_args()
    
    # Load model at startup
    try:
        load_model()
        print(f"Model loaded successfully. Available actions: {ACTIONS}")
    except Exception as e:
        print(f"Warning: Failed to load model at startup: {e}")
        print("The API will still start, but model will be loaded on first request.")
    
    # Start the server
    print(f"Starting GestureConnect API server at http://{args.host}:{args.port}")
    uvicorn.run(app, host=args.host, port=args.port)