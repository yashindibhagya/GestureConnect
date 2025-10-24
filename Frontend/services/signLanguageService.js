import axios from 'axios';
import { Platform } from 'react-native';

const MODEL_PORT = 8080;

// Get the appropriate API URL based on platform and environment
const getApiUrl = () => {
    if (Platform.OS === 'android') {
        // Android emulator uses 10.0.2.2 to access host machine
        return `http://10.0.2.2:${MODEL_PORT}`;
    } else if (Platform.OS === 'ios') {
        // iOS simulator uses localhost
        return `http://localhost:${MODEL_PORT}`;
    } else {
        // For web or unknown platforms
        return `http://localhost:${MODEL_PORT}`;
    }
};

class SignLanguageService {
    constructor() {
        this.baseURL = getApiUrl();
        console.log('SignLanguageService initialized with baseURL:', this.baseURL);

        this.axios = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 5000 // 5 second timeout
        });

        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 2000; // 2 seconds
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async checkConnection() {
        try {
            if (this.connectionAttempts >= this.maxRetries) {
                console.error('Maximum connection attempts reached');
                throw new Error('Maximum connection attempts reached');
            }

            this.connectionAttempts++;
            console.log(`Attempting to connect to server (attempt ${this.connectionAttempts}/${this.maxRetries})`);

            const response = await this.axios.get('/');
            console.log('Server response:', response.data);

            this.isConnected = true;
            this.connectionAttempts = 0; // Reset attempts on successful connection
            console.log('Successfully connected to model server');
            return true;

        } catch (error) {
            console.error('Connection attempt failed:', error.message);
            this.isConnected = false;

            if (this.connectionAttempts < this.maxRetries) {
                console.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
                await this.delay(this.retryDelay);
                return this.checkConnection();
            }
            return false;
        }
    }

    async sendFrame(frameData) {
        try {
            if (!this.isConnected) {
                const connected = await this.checkConnection();
                if (!connected) {
                    throw new Error('Not connected to model server');
                }
            }

            const response = await this.axios.post('/predict/frame', frameData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error sending frame:', error.message);
            throw error;
        }
    }

    async getPrediction() {
        try {
            if (!this.isConnected) {
                const connected = await this.checkConnection();
                if (!connected) {
                    throw new Error('Not connected to model server');
                }
            }

            const response = await this.axios.get('/predict');
            return response.data;
        } catch (error) {
            console.error('Error getting prediction:', error.message);
            throw error;
        }
    }

    async sendKeypoints(keypoints, frameIndex) {
        try {
            if (!this.isConnected) {
                const connected = await this.checkConnection();
                if (!connected) {
                    throw new Error('Not connected to model server');
                }
            }

            const response = await this.axios.post('/predict/keypoints', {
                frame_index: frameIndex,
                keypoints: keypoints,
            });
            return response.data;
        } catch (error) {
            console.error('Error sending keypoints:', error.message);
            throw error;
        }
    }

    async resetSequence() {
        try {
            if (!this.isConnected) {
                const connected = await this.checkConnection();
                if (!connected) {
                    throw new Error('Not connected to model server');
                }
            }

            const response = await this.axios.post('/reset');
            return response.data;
        } catch (error) {
            console.error('Error resetting sequence:', error.message);
            throw error;
        }
    }

    async getAvailableActions() {
        try {
            if (!this.isConnected) {
                const connected = await this.checkConnection();
                if (!connected) {
                    throw new Error('Not connected to model server');
                }
            }

            const response = await this.axios.get('/actions');
            return response.data;
        } catch (error) {
            console.error('Error getting actions:', error.message);
            throw error;
        }
    }
}

export default new SignLanguageService(); 