import React from 'react';
import { View, StyleSheet } from 'react-native';
import BasicSignLanguageCamera from './BasicSignLanguageCamera';
import MediaPipeUtils from '../lib/mediapipe';
import ModelBridge from '../lib/modelBridge';

/**
 * A wrapper component for BasicSignLanguageCamera that ensures proper prop handling
 * and error prevention
 */
const SignLanguageCameraWrapper = ({
    onTranslationComplete,
    onTranslationUpdate,
    onStartRecording,
    onStopRecording,
    isRecording
}) => {
    // Create safe callback functions
    const handleTranslationComplete = (text, signs) => {
        try {
            if (typeof onTranslationComplete === 'function') {
                onTranslationComplete(text, signs);
            }
        } catch (error) {
            console.error('Error in onTranslationComplete:', error);
        }
    };

    const handleTranslationUpdate = (text, signs) => {
        try {
            if (typeof onTranslationUpdate === 'function') {
                onTranslationUpdate(text, signs);
            }
        } catch (error) {
            console.error('Error in onTranslationUpdate:', error);
        }
    };

    const handleStartRecording = () => {
        try {
            if (typeof onStartRecording === 'function') {
                onStartRecording();
            }
        } catch (error) {
            console.error('Error in onStartRecording:', error);
        }
    };

    const handleStopRecording = () => {
        try {
            if (typeof onStopRecording === 'function') {
                onStopRecording();
            }
        } catch (error) {
            console.error('Error in onStopRecording:', error);
        }
    };

    // Debug logging
    console.log('SignLanguageCameraWrapper props:', {
        hasOnTranslationComplete: typeof onTranslationComplete === 'function',
        hasOnTranslationUpdate: typeof onTranslationUpdate === 'function',
        hasOnStartRecording: typeof onStartRecording === 'function',
        hasOnStopRecording: typeof onStopRecording === 'function',
        isRecording: Boolean(isRecording)
    });

    return (
        <View style={styles.container}>
            <BasicSignLanguageCamera
                onTranslationComplete={handleTranslationComplete}
                onTranslationUpdate={handleTranslationUpdate}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                isRecording={Boolean(isRecording)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: 'hidden',
    }
});

// Export as a named export first
export { SignLanguageCameraWrapper };

// Then export as default
export default SignLanguageCameraWrapper;