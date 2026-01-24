#!/usr/bin/env python3
"""
Quick model validation script to check if the model is working correctly
"""

import os
import sys
import numpy as np
import tensorflow as tf

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.config import MODELS_PATH, ACTIONS, SEQUENCE_LENGTH, KEYPOINT_DIMENSIONS

def test_model():
    """Test the model with random data to see if it's working"""
    
    model_path = os.path.join(MODELS_PATH, 'sign_language_model.keras')
    
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at {model_path}")
        return False
    
    try:
        # Load model
        print(f"Loading model from {model_path}")
        model = tf.keras.models.load_model(model_path)
        
        # Print model info
        print(f"Model loaded successfully")
        print(f"Input shape: {model.input_shape}")
        print(f"Output shape: {model.output_shape}")
        print(f"Number of classes: {len(ACTIONS)}")
        print(f"Actions: {ACTIONS}")
        
        # Test with random data
        print(f"\nTesting with random data...")
        dummy_input = np.random.random((1, SEQUENCE_LENGTH, KEYPOINT_DIMENSIONS))
        print(f"Input shape: {dummy_input.shape}")
        
        # Make prediction
        prediction = model.predict(dummy_input, verbose=0)
        print(f"Output shape: {prediction.shape}")
        
        # Analyze prediction
        probabilities = prediction[0]
        predicted_idx = np.argmax(probabilities)
        confidence = probabilities[predicted_idx]
        predicted_action = ACTIONS[predicted_idx]
        
        print(f"\nPrediction Results:")
        print(f"   Predicted: {predicted_action}")
        print(f"   Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
        print(f"   Class index: {predicted_idx}")
        
        # Show all probabilities
        print(f"\nAll probabilities:")
        for i, (action, prob) in enumerate(zip(ACTIONS, probabilities)):
            print(f"   {i:2d}. {action:10s}: {prob:.4f} ({prob*100:.2f}%)")
        
        # Check if probabilities sum to ~1
        prob_sum = np.sum(probabilities)
        print(f"\nProbability sum: {prob_sum:.6f} (should be ~1.0)")
        
        # Check for stuck predictions (all same value)
        unique_probs = len(np.unique(np.round(probabilities, 6)))
        if unique_probs == 1:
            print(f"WARNING: All probabilities are the same! Model might be broken.")
            return False
        else:
            print(f"Found {unique_probs} unique probability values - model seems to be working")
        
        # Test multiple predictions to see if they vary
        print(f"\nTesting multiple predictions for variation...")
        predictions = []
        for i in range(5):
            dummy_input = np.random.random((1, SEQUENCE_LENGTH, KEYPOINT_DIMENSIONS))
            pred = model.predict(dummy_input, verbose=0)[0]
            predicted_action = ACTIONS[np.argmax(pred)]
            confidence = np.max(pred)
            predictions.append((predicted_action, confidence))
            print(f"   Test {i+1}: {predicted_action} ({confidence*100:.2f}%)")
        
        # Check if predictions vary
        unique_predictions = len(set([p[0] for p in predictions]))
        if unique_predictions == 1:
            print(f"WARNING: All predictions are the same! Model might be stuck.")
            return False
        else:
            print(f"Found {unique_predictions} different predictions - model is varying correctly")
        
        return True
        
    except Exception as e:
        print(f"ERROR testing model: {str(e)}")
        return False

if __name__ == "__main__":
    print("GestureConnect Model Validation")
    print("=" * 50)
    
    success = test_model()
    
    print("\n" + "=" * 50)
    if success:
        print("Model validation PASSED")
    else:
        print("Model validation FAILED")
        print("Consider retraining the model or checking the training data")