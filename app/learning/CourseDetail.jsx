import React, { useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { VideoContext } from '../../context/VideoContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CourseDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { coursesData, getCourseProgress, userProgress, isLoading } = useContext(VideoContext);

    // Log when component mounts to debug
    useEffect(() => {
        console.log("CourseDetail: Received course ID:", id);

        if (coursesData && coursesData.length > 0) {
            // Log all available courses for debugging
            console.log("CourseDetail: Available courses:", coursesData.map(c => ({
                id: c.id,
                title: c.title,
                signsCount: c.signs?.length || 0
            })));

            // Find the specific course we're looking for
            const currentCourse = coursesData.find(course => course.id === id);

            if (currentCourse) {
                console.log("CourseDetail: Found course:", currentCourse.title);
                console.log("CourseDetail: This course has", currentCourse.signs?.length || 0, "signs");

                if (currentCourse.signs && currentCourse.signs.length > 0) {
                    console.log("CourseDetail: First few signs:",
                        currentCourse.signs.slice(0, 3).map(s => s.word)
                    );
                }
            } else {
                console.warn("CourseDetail: Could not find course with ID:", id);
            }
        } else {
            console.warn("CourseDetail: No courses available in coursesData");
        }
    }, [id, coursesData]);

    // Find the current course
    const course = coursesData.find(course => course.id === id);
    const progress = course ? getCourseProgress(id) : { completed: 0, total: 0, percentage: 0 };

    // Handle sign tap
    const handleSignPress = (sign) => {
        console.log("CourseDetail: Opening sign:", sign.word);
        router.push({
            pathname: `/learning/sign/${sign.signId}`,
            params: { courseId: id }
        });
    };

    // Start quiz functionality
    const startQuiz = () => {
        if (!course || !course.signs || course.signs.length === 0) {
            alert("No signs available for quiz");
            return;
        }
        router.push({
            pathname: `/learning/quiz/${id}`
        });
    };

    // Start flashcards functionality
    const startFlashcards = () => {
        if (!course || !course.signs || course.signs.length === 0) {
            alert("No signs available for flashcards");
            return;
        }
        router.push({
            pathname: `/learning/flashcards/${id}`
        });
    };

    // Render each sign item in the list
    const renderSignItem = ({ item }) => {
        const isCompleted = userProgress[item.signId]?.completed;

        return (
            <TouchableOpacity
                style={styles.signItem}
                onPress={() => handleSignPress(item)}
            >
                <Text style={styles.signTitle}>{item.word}</Text>
                <View style={styles.rightContent}>
                    {isCompleted && (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" style={styles.completedIcon} />
                    )}
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4C9EFF" />
                    <Text>Loading course details...</Text>
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
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{course.title}</Text>
            </View>

            <View style={styles.actionCardsContainer}>
                <TouchableOpacity
                    style={[styles.actionCard, styles.quizCard]}
                    onPress={startQuiz}
                >
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>?</Text>
                    </View>
                    <Text style={styles.actionCardText}>Start quiz</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionCard, styles.flashcardCard]}
                    onPress={startFlashcards}
                >
                    <View style={styles.cardIconContainer}>
                        <Ionicons name="card-outline" size={36} color="#FF9800" />
                    </View>
                    <Text style={styles.actionCardText}>Start flashcards</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.collectionContainer}>
                <Text style={styles.collectionTitle}>Signs in collection</Text>

                {course.signs && course.signs.length > 0 ? (
                    <FlatList
                        data={course.signs}
                        renderItem={renderSignItem}
                        keyExtractor={(item) => item.signId}
                        contentContainerStyle={styles.signsList}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                ) : (
                    <View style={styles.noSignsContainer}>
                        <Ionicons name="information-circle" size={50} color="#BBBBBB" />
                        <Text style={styles.noSignsText}>No signs available in this collection yet.</Text>
                    </View>
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
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 28,
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
    actionCardsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    actionCard: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
    },
    quizCard: {
        backgroundColor: '#B2EBF2',
    },
    flashcardCard: {
        backgroundColor: '#FFECB3',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#00ACC1',
    },
    cardIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    iconText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#00ACC1',
    },
    actionCardText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
    },
    collectionContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    collectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 16,
    },
    signsList: {
        paddingBottom: 24,
    },
    signItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    signTitle: {
        fontSize: 18,
        color: '#333333',
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    completedIcon: {
        marginRight: 8,
    },
    separator: {
        height: 1,
        backgroundColor: '#EEEEEE',
    },
    noSignsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    noSignsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 16,
    },
});