import { View, Text, StyleSheet, Dimensions, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import { VideoContext } from '../../context/VideoContext';

export default function ChapterView() {
    const { id, courseId, chapterIndex } = useLocalSearchParams();
    const router = useRouter();
    const videoRef = useRef(null);

    const { signsData, coursesData, markSignAsCompleted, getCourseProgress, userProgress } = useContext(VideoContext);

    const [sign, setSign] = useState(null);
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [videoStatus, setVideoStatus] = useState({});
    const [showInfo, setShowInfo] = useState(false);

    // Find the sign and its course
    useEffect(() => {
        console.log("ChapterView: Loading sign with ID:", id);
        console.log("ChapterView: Course ID:", courseId);

        // Find the sign
        const foundSign = signsData.find(s => s.signId === id);
        if (foundSign) {
            console.log("ChapterView: Found sign:", foundSign.word);
            setSign(foundSign);
        } else {
            console.warn("ChapterView: Could not find sign with ID:", id);
        }

        // Find the course
        if (courseId) {
            const foundCourse = coursesData.find(c => c.id === courseId);
            if (foundCourse) {
                console.log("ChapterView: Found course:", foundCourse.title);
                setCourse(foundCourse);
            } else {
                console.warn("ChapterView: Could not find course with ID:", courseId);
            }
        }

        setIsLoading(false);
    }, [id, courseId, signsData, coursesData]);

    // Handle video status updates
    const handleVideoStatus = (status) => {
        setVideoStatus(status);
        setIsVideoLoading(false);

        // Mark sign as completed when video is finished
        if (status.didJustFinish && sign) {
            markSignAsCompleted(sign.signId);
        }
    };

    // Handle completion and navigation
    const handleComplete = async () => {
        // Mark the sign as completed
        if (sign) {
            await markSignAsCompleted(sign.signId);
        }

        // If we have a course ID, navigate back to the course view
        if (courseId) {
            router.replace(`/learning/${courseId}`);
        } else {
            router.back();
        }
    };

    // Handle navigation to the next sign
    const handleNext = () => {
        if (!course || !course.signs || parseInt(chapterIndex) >= course.signs.length - 1) {
            // We're at the last sign in the course, go back to course view
            router.replace(`/learning/${courseId}`);
        } else {
            // Go to the next sign
            const nextIndex = parseInt(chapterIndex) + 1;
            const nextSign = course.signs[nextIndex];

            if (nextSign) {
                router.replace({
                    pathname: `/learning/chapter/${nextSign.signId}`,
                    params: {
                        courseId: courseId,
                        chapterIndex: nextIndex.toString()
                    }
                });
            }
        }
    };

    // Get progress in the course
    const getProgress = () => {
        if (!course) return 0;

        const progress = getCourseProgress(courseId);
        return progress.percentage / 100; // Convert percentage to decimal for Progress.Bar
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C9EFF" />
                    <Text>Loading sign...</Text>
                </View>
            </SafeAreaView>
        );
    }

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
                        <Text style={styles.backToCoursesText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{sign.word}</Text>
            </View>

            {/* Progress Bar */}
            {course && (
                <View style={styles.progressBarContainer}>
                    <Progress.Bar
                        progress={getProgress()}
                        color='#3c0061'
                        width={Dimensions.get('screen').width * 0.85}
                        height={8}
                    />
                    <Text style={styles.progressText}>
                        Sign {parseInt(chapterIndex) + 1} of {course.signs.length}
                    </Text>
                </View>
            )}

            {/* Video Player */}
            <View style={styles.videoContainer}>
                {isVideoLoading && (
                    <View style={styles.videoLoadingContainer}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
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

            {/* Sign Information */}
            <View style={styles.infoContainer}>
                <TouchableOpacity
                    style={styles.infoToggleButton}
                    onPress={() => setShowInfo(!showInfo)}
                >
                    <Text style={styles.infoToggleText}>
                        {showInfo ? "Hide Information" : "Show Information"}
                    </Text>
                    <Ionicons
                        name={showInfo ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#4C9EFF"
                    />
                </TouchableOpacity>

                {showInfo && (
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>How to sign "{sign.word}"</Text>
                        <Text style={styles.infoText}>
                            Watch the video and practice the sign. You can replay the video as many times as you need.
                            When you're confident you can sign it, mark it as completed.
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
                )}
            </View>

            {/* Video Controls */}
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
                    onPress={handleComplete}
                >
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    <Text style={styles.completeButtonText}>
                        {userProgress[sign.signId]?.completed
                            ? "Completed"
                            : "Mark as Completed"
                        }
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Navigation Buttons */}
            <View style={styles.navigationButtonsContainer}>
                <TouchableOpacity
                    style={styles.navigationButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.navigationButtonText}>Back to List</Text>
                </TouchableOpacity>

                {course && parseInt(chapterIndex) < course.signs.length - 1 && (
                    <TouchableOpacity
                        style={[styles.navigationButton, styles.nextButton]}
                        onPress={handleNext}
                    >
                        <Text style={styles.nextButtonText}>Next Sign</Text>
                        <Ionicons name="arrow-forward" size={20} color="#4C9EFF" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    progressBarContainer: {
        padding: 16,
        alignItems: 'center',
    },
    progressText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666666',
    },
    videoContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#000000',
        position: 'relative',
    },
    videoLoadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1,
    },
    video: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        padding: 16,
    },
    infoToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    infoToggleText: {
        color: '#4C9EFF',
        fontWeight: 'bold',
        marginRight: 8,
    },
    infoContent: {
        marginTop: 8,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
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
    navigationButtonsContainer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    navigationButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    navigationButtonText: {
        color: '#666666',
        fontSize: 16,
    },
    nextButton: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    nextButtonText: {
        color: '#4C9EFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
});