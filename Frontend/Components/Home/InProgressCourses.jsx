// Frontend/Components/Home/InProgressCourses.jsx
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from "@expo/vector-icons";
import {
    GUTTER,
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

const InProgressCourses = ({ courses }) => {
    const router = useRouter();

    // Render a single course item in the horizontal list
    const renderCourseItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.courseCard,
                { backgroundColor: item.backgroundColor || '#fff' }
            ]}
            onPress={() =>
                router.push({
                    pathname: '/courseView/courseDetails',
                    params: { id: item.id }
                })
            }
        >
            <Text style={styles.courseIcon}>{item.icon || '📚'}</Text>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Text style={styles.courseDescription} numberOfLines={2}>
                {item.description || `Learn ${item.title.toLowerCase()}`}
            </Text>

            <View style={styles.progressInfo}>
                <Text style={styles.chapterCount}>
                    {item.signs?.length || 0} Chapters
                </Text>
                <Text style={styles.completedCount}>
                    {item.progress.completed} Out of {item.progress.total} Completed
                </Text>
            </View>

            <View style={styles.progressBarContainer}>
                <View
                    style={[
                        styles.progressBar,
                        { width: `${item.progress.percentage}%` }
                    ]}
                />
            </View>

            {item.progress.percentage === 100 && (
                <View style={styles.completedBadge}>
                    <MaterialIcons name="check-circle" size={moderateScale(16)} color="#FFFFFF" />
                    <Text style={styles.completedBadgeText}>Completed</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (courses.length === 0) {
        return (
            <Text style={styles.noProgressText}>
                You haven&apos;t started any courses yet. Try one below!
            </Text>
        );
    }

    return (
        <View style={styles.section}>
            <Text style={styles.subsectionTitle}>Progress</Text>
            <FlatList
                data={courses}
                renderItem={renderCourseItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        // Cancel the parent screen's gutter so the row is full-bleed. Without
        // this the cards overflowed it anyway — React Native does not clip
        // children — so the row ran to the screen edges while every other
        // element respected the inset.
        marginHorizontal: -GUTTER,
    },
    subsectionTitle: {
        fontSize: fontSize(20),
        fontWeight: "800",
        color: "#000",
        marginBottom: verticalScale(10),
        marginTop: verticalScale(-40),
        // The row below is full-bleed, so the heading re-applies the gutter to
        // stay aligned with the rest of the screen.
        marginHorizontal: GUTTER,
    },
    noProgressText: {
        fontSize: fontSize(14),
        color: "#666",
        fontStyle: "italic",
        marginBottom: verticalScale(20),
    },
    horizontalList: {
        // Cards start and end on the gutter, so the first one lines up with the
        // heading and the row still scrolls cleanly off both edges.
        paddingHorizontal: GUTTER,
        paddingBottom: verticalScale(5),
    },
    courseCard: {
        width: scale(200),
        height: verticalScale(180),
        borderRadius: moderateScale(16),
        marginRight: scale(16),
        padding: moderateScale(16),
        position: 'relative',
    },
    courseIcon: {
        fontSize: fontSize(30),
        marginBottom: verticalScale(8),
    },
    courseTitle: {
        fontSize: fontSize(16),
        fontWeight: "bold",
        color: "#333",
        marginBottom: verticalScale(4),
    },
    courseDescription: {
        fontSize: fontSize(12),
        color: "#555",
        marginBottom: verticalScale(10),
        flex: 1,
    },
    progressInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: verticalScale(6),
    },
    chapterCount: {
        fontSize: fontSize(10),
        color: "#000",
    },
    completedCount: {
        fontSize: fontSize(10),
        color: "#333",
        fontWeight: "500",
    },
    progressBarContainer: {
        height: verticalScale(6),
        backgroundColor: "#F7B316",
        borderRadius: moderateScale(3),
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#155658",
        borderRadius: moderateScale(3),
    },
    completedBadge: {
        position: 'absolute',
        top: verticalScale(10),
        right: scale(10),
        backgroundColor: '#4CAF50',
        borderRadius: moderateScale(12),
        paddingHorizontal: scale(8),
        paddingVertical: verticalScale(4),
        flexDirection: 'row',
        alignItems: 'center',
    },
    completedBadgeText: {
        color: 'white',
        fontSize: fontSize(10),
        fontWeight: 'bold',
        marginLeft: scale(4),
    },
});

export default InProgressCourses;