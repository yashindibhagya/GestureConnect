import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
    GUTTER,
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

const NewCourses = ({ courses }) => {
    const router = useRouter();

    // Render a course item for new courses
    const renderNewCourseItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.newCourseCard,
                { backgroundColor: item.backgroundColor || '#fff' }
            ]}
            onPress={() =>
                router.push({
                    pathname: '/courseView/courseDetails',
                    params: { id: item.id }
                })
            }
        >
            <Text style={styles.courseIconNew}>{item.icon || '📚'}</Text>
            <Text style={styles.newCourseTitle}>{item.title}</Text>
        </TouchableOpacity>
    );

    if (courses.length === 0) {
        return null;
    }

    return (
        <View style={styles.newCoursesSection}>
            <Text style={styles.subsectionTitle}>New Courses to Try</Text>
            <FlatList
                data={courses}
                renderItem={renderNewCourseItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    subsectionTitle: {
        fontSize: fontSize(20),
        fontWeight: "800",
        color: "#000",
        marginBottom: verticalScale(10),
        // The row below is full-bleed, so the heading re-applies the gutter to
        // stay aligned with the rest of the screen.
        marginHorizontal: GUTTER,
    },
    horizontalList: {
        // Cards start and end on the gutter, so the first one lines up with the
        // heading and the row still scrolls cleanly off both edges.
        paddingHorizontal: GUTTER,
        paddingBottom: verticalScale(5),
    },
    newCoursesSection: {
        marginTop: verticalScale(20),
        // Cancel the parent screen's gutter. Without this the cards overflowed
        // it anyway — React Native does not clip children — so the row ran to
        // the screen edges while every other element respected the inset.
        marginHorizontal: -GUTTER,
    },
    newCourseCard: {
        width: moderateScale(140),
        height: moderateScale(140),
        borderRadius: moderateScale(16),
        marginRight: scale(16),
        padding: moderateScale(16),
    },
    courseIconNew: {
        fontSize: fontSize(50),
        marginBottom: verticalScale(8),
        alignSelf: 'center'
    },
    newCourseTitle: {
        fontSize: fontSize(17),
        fontWeight: "900",
        color: "#000",
        marginBottom: verticalScale(4),
        marginTop: verticalScale(-5),
        textAlign: 'center'
    },
});

export default NewCourses;