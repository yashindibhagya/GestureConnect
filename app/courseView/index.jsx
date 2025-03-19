import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { VideoContext } from '../../context/VideoContext';

// Sub-component for Course Introduction
const CourseIntro = ({ course, progress }) => {
    return (
        <View style={styles.introContainer}>
            <View style={[styles.courseHeader, { backgroundColor: course.backgroundColor || '#FFD8B9' }]}>
                <Text style={styles.courseIcon}>{course.icon || '📚'}</Text>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription}>{course.description}</Text>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress.percentage}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                        {progress.completed}/{progress.total} complete
                    </Text>
                </View>
            </View>
        </View>
    );
};

// Sub-component for Course Chapters (Signs)
const CourseChapters = ({ course, onPressSign, userProgress }) => {
    const router = useRouter();

    const startQuiz = () => {
        router.push(`/learning/quiz/${course.id}`);
    };

    const startFlashcards = () => {
        router.push(`/learning/flashcards/${course.id}`);
    };

    return (
        <View style={styles.chaptersContainer}>
            {/* Practice Options */}
            <View style={styles.practiceOptions}>
                <TouchableOpacity style={styles.practiceButton} onPress={startQuiz}>
                    <View style={styles.quizIcon}>
                        <Text style={styles.quizIconText}>?</Text>
                    </View>
                    <Text style={styles.practiceButtonText}>Quiz</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.practiceButton} onPress={startFlashcards}>
                    <View style={styles.flashcardIcon}>
                        <Ionicons name="card-outline" size={24} color="#FF9800" />
                    </View>
                    <Text style={styles.practiceButtonText}>Flashcards</Text>
                </TouchableOpacity>
            </View>

            {/* Chapters title */}
            <Text style={styles.chaptersTitle}>Signs in this collection</Text>

            {/* Display all signs */}
            {course.signs && course.signs.length > 0 ? (
                course.signs.map((sign, index) => {
                    const isCompleted = userProgress[sign.signId]?.completed;

                    return (
                        <TouchableOpacity
                            key={sign.signId}
                            style={styles.chapterItem}
                            onPress={() => onPressSign(sign, index)}
                        >
                            <View style={styles.chapterInfo}>
                                <Text style={styles.chapterNumber}>{index + 1}</Text>
                                <Text style={styles.chapterTitle}>{sign.word}</Text>
                            </View>

                            <View style={styles.chapterStatus}>
                                {isCompleted ? (
                                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={24} color="#999999" />
                                )}
                            </View>
                        </TouchableOpacity>
                    );
                })
            ) : (
                <Text style={styles.noSigns}>No signs available in this collection.</Text>
            )}
        </View>
    );
};

export default function CourseView() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { coursesData, userProgress, getCourseProgress, isLoading } = useContext(VideoContext);
    const [course, setCourse] = useState(null);
    const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });

    // Fetch course data when ID changes
    useEffect(() => {
        console.log("CourseView: Loading course with ID:", id);

        if (coursesData && coursesData.length > 0) {
            const foundCourse = coursesData.find(c => c.id === id);

            if (foundCourse) {
                console.log("CourseView: Found course:", foundCourse.title);
                setCourse(foundCourse);

                // Get progress data
                const progressData = getCourseProgress(id);
                setProgress(progressData);
            } else {
                console.warn("CourseView: Could not find course with ID:", id);
            }
        }
    }, [id, coursesData, userProgress]);

    // Handle press on a sign
    const handlePressSign = (sign, index) => {
        console.log("CourseView: Opening sign:", sign.word);
        router.push({
            pathname: `/learning/chapter/${sign.signId}`,
            params: {
                courseId: id,
                chapterIndex: index
            }
        });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C9EFF" />
                    <Text>Loading course...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!course) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Course Not Found</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={60} color="#FF9800" />
                    <Text style={styles.errorText}>
                        Could not find course with ID: {id}
                    </Text>
                    <TouchableOpacity
                        style={styles.backToCoursesButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backToCoursesText}>Back to Courses</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{course.title}</Text>
            </View>

            <FlatList
                data={[]} // We're using ListHeaderComponent for all content
                ListHeaderComponent={
                    <View style={styles.contentContainer}>
                        <CourseIntro course={course} progress={progress} />
                        <CourseChapters
                            course={course}
                            onPressSign={handlePressSign}
                            userProgress={userProgress}
                        />
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />
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
    contentContainer: {
        padding: 16,
    },
    introContainer: {
        marginBottom: 20,
    },
    courseHeader: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    courseIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    courseTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 8,
        textAlign: 'center',
    },
    courseDescription: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 16,
    },
    progressContainer: {
        width: '100%',
        marginTop: 10,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#333333',
        textAlign: 'center',
    },
    chaptersContainer: {
        marginTop: 20,
    },
    practiceOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    practiceButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    quizIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#B2EBF2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    quizIconText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00ACC1',
    },
    flashcardIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFECB3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    practiceButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333333',
    },
    chaptersTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 16,
    },
    chapterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    chapterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chapterNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        textAlign: 'center',
        lineHeight: 24,
        marginRight: 12,
        fontSize: 14,
        color: '#666666',
    },
    chapterTitle: {
        fontSize: 16,
        color: '#333333',
    },
    chapterStatus: {},
    noSigns: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666666',
        padding: 20,
    }
});