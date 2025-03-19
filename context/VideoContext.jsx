import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [signsData, setSignsData] = useState([]);
    const [coursesData, setCoursesData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userProgress, setUserProgress] = useState({});

    useEffect(() => {
        const fetchSignsData = async () => {
            try {
                setIsLoading(true);

                // Check if we have cached data
                const cachedData = await AsyncStorage.getItem('signsData');
                const cachedProgress = await AsyncStorage.getItem('userProgress');

                if (cachedProgress) {
                    setUserProgress(JSON.parse(cachedProgress));
                }

                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    setSignsData(parsedData);

                    // Group data into courses
                    organizeCoursesData(parsedData);

                    setIsLoading(false);
                    return;
                }

                // In a real app, this would be an API call
                // For demo purposes, we're returning mock data
                const mockData = [
                    // Alphabet signs
                    {
                        signId: "a-001",
                        word: "A",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/a.jpg",
                    },
                    {
                        signId: "b-002",
                        word: "B",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/b.jpg",
                    },
                    {
                        signId: "c-003",
                        word: "C",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/c.jpg",
                    },
                    {
                        signId: "d-004",
                        word: "D",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/d.jpg",
                    },
                    {
                        signId: "e-005",
                        word: "E",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/e.jpg",
                    },
                    {
                        signId: "f-006",
                        word: "F",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/f.jpg",
                    },
                    {
                        signId: "g-007",
                        word: "G",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/g.jpg",
                    },
                    {
                        signId: "h-008",
                        word: "H",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/h.jpg",
                    },
                    {
                        signId: "i-009",
                        word: "I",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/i.jpg",
                    },
                    {
                        signId: "j-010",
                        word: "J",
                        category: "alphabet",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/j.jpg",
                    },

                    // Conversation signs
                    {
                        signId: "hello-001",
                        word: "Hello",
                        category: "conversation",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/hello.jpg",
                        relatedSigns: ["Hi", "Greeting", "Welcome"],
                    },
                    {
                        signId: "thank-you-001",
                        word: "Thank you",
                        category: "conversation",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/thankyou.jpg",
                        relatedSigns: ["Thanks", "Appreciation"],
                    },
                    {
                        signId: "you-001",
                        word: "You",
                        category: "conversation",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742377081/you_t1accf.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/you.jpg",
                        relatedSigns: ["Your"],
                    },

                    // WH Questions
                    {
                        signId: "what-001",
                        word: "What",
                        category: "wh-questions",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/what.jpg",
                    },
                    {
                        signId: "where-002",
                        word: "Where",
                        category: "wh-questions",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/where.jpg",
                    },
                    {
                        signId: "who-003",
                        word: "Who",
                        category: "wh-questions",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/who.jpg",
                    },

                    // Family signs
                    {
                        signId: "mother-001",
                        word: "Mother",
                        category: "family",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/mother.jpg",
                    },
                    {
                        signId: "father-002",
                        word: "Father",
                        category: "family",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/father.jpg",
                    },

                    // Action signs
                    {
                        signId: "eat-001",
                        word: "Eat",
                        category: "actions",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/eat.jpg",
                    },
                    {
                        signId: "drink-002",
                        word: "Drink",
                        category: "actions",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/drink.jpg",
                    },

                    // Number signs
                    {
                        signId: "one-001",
                        word: "One",
                        category: "numbers",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/one.jpg",
                    },
                    {
                        signId: "two-002",
                        word: "Two",
                        category: "numbers",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/two.jpg",
                    },

                    // Color signs
                    {
                        signId: "red-001",
                        word: "Red",
                        category: "colors",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/red.jpg",
                    },
                    {
                        signId: "blue-002",
                        word: "Blue",
                        category: "colors",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/blue.jpg",
                    },

                    // Deaf culture signs
                    {
                        signId: "deaf-001",
                        word: "Deaf",
                        category: "deaf",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/deaf.jpg",
                    },
                    {
                        signId: "hearing-002",
                        word: "Hearing",
                        category: "deaf",
                        videoUrl: "https://res.cloudinary.com/dxjb5lepy/video/upload/v1742374651/hello_g34znt.mp4",
                        thumbnailUrl: "https://example.com/thumbnails/hearing.jpg",
                    },
                ];

                // Cache the data
                await AsyncStorage.setItem('signsData', JSON.stringify(mockData));

                setSignsData(mockData);

                // Group data into courses
                organizeCoursesData(mockData);

            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSignsData();
    }, []);

    // Organize course data from signs data
    const organizeCoursesData = (data) => {
        // Group signs by category
        const categoriesMap = {};

        data.forEach(sign => {
            if (!categoriesMap[sign.category]) {
                categoriesMap[sign.category] = [];
            }
            categoriesMap[sign.category].push(sign);
        });

        console.log("Categories found:", Object.keys(categoriesMap));

        // Create course data structure
        const courses = [
            {
                id: 'alphabet',
                title: 'Alphabet',
                description: 'Learn to sign the alphabet from A to Z',
                totalChapters: categoriesMap['alphabet']?.length || 0,
                backgroundColor: '#FFD8B9',
                icon: '📚',
                signs: categoriesMap['alphabet'] || []
            },
            {
                id: 'wh-questions',
                title: 'WH Questions',
                description: 'Learn question words like What, Where, Who, When, Why',
                totalChapters: categoriesMap['wh-questions']?.length || 0,
                backgroundColor: '#D7F5D3',
                icon: '🦄',
                signs: categoriesMap['wh-questions'] || []
            },
            {
                id: 'conversation',
                title: 'Starting a conversation',
                description: 'Learn basic phrases to start a conversation',
                totalChapters: categoriesMap['conversation']?.length || 0,
                backgroundColor: '#FFE4B9',
                icon: '💬',
                signs: categoriesMap['conversation'] || []
            },
            {
                id: 'actions',
                title: 'Actions',
                description: 'Learn signs for common actions and verbs',
                totalChapters: categoriesMap['actions']?.length || 0,
                backgroundColor: '#D7F5D3',
                icon: '👋',
                signs: categoriesMap['actions'] || []
            },
            {
                id: 'family',
                title: 'Family',
                description: 'Learn signs for family members',
                totalChapters: categoriesMap['family']?.length || 0,
                backgroundColor: '#FFCDD2',
                icon: '👨‍👩‍👧‍👦',
                signs: categoriesMap['family'] || []
            },
            {
                id: 'deaf',
                title: 'Deaf',
                description: 'Learn about deaf culture and community',
                totalChapters: categoriesMap['deaf']?.length || 0,
                backgroundColor: '#FFE4B9',
                icon: '👋',
                signs: categoriesMap['deaf'] || []
            },
            {
                id: 'numbers',
                title: 'Numbers',
                description: 'Learn to sign numbers',
                totalChapters: categoriesMap['numbers']?.length || 0,
                backgroundColor: '#B2EBF2',
                icon: '🧮',
                signs: categoriesMap['numbers'] || []
            },
            {
                id: 'colors',
                title: 'Colours',
                description: 'Learn to sign colors',
                totalChapters: categoriesMap['colors']?.length || 0,
                backgroundColor: '#FFECB3',
                icon: '🎨',
                signs: categoriesMap['colors'] || []
            }
        ];

        console.log("Organized courses:", courses.map(c => ({ id: c.id, title: c.title, signsCount: c.signs.length })));
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

    // Helper functions to access the video dataset
    const getSignVideoByWord = (word) => {
        return signsData.find(sign => sign.word.toLowerCase() === word.toLowerCase());
    };

    const getSignsByCategory = (category) => {
        return signsData.filter(sign => sign.category === category);
    };

    // Reset progress (for testing)
    const resetAllProgress = async () => {
        setUserProgress({});
        await AsyncStorage.removeItem('userProgress');
    };

    return (
        <VideoContext.Provider
            value={{
                signsData,
                coursesData,
                isLoading,
                error,
                userProgress,
                getSignVideoByWord,
                getSignsByCategory,
                markSignAsCompleted,
                getCourseProgress,
                resetAllProgress
            }}
        >
            {children}
        </VideoContext.Provider>
    );
};