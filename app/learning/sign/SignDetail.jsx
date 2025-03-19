import React, { useContext, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { Video } from 'expo-av';
import { VideoContext } from '../../../context/VideoContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SignDetail() {
    const { id, courseId } = useLocalSearchParams();
    const router = useRouter();
    const { signsData, markSignAsCompleted } = useContext(VideoContext);
    const [videoStatus, setVideoStatus] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const videoRef = useRef(null);

    // Find the current sign
    const sign = signsData.find(sign => sign.signId === id);

    // Handle video status updates
    const handleVideoStatus = (status) => {
        setVideoStatus(status);
        setIsLoading(false);

        // Mark sign as completed when video is finished
        if (status.didJustFinish && sign) {
            markSignAsCompleted(sign.signId);
        }
    };

    // Mark as completed manually
    const handleMarkComplete = async () => {
        if (sign) {
            await markSignAsCompleted(sign.signId);
            // Show feedback to user that sign was marked as completed
            alert('Sign marked as completed!');
        }
    };

    // Go back to course
    const handleBackToList = () => {
        router.push({
            pathname: `/learning/${courseId}`
        });
    };

    if (!sign) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Sign Not Found</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={60} color="#FF9800" />
                    <Text style={styles.errorText}>
                        Could not find sign with ID: {id}
                    </Text>
                    <TouchableOpacity
                        style={styles.backToCoursesButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backToCoursesText}>Back to Course</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{sign.word}</Text>
            </View>

            <View style={styles.videoContainer}>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#4C9EFF" />
                    </View>
                )}

                <Video
                    ref={videoRef}
                    source={{ uri: sign.videoUrl }}
                    style={styles.video}
                    useNativeControls
                    resizeMode="contain"
                    isLooping={false}
                    onPlaybackStatusUpdate={handleVideoStatus}
                    shouldPlay
                />
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>How to sign "{sign.word}"</Text>
                <Text style={styles.infoText}>
                    Watch the video and practice the sign. You can replay the video as many times as you need.
                    When you're confident you can do it, mark it as completed.
                </Text>

                {sign.relatedSigns && sign.relatedSigns.length > 0 && (
                    <View style={styles.relatedContainer}>
                        <Text style={styles.relatedTitle}>Related signs:</Text>
                        <View style={styles.relatedTags}>
                            {sign.relatedSigns.map((related, index) => (
                                <View key={index} style={styles.relatedTag}>
                                    <Text style={styles.relatedTagText}>{related}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={styles.controlButton}
                    onPress={async () => {
                        if (videoRef.current) {
                            await videoRef.current.replayAsync();
                        }
                    }}
                >
                    <Ionicons name="refresh" size={24} color="#4C9EFF" />
                    <Text style={styles.controlButtonText}>Replay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={handleMarkComplete}
                >
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>Mark as Completed</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.navigationButtons}>
                <TouchableOpacity style={styles.navButton} onPress={handleBackToList}>
                    <Text style={styles.navButtonText}>Back to List</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
    },
    videoContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#000000',
        position: 'relative',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        padding: 16,
    },
    infoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
        marginBottom: 16,
    },
    relatedContainer: {
        marginTop: 16,
    },
    relatedTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    relatedTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    relatedTag: {
        backgroundColor: '#E3F2FD',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    relatedTagText: {
        color: '#1976D2',
        fontSize: 14,
    },
    controlsContainer: {
        flexDirection: 'row',
        padding: 16,
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    controlButtonText: {
        color: '#4C9EFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    navigationButtons: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        justifyContent: 'center',
    },
    navButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    navButtonText: {
        color: '#666666',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        marginBottom: 24,
        textAlign: 'center',
    },
    backToCoursesButton: {
        backgroundColor: '#4C9EFF',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    backToCoursesText: {
        color: 'white',
        fontWeight: 'bold',
    },
});