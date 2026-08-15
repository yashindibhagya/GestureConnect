import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from "@expo/vector-icons";
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabBarClearance } from "../../constants/navigation";

/**
 * AllCourses component for displaying all available courses in the learning platform
 * 
 * @param {Object} props Component props
 * @param {Array} props.courses Array of courses to display
 * @param {string} props.searchQuery Current search query
 * @returns {React.Component} AllCourses component
 */
const AllCourses = ({ courses, searchQuery }) => {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Navigate to a specific course
    const handleCoursePress = (course) => {
        router.push({
            pathname: '/courseView/courseDetails',
            params: { id: course.id }
        });
    };

    // Render a course item
    const renderCourseCard = ({ item }) => {
        const isInProgress = item.progress && item.progress.completed > 0 && item.progress.percentage < 100;
        const isCompleted = item.progress && item.progress.percentage === 100;

        return (
            <TouchableOpacity
                style={[
                    styles.courseCard,
                    {
                        backgroundColor: item.backgroundColor || '#fff'
                    }
                ]}
                onPress={() => handleCoursePress(item)}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.courseIcon}>{item.icon || '📚'}</Text>
                </View>
                <View style={styles.courseInfoContainer}>
                    <Text style={styles.courseTitle}>{item.title}</Text>

                    {item.progress.total > 0 && (
                        <View style={styles.progressContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    { width: `${item.progress.percentage}%` }
                                ]}
                            />
                        </View>
                    )}

                    <Text style={styles.chapterCount}>
                        {item.progress.total > 0 ?
                            `${item.progress.completed}/${item.progress.total} chapters` :
                            'Coming soon'}
                    </Text>
                </View>

                {/* In Progress Badge */}
                {isInProgress && (
                    <View style={styles.inProgressBadge}>
                        <MaterialIcons name="play-circle-outline" size={moderateScale(20)} color="#155658" />
                        <Text style={styles.inProgressText}>In Progress</Text>
                    </View>
                )}

                {/* Completed Badge - NEW */}
                {isCompleted && (
                    <View style={styles.achievementBadge}>
                        <MaterialIcons name="star" size={moderateScale(24)} color="#fff" />
                        <Text style={styles.achievementText}>Completed!</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // No courses message
    if (courses.length === 0) {
        return (
            <View style={styles.noCoursesContainer}>
                <Text style={styles.noCoursesText}>
                    {searchQuery
                        ? `No courses matching "${searchQuery}"`
                        : "No courses available at the moment."}
                </Text>
            </View>
        );
    }

    // Render the list of courses
    return (
        <FlatList
            data={courses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.docId || item.id || Math.random().toString()}
            contentContainerStyle={[styles.courseList, { paddingBottom: tabBarClearance(insets.bottom) }]}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    courseList: {
        paddingBottom: verticalScale(44),
    },
    courseCard: {
        flex: 1,
        margin: moderateScale(8),
        borderRadius: moderateScale(16),
        overflow: 'hidden',
        padding: moderateScale(16),
        height: verticalScale(170),
        position: 'relative',
    },
    iconContainer: {
        alignItems: 'flex-end',
    },
    courseIcon: {
        fontSize: fontSize(50),
        marginBottom: verticalScale(10),
    },
    courseInfoContainer: {
        justifyContent: 'flex-end',
        flex: 1,
    },
    courseTitle: {
        fontSize: fontSize(18),
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: verticalScale(8),
    },
    progressContainer: {
        height: verticalScale(4),
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: moderateScale(2),
        overflow: 'hidden',
        marginBottom: verticalScale(8),
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: moderateScale(2),
    },
    chapterCount: {
        fontSize: fontSize(12),
        color: '#666666',
    },
    row: {
        justifyContent: 'space-between',
    },
    noCoursesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(40),
    },
    noCoursesText: {
        fontSize: fontSize(16),
        color: '#666666',
        textAlign: 'center',
        marginBottom: verticalScale(20),
    },
    // In Progress Badge
    inProgressBadge: {
        position: 'absolute',
        top: verticalScale(10),
        right: scale(10),
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: moderateScale(15),
        padding: moderateScale(5),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    inProgressText: {
        fontSize: fontSize(12),
        fontWeight: 'bold',
        color: '#155658',
        marginLeft: scale(4),
    },
    achievementBadge: {
        position: 'absolute',
        top: verticalScale(10),
        right: scale(10),
        backgroundColor: '#F7B316',
        borderRadius: moderateScale(15),
        padding: moderateScale(5),
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    achievementText: {
        fontSize: fontSize(12),
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: scale(4),
    },

});

export default AllCourses;