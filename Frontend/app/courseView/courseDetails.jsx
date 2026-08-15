import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useVideo } from '../../context/VideoContext';
import Button from '../../Components/Shared/Button';
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

export default function CourseDetailsView() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { coursesData, userProgress, isLoading } = useVideo();

    const [courseDetails, setCourseDetails] = useState(null);
    const [isLocalLoading, setIsLocalLoading] = useState(true);
    const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });

    // Load course details
    useEffect(() => {
        if (!id) return;

        const fetchCourseDetails = async () => {
            setIsLocalLoading(true);
            try {
                // First try to get from context
                let foundCourse = coursesData?.find(c => c.id === id);

                // If not found in context, try to get from Firestore
                if (!foundCourse && db) {
                    const courseDoc = await getDoc(doc(db, 'Courses', id));
                    if (courseDoc.exists()) {
                        foundCourse = { ...courseDoc.data(), id };
                    }
                }

                if (foundCourse) {
                    setCourseDetails(foundCourse);

                    // Calculate progress
                    const totalSigns = foundCourse.signs?.length || 0;
                    const signIds = foundCourse.signs?.map(sign => sign.signId) || [];
                    const completedCount = signIds.filter(signId => userProgress[signId]?.completed).length;
                    const percentage = totalSigns > 0 ? Math.round((completedCount / totalSigns) * 100) : 0;

                    setProgress({
                        completed: completedCount,
                        total: totalSigns,
                        percentage: percentage
                    });
                }
            } catch (error) {
                console.error("Error fetching course:", error);
            } finally {
                setIsLocalLoading(false);
            }
        };

        fetchCourseDetails();
    }, [id, coursesData, userProgress]);

    // Function to navigate to chapter view
    const navigateToChapter = (sign) => {
        router.push({
            pathname: '/chapterView/[signId]',
            params: { signId: sign.signId, courseId: id }
        });
    };

    // Continue learning - takes you to the next incomplete chapter
    const handleContinueLearning = () => {
        if (!courseDetails || !courseDetails.signs || courseDetails.signs.length === 0) return;

        // Find the first incomplete sign
        const nextIncompleteSign = courseDetails.signs.find(sign => !userProgress[sign.signId]?.completed);

        // If all signs are completed, go to the first one
        const signToNavigate = nextIncompleteSign || courseDetails.signs[0];

        navigateToChapter(signToNavigate);
    };

    // Render each chapter/sign item
    const renderChapterItem = ({ item, index }) => {
        // Fix: Check if the sign is completed in user's progress
        const isCompleted = item.signId && userProgress[item.signId]?.completed;
        return (
            <TouchableOpacity
                style={[styles.chapterItem, isCompleted && styles.completedChapterItem]}
                onPress={() => navigateToChapter(item)}
            >

                <View style={styles.chapterInfo}>

                    <MaterialIcons
                        name={isCompleted ? "check-circle" : "play-circle-outline"}
                        size={moderateScale(24)}
                        color={isCompleted ? "#4CAF50" : "#F7B316"}
                    />

                    <Text style={[styles.chapterTitle, isCompleted && styles.completedChapterTitle]}
                    >
                        {item.word}
                    </Text>

                </View>
            </TouchableOpacity >
        );
    };

    // Loading state
    if (isLoading || isLocalLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C9EFF" />
                    <Text style={styles.loadingText}>Loading course...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // No course found
    if (!courseDetails) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={moderateScale(24)} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Course Details</Text>
                </View>
                <View style={styles.noCourseContainer}>
                    <MaterialIcons name="error-outline" size={moderateScale(48)} color="#999" />
                    <Text style={styles.noCourseText}>Course not found</Text>
                    <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                        <Text style={styles.goBackButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#D0F3DA" barStyle="dark-content" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Course Banner */}
                <View style={[
                    styles.courseBanner,
                    { backgroundColor: '#155658' }
                ]}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => {
                            try {
                                if (router.canGoBack()) {
                                    router.back();
                                } else {
                                    // Fallback to home if there's no previous route
                                    router.replace('/(tabs)/home');
                                }
                            } catch (error) {
                                console.error('Navigation error:', error);
                                router.replace('/(tabs)/home');
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="arrow-back" size={moderateScale(24)} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.courseIconContainer}>
                        <Text style={styles.courseIcon}>{courseDetails.icon || '📚'}</Text>
                    </View>
                    <Text style={styles.courseTitle}>{courseDetails.title || 'Course Title'}</Text>
                </View>


                {/* Progress */}
                <View style={styles.progressContainer}>
                    <Text style={styles.progressText}>
                        Complete {progress.percentage}%
                    </Text>
                    <View style={styles.progressBarContainer}>
                        <View
                            style={[styles.progressBar, { width: `${progress.percentage}%` }]}
                        />
                    </View>
                </View>

                {/* Lessons Counter */}
                <View style={styles.lessonsCountContainer}>
                    <MaterialIcons name="menu-book" size={moderateScale(20)} color="#155658" />
                    <Text style={styles.lessonsCount}>
                        {courseDetails.signs?.length || 0} Lessons
                    </Text>
                </View>

                {/* Chapters List */}
                {courseDetails.signs && courseDetails.signs.length > 0 ? (
                    <FlatList
                        data={courseDetails.signs}
                        renderItem={renderChapterItem}
                        keyExtractor={(item) => item.signId}
                        scrollEnabled={false}
                        contentContainerStyle={styles.chaptersList}
                    />
                ) : (
                    <Text style={styles.noChaptersText}>No lessons available yet</Text>
                )}
            </ScrollView>

            {/* Continue Learning Button */}
            <View style={styles.continueButtonContainer}>
                <Button
                    text="Continue Learning"
                    onPress={handleContinueLearning}
                    style={styles.button}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#D0F3DA',
        marginTop: verticalScale(50)
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
    noCourseContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: moderateScale(20),
    },
    noCourseText: {
        fontSize: fontSize(18),
        color: '#666',
        marginTop: verticalScale(16),
    },
    goBackButton: {
        marginTop: verticalScale(20),
        backgroundColor: '#4C9EFF',
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(20),
        borderRadius: moderateScale(8),
    },
    goBackButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backButton: {
        padding: moderateScale(4),
        //marginTop: 20
        marginLeft: scale(-10)
    },
    headerTitle: {
        fontSize: fontSize(18),
        fontWeight: 'bold',
        marginLeft: scale(19),
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 90, // Extra space for the fixed button
    },
    courseBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(16),
        margin: moderateScale(16),
        borderRadius: moderateScale(12),
        height: verticalScale(100)
    },
    courseIconContainer: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(8),
        backgroundColor: 'rgb(255, 255, 255)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(12),
        marginLeft: scale(10)
    },
    courseIcon: {
        fontSize: fontSize(24),
    },
    courseTitle: {
        fontSize: fontSize(20),
        fontWeight: 'bold',
        color: '#fff',
    },
    aboutCourseContainer: {
        marginHorizontal: scale(16),
        marginBottom: verticalScale(16),
    },
    aboutCourseTitle: {
        fontSize: fontSize(16),
        fontWeight: 'bold',
        color: '#444',
        marginBottom: verticalScale(4),
    },
    aboutCourseText: {
        fontSize: fontSize(14),
        color: '#666',
        lineHeight: fontSize(20),
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: scale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(16),
        marginRight: scale(16),
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4C9EFF',
    },
    tabText: {
        fontSize: fontSize(16),
        color: '#888',
    },
    activeTabText: {
        fontWeight: 'bold',
        color: '#4C9EFF',
    },
    progressContainer: {
        marginHorizontal: scale(16),
        marginTop: verticalScale(16),
    },
    progressText: {
        fontSize: fontSize(16),
        fontWeight: '500',
        color: '#000',
        marginBottom: verticalScale(8),
    },
    progressBarContainer: {
        height: verticalScale(10),
        backgroundColor: '#fff',
        borderRadius: moderateScale(3),
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#F7B316',
        borderRadius: moderateScale(3),
    },
    lessonsCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: scale(16),
        marginTop: verticalScale(24),
        marginBottom: verticalScale(12),
    },
    lessonsCount: {
        fontSize: fontSize(16),
        fontWeight: 'bold',
        marginLeft: scale(8),
        color: '#333',
    },
    chaptersList: {
        paddingHorizontal: scale(16),
    },
    chapterItem: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(8),
        marginBottom: verticalScale(8),
        overflow: 'hidden',
        height: verticalScale(60),
        flexDirection: 'row'
    },
    completedChapterItem: {
        // backgroundColor: '#E8F5E9',
        backgroundColor: '#155658',

    },
    chapterContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: moderateScale(12),
    },
    chapterTitle: {
        fontSize: fontSize(16),
        fontWeight: '600',
        color: '#000',
    },
    completedChapterTitle: {
        color: '#fff',
    },
    chapterInfo: {
        padding: moderateScale(10),
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(5)
    },
    noChaptersText: {
        textAlign: 'center',
        color: '#999',
        padding: moderateScale(16),
    },
    continueButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: moderateScale(10),
        backgroundColor: '#fff',
        borderRadius: moderateScale(15)
    },
    continueButton: {
        backgroundColor: '#4C9EFF',
        paddingVertical: verticalScale(14),
        borderRadius: moderateScale(8),
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: fontSize(16),
        fontWeight: 'bold',
    },
});