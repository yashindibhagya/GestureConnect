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
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { useVideo } from '../../../context/VideoContext';
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../../utils/responsive";

export default function CourseDetailsView() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { coursesData, userProgress, isLoading } = useVideo();

    const [courseDetails, setCourseDetails] = useState(null);
    const [isLocalLoading, setIsLocalLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('chapters');
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

    // Navigate to a specific sign/chapter
    const handleChapterPress = (sign) => {
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

        router.push({
            pathname: '/chapterView/[signId]',
            params: { signId: signToNavigate.signId, courseId: id }
        });
    };

    // Render each chapter/sign item
    const renderChapterItem = ({ item, index }) => {
        const isCompleted = userProgress[item.signId]?.completed;

        return (
            <TouchableOpacity
                style={[styles.chapterItem, isCompleted && styles.completedChapterItem]}
                onPress={() => handleChapterPress(item)}
            >
                <View style={[styles.chapterIconContainer, isCompleted && styles.completedChapterIconContainer]}>
                    {isCompleted ? (
                        <MaterialIcons name="check" size={moderateScale(16)} color="#fff" />
                    ) : (
                        <Text style={styles.chapterNumber}>{index + 1}</Text>
                    )}
                </View>

                <View style={styles.chapterInfo}>
                    <Text style={styles.chapterTitle}>
                        {index + 1}. {item.word}
                    </Text>
                    {item.sinhalaWord && (
                        <Text style={styles.chapterSubtitle}>
                            {typeof item.sinhalaWord === 'string'
                                ? item.sinhalaWord
                                : Array.isArray(item.sinhalaWord)
                                    ? item.sinhalaWord[0]
                                    : ''}
                        </Text>
                    )}
                </View>

                <MaterialIcons
                    name={isCompleted ? "check-circle" : "play-circle-outline"}
                    size={moderateScale(24)}
                    color={isCompleted ? "#4CAF50" : "#4C9EFF"}
                />
            </TouchableOpacity>
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
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={moderateScale(24)} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{courseDetails.title || 'Course Details'}</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.headerIcon}>
                        <Feather name="bookmark" size={moderateScale(22)} color="#333" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Course Banner */}
                <View style={[
                    styles.courseBanner,
                    { backgroundColor: courseDetails.backgroundColor || '#4C9EFF' }
                ]}>
                    <View style={styles.courseIconContainer}>
                        <Text style={styles.courseIcon}>{courseDetails.icon || '📚'}</Text>
                    </View>
                    <View style={styles.courseTitleContainer}>
                        <Text style={styles.courseTitle}>{courseDetails.title || 'Course Title'}</Text>
                        <Text style={styles.courseDescription}>{courseDetails.description || ''}</Text>
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Your Progress</Text>
                        <Text style={styles.progressPercentage}>{progress.percentage}%</Text>
                    </View>

                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress.percentage}%` }]} />
                    </View>

                    <Text style={styles.progressDetails}>
                        {progress.completed} of {progress.total} completed
                    </Text>
                </View>

                {/* Tabs Navigation */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'chapters' && styles.activeTab]}
                        onPress={() => setSelectedTab('chapters')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'chapters' && styles.activeTabText]}>
                            Chapters
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'info' && styles.activeTab]}
                        onPress={() => setSelectedTab('info')}
                    >
                        <Text style={[styles.tabText, selectedTab === 'info' && styles.activeTabText]}>
                            Info
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Chapters List */}
                {selectedTab === 'chapters' && (
                    <View style={styles.chaptersContainer}>
                        <View style={styles.chaptersHeader}>
                            <MaterialIcons name="playlist-play" size={moderateScale(20)} color="#4C9EFF" />
                            <Text style={styles.chaptersTitle}>
                                {courseDetails.signs?.length || 0} Signs to Learn
                            </Text>
                        </View>

                        {courseDetails.signs && courseDetails.signs.length > 0 ? (
                            <FlatList
                                data={courseDetails.signs}
                                renderItem={renderChapterItem}
                                keyExtractor={(item) => item.signId}
                                scrollEnabled={false}
                                contentContainerStyle={styles.chaptersList}
                            />
                        ) : (
                            <Text style={styles.noChaptersText}>No chapters available yet</Text>
                        )}
                    </View>
                )}

                {/* Course Info */}
                {selectedTab === 'info' && (
                    <View style={styles.infoContainer}>
                        <Text style={styles.infoTitle}>About This Course</Text>
                        <Text style={styles.infoDescription}>
                            {courseDetails.description || 'No description available.'}
                        </Text>

                        <Text style={styles.infoTitle}>What You&apos;ll Learn</Text>
                        <View style={styles.learningPoints}>
                            <View style={styles.learningPoint}>
                                <MaterialIcons name="check-circle" size={moderateScale(16)} color="#4CAF50" />
                                <Text style={styles.learningPointText}>Learn sign language alphabet</Text>
                            </View>
                            <View style={styles.learningPoint}>
                                <MaterialIcons name="check-circle" size={moderateScale(16)} color="#4CAF50" />
                                <Text style={styles.learningPointText}>Master common signs for everyday use</Text>
                            </View>
                            <View style={styles.learningPoint}>
                                <MaterialIcons name="check-circle" size={moderateScale(16)} color="#4CAF50" />
                                <Text style={styles.learningPointText}>Practice with video demonstrations</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Continue Learning Button */}
            <View style={styles.continueButtonContainer}>
                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={handleContinueLearning}
                >
                    <Text style={styles.continueButtonText}>Continue Learning</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
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
    },
    headerTitle: {
        fontSize: fontSize(18),
        fontWeight: 'bold',
        marginLeft: scale(16),
        flex: 1,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    headerIcon: {
        padding: moderateScale(4),
        marginLeft: scale(16),
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
    },
    courseIconContainer: {
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(16),
    },
    courseIcon: {
        fontSize: fontSize(32),
    },
    courseTitleContainer: {
        flex: 1,
    },
    courseTitle: {
        fontSize: fontSize(20),
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: verticalScale(4),
    },
    courseDescription: {
        fontSize: fontSize(14),
        color: 'rgba(255, 255, 255, 0.9)',
    },
    progressContainer: {
        margin: moderateScale(16),
        backgroundColor: '#F5F5F5',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    progressTitle: {
        fontSize: fontSize(16),
        fontWeight: 'bold',
        color: '#333',
    },
    progressPercentage: {
        fontSize: fontSize(16),
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    progressBarContainer: {
        height: verticalScale(8),
        backgroundColor: '#E0E0E0',
        borderRadius: moderateScale(4),
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: moderateScale(4),
    },
    progressDetails: {
        marginTop: verticalScale(8),
        fontSize: fontSize(14),
        color: '#666',
        textAlign: 'right',
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        marginHorizontal: scale(16),
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
        color: '#666',
    },
    activeTabText: {
        fontWeight: 'bold',
        color: '#4C9EFF',
    },
    chaptersContainer: {
        marginHorizontal: scale(16),
        marginTop: verticalScale(16),
    },
    chaptersHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(16),
    },
    chaptersTitle: {
        fontSize: fontSize(16),
        fontWeight: 'bold',
        marginLeft: scale(8),
        color: '#333',
    },
    chaptersList: {
        paddingBottom: verticalScale(16),
    },
    chapterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: verticalScale(8),
    },
    completedChapterItem: {
        backgroundColor: '#E8F5E9',
    },
    chapterIconContainer: {
        width: moderateScale(28),
        height: moderateScale(28),
        borderRadius: moderateScale(14),
        backgroundColor: '#DDD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(12),
    },
    completedChapterIconContainer: {
        backgroundColor: '#4CAF50',
    },
    chapterNumber: {
        fontSize: fontSize(12),
        fontWeight: 'bold',
        color: '#666',
    },
    chapterInfo: {
        flex: 1,
    },
    chapterTitle: {
        fontSize: fontSize(16),
        fontWeight: '500',
        color: '#333',
    },
    chapterSubtitle: {
        fontSize: fontSize(14),
        color: '#666',
        marginTop: verticalScale(4),
    },
    noChaptersText: {
        textAlign: 'center',
        color: '#999',
        padding: moderateScale(16),
    },
    infoContainer: {
        margin: moderateScale(16),
    },
    infoTitle: {
        fontSize: fontSize(18),
        fontWeight: 'bold',
        color: '#333',
        marginTop: verticalScale(16),
        marginBottom: verticalScale(8),
    },
    infoDescription: {
        fontSize: fontSize(14),
        color: '#666',
        lineHeight: fontSize(20),
    },
    learningPoints: {
        marginTop: verticalScale(8),
    },
    learningPoint: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: verticalScale(8),
    },
    learningPointText: {
        marginLeft: scale(8),
        fontSize: fontSize(14),
        color: '#333',
    },
    continueButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: moderateScale(16),
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    continueButton: {
        backgroundColor: '#4C9EFF',
        paddingVertical: verticalScale(14),
        borderRadius: moderateScale(12),
        alignItems: 'center',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: fontSize(16),
        fontWeight: 'bold',
    },
});