import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import JSON data files
import englishAlphabet from '../assets/Data/englishAlphabet.json';
import sinhalaAlphabet from '../assets/Data/sinhalaAlphabet.json';
import conversationSigns from '../assets/Data/conversationSigns.json';
import whQuestions from '../assets/Data/whQuestions.json';
import categories from '../assets/Data/categories.json';
import actions from '../assets/Data/actions.json';
import numbers from '../assets/Data/numbers.json';
import people from '../assets/Data/people.json';
import colours from '../assets/Data/colours.json';

// Import CloudinaryUtils
import CloudinaryUtils from '../app/utils/CloudinaryUtils';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [signsData, setSignsData] = useState([]);
    const [coursesData, setCoursesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProgress, setUserProgress] = useState({});
    // Cache of attempted but failed video URLs
    const [failedVideoUrls, setFailedVideoUrls] = useState({});

    useEffect(() => {
        const fetchSignsData = async () => {
            try {
                setIsLoading(true);

                // Load user progress from AsyncStorage
                const cachedProgress = await AsyncStorage.getItem('userProgress');
                if (cachedProgress) {
                    setUserProgress(JSON.parse(cachedProgress));
                }

                // Load failed URL cache
                const cachedFailedUrls = await AsyncStorage.getItem('failedVideoUrls');
                if (cachedFailedUrls) {
                    setFailedVideoUrls(JSON.parse(cachedFailedUrls));
                }

                // Combine all the sign data from imported JSON files
                const allSigns = [
                    ...englishAlphabet,
                    ...sinhalaAlphabet,
                    ...conversationSigns,
                    ...whQuestions,
                    ...actions,
                    ...numbers,
                    ...people,
                    ...colours
                    // Add additional sign data as they become available
                ];

                // Make sure all signs have the required properties and update URLs
                const processedSigns = allSigns.map(sign => {
                    // Generate a signId if missing
                    if (!sign.signId) {
                        sign.signId = `${sign.word ? sign.word.toLowerCase().replace(/\s+/g, '-') : 'unknown'}-001`;
                    }

                    // Update or generate videoUrl if missing or invalid
                    if (!sign.videoUrl || typeof sign.videoUrl !== 'string' || !sign.videoUrl.startsWith('http')) {
                        // Try to generate a URL using CloudinaryUtils
                        sign.videoUrl = CloudinaryUtils.getSignVideoUrl(sign.word);
                    }

                    // Update or generate thumbnailUrl if missing
                    if (!sign.thumbnailUrl || typeof sign.thumbnailUrl !== 'string' || !sign.thumbnailUrl.startsWith('http')) {
                        sign.thumbnailUrl = CloudinaryUtils.getSignThumbnailUrl(sign.word);
                    }

                    return sign;
                });

                setSignsData(processedSigns);

                // Organize courses data
                organizeCoursesData(processedSigns);

            } catch (err) {
                console.error("Error loading sign data:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSignsData();
    }, []);

    // Record a failed video URL attempt
    const recordFailedVideoUrl = async (url) => {
        if (!url) return;

        const newFailedUrls = {
            ...failedVideoUrls,
            [url]: new Date().toISOString()
        };

        setFailedVideoUrls(newFailedUrls);

        // Save to AsyncStorage
        try {
            await AsyncStorage.setItem('failedVideoUrls', JSON.stringify(newFailedUrls));
        } catch (err) {
            console.error('Error saving failed URL:', err);
        }
    };

    // Organize course data using sign data and categories
    const organizeCoursesData = (data) => {
        // Group signs by category
        const categoriesMap = {};

        data.forEach(sign => {
            if (!categoriesMap[sign.category]) {
                categoriesMap[sign.category] = [];
            }
            categoriesMap[sign.category].push(sign);
        });

        // Create course data by combining categories metadata with signs
        const courses = categories.map(category => ({
            ...category,
            totalChapters: categoriesMap[category.id]?.length || 0,
            signs: categoriesMap[category.id] || []
        }));

        setCoursesData(courses);
    };

    // Helper function to mark a sign as completed
    const markSignAsCompleted = async (signId) => {
        try {
            const updatedProgress = { ...userProgress };

            if (!updatedProgress[signId]) {
                updatedProgress[signId] = { completed: true, completedAt: new Date().toISOString() };

                // Save to state and storage
                setUserProgress(updatedProgress);
                await AsyncStorage.setItem('userProgress', JSON.stringify(updatedProgress));
            }

            return true;
        } catch (err) {
            console.error('Error updating progress:', err);
            return false;
        }
    };

    // Helper function to get course progress
    const getCourseProgress = (courseId) => {
        const course = coursesData.find(c => c.id === courseId);
        if (!course) return { completed: 0, total: 0, percentage: 0 };

        const signIds = course.signs.map(sign => sign.signId);
        const completedCount = signIds.filter(id => userProgress[id]?.completed).length;

        return {
            completed: completedCount,
            total: course.totalChapters,
            percentage: course.totalChapters > 0 ? Math.round((completedCount / course.totalChapters) * 100) : 0
        };
    };

    // Improved findSignForPhrase function with CloudinaryUtils and multi-language support
    const findSignForPhrase = (phrase) => {
        if (!phrase || phrase.trim() === '') return null;

        const searchPhrase = phrase.toLowerCase().trim();

        // Try to find an exact match first
        let sign = signsData.find(sign => {
            const signWord = sign.word ? sign.word.toLowerCase() : '';
            return signWord === searchPhrase ||
                (sign.sinhalaTranslit && sign.sinhalaTranslit.toLowerCase() === searchPhrase) ||
                (sign.tamilTranslit && sign.tamilTranslit.toLowerCase() === searchPhrase);
        });

        // Validate the sign has a valid videoUrl before returning
        if (sign && sign.videoUrl && typeof sign.videoUrl === 'string') {
            return sign;
        } else if (sign) {
            // Try to update the URL using CloudinaryUtils
            sign.videoUrl = CloudinaryUtils.getSignVideoUrl(phrase);
            if (sign.videoUrl) return sign;
            return null;
        }

        // If no exact match, try partial match
        sign = signsData.find(sign => {
            if (!sign.word) return false;  // Skip if the sign doesn't have a word property

            const signWord = sign.word.toLowerCase();
            // Check if the search phrase contains the sign word or vice versa
            return (signWord.includes(searchPhrase) || searchPhrase.includes(signWord)) &&
                sign.videoUrl && typeof sign.videoUrl === 'string';
        });

        if (sign) {
            return sign;
        }

        // If no match found in the database, try to dynamically generate a sign with URL
        const videoUrl = CloudinaryUtils.getSignVideoUrl(phrase);
        if (videoUrl) {
            // Create a temporary sign object
            return {
                word: phrase,
                videoUrl: videoUrl,
                thumbnailUrl: CloudinaryUtils.getSignThumbnailUrl(phrase),
                category: 'generated',
                signId: `${searchPhrase.replace(/\s+/g, '-')}-gen`
            };
        }

        return null;
    };

    // Improved getSignVideoByWord function with CloudinaryUtils and multi-language support
    const getSignVideoByWord = (word) => {
        if (!word || word.trim() === '') return null;

        const searchWord = word.toLowerCase().trim();

        // Try to find an exact match first (case insensitive)
        let sign = signsData.find(sign => {
            if (!sign.word) return false;

            return sign.word.toLowerCase() === searchWord ||
                (sign.sinhalaTranslit && sign.sinhalaTranslit.toLowerCase() === searchWord) ||
                (sign.tamilTranslit && sign.tamilTranslit.toLowerCase() === searchWord);
        });

        // Verify the sign has a valid videoUrl
        if (sign && sign.videoUrl && typeof sign.videoUrl === 'string') {
            return sign;
        } else if (sign) {
            // Try to update the URL using CloudinaryUtils
            sign.videoUrl = CloudinaryUtils.getSignVideoUrl(word);
            if (sign.videoUrl) return sign;
        }

        // If exact match failed or had no videoUrl, try a more flexible match
        sign = signsData.find(sign => {
            if (!sign.word) return false;

            const signWord = sign.word.toLowerCase();
            return (
                // Word is contained in the sign (like "you" in "thank you")
                (signWord.includes(searchWord) || searchWord.includes(signWord)) &&
                // Must have a valid videoUrl
                sign.videoUrl && typeof sign.videoUrl === 'string'
            );
        });

        if (sign) {
            return sign;
        }

        // If still no match found, dynamically generate a sign with URL
        const videoUrl = CloudinaryUtils.getSignVideoUrl(word);
        if (videoUrl) {
            // Create a temporary sign object
            return {
                word: word,
                videoUrl: videoUrl,
                thumbnailUrl: CloudinaryUtils.getSignThumbnailUrl(word),
                category: 'generated',
                signId: `${searchWord.replace(/\s+/g, '-')}-gen`
            };
        }

        return null;
    };

    const getSignsByCategory = (category) => {
        return signsData.filter(sign => sign.category === category);
    };

    // Reset progress (for testing)
    const resetAllProgress = async () => {
        setUserProgress({});
        await AsyncStorage.removeItem('userProgress');
    };

    // Clear the failed URL cache (for testing or when videos are updated)
    const clearFailedUrlCache = async () => {
        setFailedVideoUrls({});
        await AsyncStorage.removeItem('failedVideoUrls');
    };

    return (
        <VideoContext.Provider
            value={{
                signsData,
                coursesData,
                isLoading,
                error,
                userProgress,
                failedVideoUrls,
                getSignVideoByWord,
                getSignsByCategory,
                markSignAsCompleted,
                getCourseProgress,
                resetAllProgress,
                recordFailedVideoUrl,
                clearFailedUrlCache,
                findSignForPhrase
            }}
        >
            {children}
        </VideoContext.Provider>
    );
};