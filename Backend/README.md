# Sign Language Recognition - Backend

The WebSocket server component of the Sign Language Recognition System, handling real-time communication between the frontend and the model.

## Features

- Real-time WebSocket server implementation
- Frame processing and model integration
- Efficient data streaming
- Error handling and connection management
- Support for multiple concurrent connections
- Express.js REST API integration

## Prerequisites

- Python 3.8+ (for WebSocket server)
- Node.js (for Express server)
- pip package manager
- npm package manager

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Node.js dependencies:
```bash
npm install
```

## Project Structure

```
Backend/
├── server.js                # Express server implementation
├── server.py               # Python server implementation
├── websocket_server.py     # WebSocket server implementation
├── app.js                  # Express app configuration
├── controllers/           # Express route controllers
├── middleware/            # Express middleware
├── routes/               # Express route definitions
├── models/              # Data models
├── services/            # Business logic services
├── utils/              # Utility functions
├── config/             # Configuration files
├── context/            # Application context
├── start_websocket_server.bat  # Windows startup script
├── start_websocket_server.sh   # Linux/Mac startup script
└── comprehensive_test.js       # Test suite
```

## Server Components

### WebSocket Server (Python)
- Handles real-time video frame processing
- Manages client connections
- Coordinates with ML model
- Configuration in `websocket_server.py`:
```python
HOST = "0.0.0.0"  # Listen on all available interfaces
PORT = 8765       # WebSocket server port
```

### Express Server (Node.js)
- REST API endpoints
- User management
- Session handling
- Configuration in `app.js`

## Running the Servers

### WebSocket Server

#### Windows
```bash
start_websocket_server.bat
```

#### Linux/Mac
```bash
./start_websocket_server.sh
```

### Express Server
```bash
npm start
```

## Development

### Adding New Features

1. WebSocket Features:
   - Add new message handlers in `websocket_server.py`
   - Implement frame processing in appropriate modules
   - Update client communication protocols

2. REST API Features:
   - Create routes in `routes/` directory
   - Implement controllers in `controllers/`
   - Add services in `services/` directory

### Best Practices

- Use async/await for asynchronous operations
- Implement proper error handling and logging
- Monitor server performance
- Handle connection timeouts
- Follow REST API best practices
- Write comprehensive tests

## API Documentation

### WebSocket Events

1. **Client Connection**
   - Event: Connection established
   - Response: Connection acknowledgment

2. **Frame Processing**
   - Event: Receive frame
   - Processing: Extract keypoints
   - Response: Processing status

3. **Model Prediction**
   - Event: Process complete sequence
   - Response: Prediction results

### REST API Endpoints

Detailed API documentation can be found in `comprehensive_test.js`

## Troubleshooting

- **WebSocket Issues**:
  - Check if port 8765 is available
  - Verify firewall settings
  - Ensure correct IP address binding

- **Express Server Issues**:
  - Verify Node.js installation
  - Check port availability
  - Review server logs

- **Performance Issues**:
  - Monitor memory usage
  - Check frame processing speed
  - Verify network bandwidth
  - Review server logs

## Testing

Run the comprehensive test suite:
```bash
node comprehensive_test.js
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

