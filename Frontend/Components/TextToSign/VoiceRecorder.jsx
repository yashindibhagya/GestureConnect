import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Platform, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';

// Custom hook for voice recording functionality
const useVoiceRecorder = (onTranscriptionReceived, languageMode, continuousMode, onRecordingStateChange) => {
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStatus, setRecordingStatus] = useState('idle');
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const durationTimerRef = useRef(null);
    const audioMonitorRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const continuousRecordingRef = useRef(false);

    // IMPORTANT: Update this with your actual backend URL
    // For local development, use your computer's local IP address
    // Find it by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
    const API_URL = 'http://192.168.1.100:5000/api/transcribe';

    // Get appropriate language code based on current language mode
    const getLanguageCode = () => {
        switch (languageMode) {
            case 'english': return 'en-US';
            case 'sinhala': return 'si-LK';
            case 'tamil': return 'ta-IN';
            default: return 'en-US';
        }
    };

    // Update recording state to parent component
    useEffect(() => {
        if (onRecordingStateChange) {
            onRecordingStateChange(isRecording);
        }
    }, [isRecording]);

    // Handle continuous recording mode
    useEffect(() => {
        continuousRecordingRef.current = continuousMode;

        if (continuousMode && hasPermission && !isRecording) {
            // Start recording when continuous mode is enabled
            startRecording();
        } else if (!continuousMode && isRecording && continuousRecordingRef.current) {
            // Stop recording when continuous mode is disabled
            stopRecording();
        }
    }, [continuousMode, hasPermission]);

    // Initialize voice recording
    useEffect(() => {
        const requestPermissions = async () => {
            try {
                const { status } = await Audio.requestPermissionsAsync();
                setHasPermission(status === 'granted');

                if (status === 'granted') {
                    await Audio.setAudioModeAsync({
                        allowsRecordingIOS: true,
                        playsInSilentModeIOS: true,
                        staysActiveInBackground: false,
                        interruptionModeIOS: 1,
                        interruptionModeAndroid: 1,
                    });
                } else {
                    Alert.alert(
                        'Microphone Permission Required',
                        'Please enable microphone access in your device settings to use voice recording.',
                        [{ text: 'OK' }]
                    );
                }
            } catch (err) {
                console.error('Failed to get recording permissions', err);
                Alert.alert('Microphone Error', `Couldn't access the microphone: ${err.message}`);
            }
        };

        requestPermissions();

        // Cleanup function
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync().catch(console.error);
            }
            if (durationTimerRef.current) {
                clearInterval(durationTimerRef.current);
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
            }
            if (audioMonitorRef.current) {
                clearInterval(audioMonitorRef.current);
            }
        };
    }, []);

    // Animate the recording indicator
    useEffect(() => {
        let pulseAnimation;

        if (isRecording) {
            pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.5,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimation.start();
        } else {
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }

        return () => {
            if (pulseAnimation) {
                pulseAnimation.stop();
            }
        };
    }, [isRecording, pulseAnim]);

    // Start recording
    const startRecording = async () => {
        if (!hasPermission) {
            Alert.alert(
                'Permission Required',
                'Please enable microphone access to use voice recording.'
            );
            return;
        }

        try {
            // Add haptic feedback if available
            try {
                if (Platform.OS === 'ios') {
                    const Haptics = require('expo-haptics');
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
            } catch (err) {
                // Haptics not available, continue anyway
            }

            setRecordingStatus('preparing');

            // Prepare recording options optimized for speech
            const recordingOptions = {
                android: {
                    extension: '.m4a',
                    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
                    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.m4a',
                    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
                    sampleRate: 44100,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
            };

            // Create and start a new recording
            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(recordingOptions);
            await newRecording.startAsync();

            setRecording(newRecording);
            setIsRecording(true);
            setRecordingStatus('recording');
            setAudioLevel(0);

            // Start monitoring for audio levels
            startAudioLevelMonitoring(newRecording);

            // Start recording duration timer
            setRecordingDuration(0);
            if (durationTimerRef.current) {
                clearInterval(durationTimerRef.current);
            }

            durationTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => {
                    // In continuous mode, auto-stop and restart after segments
                    if (continuousRecordingRef.current && prev >= 25) {
                        // Stop current recording and process it
                        stopRecording(true); // Pass true to indicate auto-restart
                        return 0;
                    } else if (!continuousRecordingRef.current && prev >= 30) {
                        // In manual mode, stop at 30 seconds
                        stopRecording();
                        return 30;
                    }
                    return prev + 1;
                });
            }, 1000);

            // Setup auto-stop after 3 seconds of silence (only in manual mode)
            if (!continuousRecordingRef.current) {
                startSilenceDetection();
            }

        } catch (err) {
            console.error('Failed to start recording', err);
            setRecordingStatus('idle');
            setIsRecording(false);
            Alert.alert('Recording Error', `Couldn't start recording: ${err.message}`);
        }
    };

    // Start monitoring audio levels
    const startAudioLevelMonitoring = (recordingInstance) => {
        if (audioMonitorRef.current) {
            clearInterval(audioMonitorRef.current);
        }

        audioMonitorRef.current = setInterval(async () => {
            if (recordingInstance && recordingInstance._canRecord) {
                try {
                    const status = await recordingInstance.getStatusAsync();
                    if (status && status.metering !== undefined) {
                        const level = Math.max(0, (status.metering + 100) / 100);
                        setAudioLevel(level);

                        // Reset silence timer if there's audio activity (only in manual mode)
                        if (level > 0.15 && !continuousRecordingRef.current) {
                            resetSilenceDetection();
                        }
                    }
                } catch (err) {
                    console.log('Error monitoring audio levels:', err);
                }
            }
        }, 200);
    };

    // Start silence detection (only for manual mode)
    const startSilenceDetection = () => {
        resetSilenceDetection();
    };

    // Reset silence detection timer
    const resetSilenceDetection = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }

        // Only auto-stop on silence in manual mode
        if (!continuousRecordingRef.current) {
            silenceTimerRef.current = setTimeout(() => {
                if (isRecording && recordingDuration >= 2) {
                    stopRecording();
                }
            }, 3000); // 3 seconds of silence
        }
    };

    // Stop recording
    const stopRecording = async (autoRestart = false) => {
        if (!recording) return;

        try {
            // Haptic feedback
            try {
                if (Platform.OS === 'ios') {
                    const Haptics = require('expo-haptics');
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
            } catch (err) {
                // Haptics not available
            }

            const wasRecording = isRecording;
            setIsRecording(false);
            setRecordingStatus('processing');

            // Clear all timers
            if (durationTimerRef.current) {
                clearInterval(durationTimerRef.current);
                durationTimerRef.current = null;
            }
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
                silenceTimerRef.current = null;
            }
            if (audioMonitorRef.current) {
                clearInterval(audioMonitorRef.current);
                audioMonitorRef.current = null;
            }

            // Stop and get the recording URI
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);

            // Process the recording
            if (uri && wasRecording) {
                await processRecording(uri);
            }

            // Auto-restart if in continuous mode
            if (autoRestart && continuousRecordingRef.current) {
                // Small delay before restarting
                setTimeout(() => {
                    if (continuousRecordingRef.current) {
                        startRecording();
                    }
                }, 500);
            }

        } catch (err) {
            console.error('Error stopping recording', err);
            setRecordingStatus('idle');
            setRecording(null);
            setIsRecording(false);
        }
    };

    // Process the recording with the backend API
    const processRecording = async (uri) => {
        setRecordingStatus('processing');

        try {
            // Check if the recording exists
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (!fileInfo.exists) {
                throw new Error('Recording file not found');
            }

            // Check file size (minimum 1KB to ensure we have audio)
            if (fileInfo.size < 1000) {
                console.log('Recording too short, skipping transcription');
                setRecordingStatus('idle');
                return;
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('audio', {
                uri,
                type: 'audio/m4a',
                name: `recording-${Date.now()}.m4a`
            });
            formData.append('language', getLanguageCode());

            console.log(`Sending audio to ${API_URL}...`);

            // Use a timeout for the request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds

            let response;
            try {
                response = await fetch(API_URL, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                    }
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Unknown error');
                throw new Error(`Server error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (data && data.text && data.text.trim()) {
                console.log('Transcription received:', data.text);
                if (onTranscriptionReceived) {
                    onTranscriptionReceived(data.text);
                }
            } else {
                console.log('No speech detected in recording');
            }

        } catch (err) {
            console.error('Error processing recording:', err);

            // Only show error alert if not in continuous mode
            if (!continuousRecordingRef.current) {
                let message = 'Unable to transcribe audio. ';

                if (err.name === 'AbortError') {
                    message += 'Request timed out. Please try again.';
                } else if (err.message.includes('Network request failed')) {
                    message = 'Cannot reach transcription service.\n\n';
                    message += 'Please check:\n';
                    message += '• Your backend server is running\n';
                    message += '• Your phone and computer are on the same WiFi\n';
                    message += `• The API URL is correct: ${API_URL}`;
                } else {
                    message += err.message;
                }

                Alert.alert('Transcription Error', message, [{ text: 'OK' }]);
            }
        } finally {
            setRecordingStatus('idle');
        }
    };

    return {
        isRecording,
        recordingStatus,
        recordingDuration,
        hasPermission,
        audioLevel,
        pulseAnim,
        startRecording,
        stopRecording,
    };
};

// Voice Recorder Component
const VoiceRecorder = ({
    onTranscriptionReceived,
    languageMode,
    continuousMode = false,
    onRecordingStateChange
}) => {
    const {
        isRecording,
        recordingStatus,
        recordingDuration,
        hasPermission,
        audioLevel,
        pulseAnim,
        startRecording,
        stopRecording,
    } = useVoiceRecorder(onTranscriptionReceived, languageMode, continuousMode, onRecordingStateChange);

    // Request permission if not granted
    const requestPermission = async () => {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission Denied',
                'Microphone access is required for voice recording. Please enable it in your device settings.',
                [{ text: 'OK' }]
            );
        }
        return status === 'granted';
    };

    // Language-specific mic button tooltip
    const getLanguageTooltip = () => {
        switch (languageMode) {
            case 'english':
                return "Speak in English";
            case 'sinhala':
                return "Speak in Sinhala";
            case 'tamil':
                return "Speak in Tamil";
            default:
                return "Speak now";
        }
    };

    // Calculate dot size based on audio level
    const getDotSize = () => {
        return 10 + (audioLevel * 15);
    };

    // In continuous mode, don't show the button - recording indicator is always visible
    if (continuousMode) {
        if (recordingStatus === 'processing') {
            return (
                <View style={styles.recordingStatusContainer}>
                    <ActivityIndicator size="small" color="#4C9EFF" />
                    <Text style={styles.recordingStatusText}>Processing...</Text>
                </View>
            );
        }

        if (isRecording) {
            return (
                <View style={styles.continuousRecordingContainer}>
                    <Animated.View
                        style={[
                            styles.recordingDot,
                            {
                                transform: [{ scale: pulseAnim }],
                                width: getDotSize(),
                                height: getDotSize(),
                            }
                        ]}
                    />
                    <Text style={styles.continuousRecordingText}>Listening...</Text>
                </View>
            );
        }

        return null;
    }

    // Manual mode UI
    if (!hasPermission && recordingStatus === 'idle') {
        return (
            <TouchableOpacity
                style={styles.micPermissionButton}
                onPress={requestPermission}
            >
                <MaterialIcons name="mic-off" size={24} color="#D32F2F" />
            </TouchableOpacity>
        );
    }

    if (recordingStatus === 'preparing') {
        return (
            <View style={styles.recordingStatusContainer}>
                <ActivityIndicator size="small" color="#FF9800" />
                <Text style={styles.recordingStatusText}>Preparing...</Text>
            </View>
        );
    }

    if (recordingStatus === 'processing') {
        return (
            <View style={styles.recordingStatusContainer}>
                <ActivityIndicator size="small" color="#4C9EFF" />
                <Text style={styles.recordingStatusText}>Processing...</Text>
            </View>
        );
    }

    if (isRecording) {
        const remainingTime = 30 - recordingDuration;
        const isTimeRunningOut = remainingTime <= 5;

        return (
            <View style={styles.recordingContainer}>
                <View style={styles.recordingIndicator}>
                    <Animated.View
                        style={[
                            styles.recordingDot,
                            isTimeRunningOut && styles.recordingDotWarning,
                            {
                                transform: [{ scale: pulseAnim }],
                                width: getDotSize(),
                                height: getDotSize(),
                            }
                        ]}
                    />
                    <Text style={[
                        styles.recordingTime,
                        isTimeRunningOut && styles.recordingTimeWarning
                    ]}>
                        {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:
                        {(recordingDuration % 60).toString().padStart(2, '0')}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.stopRecordingButton}
                    onPress={() => stopRecording(false)}
                >
                    <FontAwesome name="stop" size={16} color="white" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.micButton,
                {
                    borderColor:
                        languageMode === 'english' ? '#FF9800' :
                            languageMode === 'sinhala' ? '#4C9EFF' :
                                '#9C27B0'
                }
            ]}
            onPress={startRecording}
        >
            <MaterialIcons
                name="mic"
                size={24}
                color={
                    languageMode === 'english' ? '#FF9800' :
                        languageMode === 'sinhala' ? '#4C9EFF' :
                            '#9C27B0'
                }
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    micButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    micPermissionButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D32F2F',
        alignSelf: 'flex-start',
    },
    recordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFEBEE',
        borderRadius: 25,
        paddingHorizontal: 12,
        paddingVertical: 6,
        minWidth: 130,
    },
    continuousRecordingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    continuousRecordingText: {
        color: '#2E7D32',
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF3B30',
        marginRight: 8,
    },
    recordingDotWarning: {
        backgroundColor: '#FFC107',
    },
    recordingTime: {
        fontSize: 14,
        color: '#333',
    },
    recordingTimeWarning: {
        color: '#D32F2F',
        fontWeight: 'bold',
    },
    stopRecordingButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordingStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: 170,
    },
    recordingStatusText: {
        color: '#1976D2',
        marginLeft: 8,
        fontSize: 14,
    },
});

export default VoiceRecorder;