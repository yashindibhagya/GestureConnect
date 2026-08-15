import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import SignVideoPlayer from '../../Components/Shared/SignVideoPlayer';
import { useVideo } from '../../context/VideoContext';
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

export default function ChapterView() {
    const router = useRouter();
    const { signId, courseId } = useLocalSearchParams();
    const { signsData, coursesData, markSignAsCompleted, userProgress, isLoading } = useVideo();

    const [sign, setSign] = useState(null);
    const [course, setCourse] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [nextSign, setNextSign] = useState(null);
    const [prevSign, setPrevSign] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Load sign and course data when component mounts
    useEffect(() => {
        if (isLoading || !signsData || !coursesData) return;

        const loadData = async () => {
            try {
                // Find the sign by ID
                const currentSign = signsData.find(s => s.signId === signId);
                if (currentSign) {
                    setSign(currentSign);

                    // Check if the sign is already marked as completed
                    setIsCompleted(userProgress[signId]?.completed || false);
                }

                // Find the course by ID
                if (courseId) {
                    // First try to get from context
                    let currentCourse = coursesData.find(c => c.id === courseId);

                    // If not found in context, try to get from Firestore
                    if (!currentCourse) {
                        const courseDoc = await getDoc(doc(db, 'Courses', courseId));
                        if (courseDoc.exists()) {
                            currentCourse = { ...courseDoc.data(), id: courseId };
                        }
                    }

                    if (currentCourse) {
                        setCourse(currentCourse);

                        // Find next and previous signs in this course
                        const courseSignIds = currentCourse.signs?.map(s => s.signId) || [];
                        const currentIndex = courseSignIds.indexOf(signId);

                        if (currentIndex > 0) {
                            setPrevSign(currentCourse.signs[currentIndex - 1]);
                        }

                        if (currentIndex < courseSignIds.length - 1) {
                            setNextSign(currentCourse.signs[currentIndex + 1]);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
                Alert.alert('Error', 'Failed to load chapter data. Please try again.');
            }
        };

        loadData();
    }, [signId, courseId, signsData, coursesData, userProgress, isLoading]);

    // In handleMarkCompleted function 
    const handleMarkCompleted = async () => {
        if (!signId || isCompleted || isUpdating) return;

        setIsUpdating(true);
        try {
            // Update the course completion status using the context function
            // This will save to the user's progress collection, not the course document
            await markSignAsCompleted(signId);

            setIsCompleted(true);
        } catch (error) {
            console.error('Error marking as completed:', error);
            Alert.alert('Error', 'Failed to update progress. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    // Navigate to the next sign
    const handleNextSign = () => {
        if (nextSign) {
            router.replace({
                pathname: '/chapterView/[signId]',
                params: { signId: nextSign.signId, courseId }
            });
        }
    };

    // Navigate to the previous sign
    const handlePrevSign = () => {
        if (prevSign) {
            router.replace({
                pathname: '/chapterView/[signId]',
                params: { signId: prevSign.signId, courseId }
            });
        }
    };

    // Return to the course view
    const returnToCourse = () => {
        if (courseId) {
            router.replace({
                pathname: '/courseView/[id]',
                params: { id: courseId }
            });
        } else {
            router.back();
        }
    };

    // Loading state
    if (isLoading || !sign) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C9EFF" />
                    <Text style={styles.loadingText}>Loading sign...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={returnToCourse}>
                    <MaterialIcons name="arrow-back" size={moderateScale(24)} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{sign.word}</Text>
                {isCompleted && (
                    <MaterialIcons name="check-circle" size={moderateScale(24)} color="#4CAF50" style={styles.completedIcon} />
                )}
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
                {/* Video Player */}
                <SignVideoPlayer
                    videoUrl={sign.videoUrl}
                    title={sign.word}
                    onComplete={handleMarkCompleted}
                    autoPlay={true}
                    onNext={nextSign ? handleNextSign : null}
                    onPrevious={prevSign ? handlePrevSign : null}
                    isCompleted={isCompleted}
                />

                {/* Sign Details */}
                <View style={styles.signDetailsContainer}>
                    <Text style={styles.signTitle}>{sign.word}</Text>

                    {sign.sinhalaWord && (
                        <View style={styles.translationContainer}>
                            <Text style={styles.translationLabel}>Sinhala:</Text>
                            <Text style={styles.translationText}>
                                {typeof sign.sinhalaWord === 'string'
                                    ? sign.sinhalaWord
                                    : Array.isArray(sign.sinhalaWord)
                                        ? sign.sinhalaWord.join(', ')
                                        : ''}
                            </Text>
                        </View>
                    )}

                    {sign.sinhalaTranslit && (
                        <View style={styles.translationContainer}>
                            <Text style={styles.translationLabel}>Pronunciation:</Text>
                            <Text style={styles.translationText}>
                                {typeof sign.sinhalaTranslit === 'string'
                                    ? sign.sinhalaTranslit
                                    : Array.isArray(sign.sinhalaTranslit)
                                        ? sign.sinhalaTranslit.join(', ')
                                        : ''}
                            </Text>
                        </View>
                    )}

                    {sign.relatedSigns && sign.relatedSigns.length > 0 && (
                        <View style={styles.relatedSignsContainer}>
                            <Text style={styles.relatedSignsLabel}>Related Signs:</Text>
                            <Text style={styles.relatedSignsText}>
                                {sign.relatedSigns.join(', ')}
                            </Text>
                        </View>
                    )}

                    {/* Navigation Buttons */}
                    <View style={styles.navigationButtonsContainer}>
                        {prevSign && (
                            <TouchableOpacity
                                style={[styles.navigationButton, styles.prevButton]}
                                onPress={handlePrevSign}
                            >
                                <MaterialIcons name="chevron-left" size={moderateScale(20)} color="#4C9EFF" />
                                <Text style={styles.navigationButtonText}>Previous</Text>
                            </TouchableOpacity>
                        )}

                        {nextSign && (
                            <TouchableOpacity
                                style={[styles.navigationButton, styles.nextButton]}
                                onPress={handleNextSign}
                            >
                                <Text style={styles.navigationButtonText}>Next</Text>
                                <MaterialIcons name="chevron-right" size={moderateScale(20)} color="#4C9EFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Mark as Completed button (fixed at bottom) */}
            {!isCompleted && (
                <View style={styles.bottomButtonContainer}>
                    <TouchableOpacity
                        style={styles.markCompletedButton}
                        onPress={handleMarkCompleted}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <MaterialIcons name="check-circle" size={moderateScale(20)} color="#FFFFFF" />
                                <Text style={styles.markCompletedButtonText}>
                                    Mark as Completed
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
    loadingText: {
        marginTop: verticalScale(10),
        fontSize: fontSize(16),
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        marginTop: verticalScale(50)
    },
    backButton: {
        padding: moderateScale(4),
    },
    headerTitle: {
        fontSize: fontSize(18),
        fontWeight: 'bold',
        marginLeft: scale(16),
        flex: 1,
        color: '#333',
    },
    completedIcon: {
        marginLeft: scale(8),
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        padding: moderateScale(16),
        paddingBottom: 100, // Extra space for the fixed button
    },
    signDetailsContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: moderateScale(8),
        padding: moderateScale(16),
        marginBottom: verticalScale(16),
    },
    signTitle: {
        fontSize: fontSize(24),
        fontWeight: 'bold',
        marginBottom: verticalScale(16),
        color: '#333',
    },
    translationContainer: {
        flexDirection: 'row',
        marginBottom: verticalScale(8),
        flexWrap: 'wrap',
    },
    translationLabel: {
        fontSize: fontSize(16),
        fontWeight: 'bold',
        marginRight: scale(8),
        color: '#666',
    },
    translationText: {
        fontSize: fontSize(16),
        color: '#333',
        flex: 1,
    },
    relatedSignsContainer: {
        marginTop: verticalScale(12),
        marginBottom: verticalScale(16),
    },
    relatedSignsLabel: {
        fontSize: fontSize(16),
        fontWeight: 'bold',
        marginBottom: verticalScale(4),
        color: '#666',
    },
    relatedSignsText: {
        fontSize: fontSize(16),
        color: '#333',
    },
    navigationButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: verticalScale(16),
    },
    navigationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(8),
    },
    prevButton: {
        alignSelf: 'flex-start',
    },
    nextButton: {
        alignSelf: 'flex-end',
    },
    navigationButtonText: {
        fontSize: fontSize(16),
        color: '#4C9EFF',
        fontWeight: '500',
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: moderateScale(16),
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    markCompletedButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(12),
        borderRadius: moderateScale(8),
    },
    markCompletedButtonText: {
        color: '#FFFFFF',
        fontSize: fontSize(16),
        fontWeight: 'bold',
        marginLeft: scale(8),
    },
});