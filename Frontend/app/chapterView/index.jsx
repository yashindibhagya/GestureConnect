import { View, Text, StyleSheet, useWindowDimensions, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Progress from 'react-native-progress';
import Button from '../../Components/Shared/Button';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { MaterialIcons } from '@expo/vector-icons';
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

export default function ChapterView() {
    const { chapterParams, docId, chapterIndex } = useLocalSearchParams();
    const chapters = JSON.parse(chapterParams); // Parse the chapter data from params
    const [currentPage, setCurrentPage] = useState(0); // Start from the first page
    const [loader, setLoader] = useState(false);
    const router = useRouter();
    const { width } = useWindowDimensions();

    // Convert content from object to array (if necessary)
    const contentArray = chapters?.content ? Object.values(chapters.content) : [];

    // Get Progress Percentage
    const GetProgress = (currentPage) => {
        return contentArray.length > 0 ? currentPage / contentArray.length : 0;
    };

    // Get the current content data dynamically
    const currentContent = contentArray[currentPage];

    const onChapterComplete = async () => {
        // Save Chapter complete
        setLoader(true);
        try {
            await updateDoc(doc(db, 'Courses', docId), {
                completedChapter: arrayUnion(chapterIndex),
            });
            // There is no /courseView/[id] route — the course screen is
            // /courseView/courseDetails and takes the id as a param.
            router.replace({
                pathname: '/courseView/courseDetails',
                params: { id: docId },
            });
        } catch (error) {
            console.error("Error updating course progress:", error);
        } finally {
            setLoader(false);
        }
    };

    useEffect(() => {
        console.log('Current Chapter:', chapters);
        console.log('Current Page:', currentPage);
    }, [currentPage, chapters]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <MaterialIcons
                    name="arrow-back"
                    size={moderateScale(24)}
                    color="#333"
                    onPress={() => router.back()}
                    style={styles.backButton}
                />
                <Text style={styles.headerTitle}>{chapters?.chapterTitle || 'Chapter'}</Text>
            </View>

            <View style={[styles.container, { width: width - 30 }]}>
                {/* Progress Bar */}
                <Progress.Bar
                    progress={GetProgress(currentPage)}
                    color='#3c0061'
                    width={width * 0.85}
                />

                <ScrollView style={styles.contentScroll}>
                    <View style={{ marginTop: 20 }}>
                        {/* Display Topic if it exists */}
                        {currentContent ? (
                            <View style={styles.topicContainer}>
                                <Text style={styles.topicText}>{currentContent.topic || 'No topic found'}</Text>
                            </View>
                        ) : (
                            <Text style={{ color: 'red' }}>Content not available for the current page.</Text>
                        )}

                        {/* Display Explanation */}
                        {currentContent?.explain && (
                            <Text style={styles.explanationText}>{currentContent.explain}</Text>
                        )}

                        {/* Display Code */}
                        {currentContent?.code && (
                            <Text style={styles.codeText}>{currentContent.code}</Text>
                        )}

                        {/* Display Example */}
                        {currentContent?.example && (
                            <Text style={styles.exampleText}>{currentContent.example}</Text>
                        )}
                    </View>
                </ScrollView>

                {/* Navigation Buttons */}
                <View style={styles.buttonContainer}>
                    {currentPage < contentArray.length - 1 ? (
                        <Button text={'Next'} onPress={() => setCurrentPage(currentPage + 1)} />
                    ) : (
                        <Button text={'Finish'} onPress={() => onChapterComplete()} loading={loader} />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        padding: moderateScale(15),
        backgroundColor: '#fff',
        flex: 1,
        alignSelf: 'center',
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
    contentScroll: {
        flex: 1,
        marginBottom: 70, // Space for button
    },
    buttonContainer: {
        position: 'absolute',
        bottom: verticalScale(15),
        width: '100%',
        left: scale(15),
    },
    topicContainer: {
        marginTop: verticalScale(20),
    },
    topicText: {
        fontWeight: 'bold',
        fontSize: fontSize(25),
    },
    explanationText: {
        fontSize: fontSize(18),
        marginTop: verticalScale(15),
    },
    codeText: {
        fontSize: fontSize(18),
        backgroundColor: '#3c0061',
        color: '#fff',
        padding: moderateScale(15),
        marginTop: verticalScale(15),
        borderRadius: moderateScale(5),
    },
    exampleText: {
        fontSize: fontSize(18),
        marginTop: verticalScale(15),
        padding: moderateScale(15),
        backgroundColor: '#f0f0f0',
        borderRadius: moderateScale(5),
    },
});