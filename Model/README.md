# Sign Language Recognition - Model

The deep learning model component of the Sign Language Recognition System, built with TensorFlow and MediaPipe.

## Features

- Real-time sign language recognition
- MediaPipe-based hand keypoint extraction
- TensorFlow deep learning model
- Support for multiple sign languages
- High accuracy and low latency prediction

## Prerequisites

- Python 3.8+
- TensorFlow 2.x
- MediaPipe
- OpenCV
- NumPy

## Installation

1. Install required packages:
```bash
pip install -r requirements.txt
```

## Project Structure

```
Model/
├── main.py                # Main entry point
├── workflow.py           # Model workflow management
├── app_integration/     # Integration with backend
├── models/             # Trained model files
├── scripts/           # Training and utility scripts
├── utils/            # Helper functions
├── data/            # Training and test data
├── logs/           # Training logs
└── requirements.txt # Python dependencies
```

## Model Architecture

The model uses a combination of:
- MediaPipe for hand keypoint extraction
- Deep learning layers for sequence processing
- Classification layers for sign prediction

### Input Processing
- Extracts 21 3D hand keypoints
- Processes sequences of frames
- Normalizes coordinates

### Model Layers
- LSTM/GRU layers for temporal processing
- Dense layers for feature extraction
- Softmax output for classification

## Running the Model

### Main Script
```bash
python main.py [options]
```

Available options:
- `--train`: Train the model
- `--test`: Test the model
- `--predict`: Run predictions
- `--data_dir`: Specify data directory

### Workflow Management
```bash
python workflow.py [workflow_name]
```

## Training

1. Prepare your dataset:
```bash
python scripts/data_preprocessing.py --data_dir /path/to/data
```

2. Train the model:
```bash
python main.py --train --epochs 100 --batch_size 32
```

## Model Performance

- **Accuracy**: ~95% on test set
- **Latency**: <100ms per prediction
- **Input Requirements**: 
  - 30 frames sequence
  - Clear hand visibility
  - Stable lighting conditions

## Development

### Project Organization

- `main.py`: Entry point for model operations
- `workflow.py`: Manages training and inference workflows
- `app_integration/`: Backend integration code
- `utils/`: Helper functions and utilities
- `scripts/`: Training and data processing scripts

### Adding New Signs

1. Collect training data for new signs
2. Update the label mapping
3. Retrain the model using `main.py --train`
4. Test thoroughly with `main.py --test`

### Best Practices

- Use consistent lighting conditions
- Ensure clear hand visibility
- Maintain steady frame rate
- Validate predictions
- Monitor training logs
- Regular model evaluation

## Troubleshooting

- **Model Loading Issues**:
  - Check model path in `models/` directory
  - Verify TensorFlow version
  - Confirm model format
  - Review logs in `logs/` directory

- **Training Issues**:
  - Verify data format in `data/` directory
  - Check GPU availability
  - Monitor memory usage
  - Review training logs

- **Prediction Issues**:
  - Check input data format
  - Verify preprocessing steps
  - Monitor system resources
  - Debug with workflow.py

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
