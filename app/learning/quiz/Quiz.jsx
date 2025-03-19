import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Image,
    Animated
} from 'react-native';
import { Video } from 'expo-av';
import { VideoContext } from '../../../context/VideoContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Quiz() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { coursesData, markSignAsCompleted } = useContext(VideoContext);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [questions, setQuestions] = useState([]);
    const [showAnswer, setShowAnswer] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const videoRef = useRef(null);

    // Find the current course
    const course = coursesData.find(course => course.id === id);

    // Prepare quiz questions from course signs
    useEffect(() => {
        if (course && course.signs.length > 0) {
            const quizQuestions = prepareQuizQuestions(course.signs);
            setQuestions(quizQuestions);
        }
    }, [course]);

    // Prepare quiz questions
    const prepareQuizQuestions = (signs) => {
        // Filter out signs with no video
        const validSigns = signs.filter(sign => sign.videoUrl);

        // Create questions
        return validSigns.map(sign => {
            // Get 3 random incorrect options
            const incorrectOptions = getRandomIncorrectOptions(sign.word, validSigns, 3);

            // Combine correct answer with incorrect options and shuffle
            const options = shuffleArray([sign.word, ...incorrectOptions]);

            return {
                signId: sign.signId,
                videoUrl: sign.videoUrl,
                correctAnswer: sign.word,
                options: options
            };
        });
    };

    // Get random incorrect options
    const getRandomIncorrectOptions = (correctWord, signs, count) => {
        const incorrectSigns = signs.filter(sign => sign.word !== correctWord);
        const shuffled = shuffleArray([...incorrectSigns]);
        return shuffled.slice(0, count).map(sign => sign.word);
    };

    // Shuffle array (Fisher-Yates algorithm)
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Handle option selection
    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        setShowAnswer(true);

        // Update score if correct
        if (option === questions[currentQuestionIndex].correctAnswer) {
            setScore(prevScore => prevScore + 1);

            // Mark the sign as completed
            markSignAsCompleted(questions[currentQuestionIndex].signId);
        }
    };

    // Handle next question
    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            // Fade out animation
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => {
                setCurrentQuestionIndex(prevIndex => prevIndex + 1);
                setSelectedOption(null);
                setShowAnswer(false);
                setIsVideoPlaying(false);

                // Fade in animation
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            // Quiz completed
            setQuizCompleted(true);
        }
    };

    // Handle back to course
    const handleBackToCourse = () => {
        router.push(`/learning/${id}`);
    };

    // Handle video status update
    const handleVideoStatus = (status) => {
        setIsVideoPlaying(status.isPlaying);
    };

    // Render the current question
    const renderQuestion = () => {
        if (questions.length === 0) return null;

        const currentQuestion = questions[currentQuestionIndex];

        return (
            <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
                <Text style={styles.questionText}>
                    What sign is being shown in the video?
                </Text>

                <View style={styles.videoContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri: currentQuestion.videoUrl }}
                        style={styles.video}
                        useNativeControls
                        resizeMode="contain"
                        isLooping={false}
                        onPlaybackStatusUpdate={handleVideoStatus}
                        shouldPlay
                    />
                </View>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                selectedOption === option && styles.selectedOption,
                                showAnswer && option === currentQuestion.correctAnswer && styles.correctOption,
                                showAnswer && option === selectedOption && option !== currentQuestion.correctAnswer && styles.incorrectOption
                            ]}
                            onPress={() => handleOptionSelect(option)}
                            disabled={showAnswer}
                        >
                            <Text style={[
                                styles.optionText,
                                showAnswer && option === currentQuestion.correctAnswer && styles.correctOptionText,
                                showAnswer && option === selectedOption && option !== currentQuestion.correctAnswer && styles.incorrectOptionText
                            ]}>
                                {option}
                            </Text>

                            {showAnswer && option === currentQuestion.correctAnswer && (
                                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                            )}

                            {showAnswer && option === selectedOption && option !== currentQuestion.correctAnswer && (
                                <Ionicons name="close-circle" size={24} color="#F44336" />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {showAnswer && (
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={handleNextQuestion}
                    >
                        <Text style={styles.nextButtonText}>
                            {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                        </Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </Animated.View>
        );
    };

    // Render quiz results
    const renderResults = () => {
        const percentage = Math.round((score / questions.length) * 100);

        return (
            <View style={styles.resultsContainer}>
                <Text style={styles.resultTitle}>Quiz Completed!</Text>

                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>{percentage}%</Text>
                    <Text style={styles.scoreSubtext}>
                        You got {score} out of {questions.length} correct
                    </Text>
                </View>

                {percentage >= 80 ? (
                    <View style={styles.feedbackContainer}>
                        <Ionicons name="trophy" size={60} color="#FFD700" />
                        <Text style={styles.feedbackText}>Great job! You've mastered these signs!</Text>
                    </View>
                ) : percentage >= 50 ? (
                    <View style={styles.feedbackContainer}>
                        <Ionicons name="thumbs-up" size={60} color="#4CAF50" />
                        <Text style={styles.feedbackText}>Good effort! Keep practicing to improve.</Text>
                    </View>
                ) : (
                    <View style={styles.feedbackContainer}>
                        <Ionicons name="fitness" size={60} color="#2196F3" />
                        <Text style={styles.feedbackText}>More practice needed. Don't give up!</Text>
                    </View>
                )}

                <View style={styles.resultsButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.resultButton, styles.tryAgainButton]}
                        onPress={() => {
                            setCurrentQuestionIndex(0);
                            setScore(0);
                            setSelectedOption(null);
                            setShowAnswer(false);
                            setQuizCompleted(false);
                        }}
                    >
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        <Text style={styles.resultButtonText}>Try Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.resultButton, styles.backButton]}
                        onPress={handleBackToCourse}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        <Text style={styles.resultButtonText}>Back to Course</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (!course) {
        return (
            <SafeAreaView style={styles.container}>
                <Text>Course not found</Text>
            </SafeAreaView>
        );
    }

    if (questions.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Preparing quiz questions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={handleBackToCourse} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{course.title} Quiz</Text>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(currentQuestionIndex / questions.length) * 100}%` }
                        ]}
                    />
                </View>
                <Text style={styles.progressText}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                </Text>
            </View>

            {quizCompleted ? renderResults() : renderQuestion()}
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
    loadingText: {
        fontSize: 18,
        color: '#666666',
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
    },
    progressContainer: {
        padding: 16,
        backgroundColor: '#F5F5F5',
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E0E0E0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
    },
    questionContainer: {
        padding: 16,
        flex: 1,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 16,
        textAlign: 'center',
    },
    videoContainer: {
        width: '100%',
        height: 240,
        backgroundColor: '#000000',
        borderRadius: 8,
        marginBottom: 24,
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    optionsContainer: {
        marginBottom: 24,
    },
    optionButton: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    selectedOption: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3',
    },
    correctOption: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50',
    },
    incorrectOption: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336',
    },
    optionText: {
        fontSize: 16,
        color: '#333333',
    },
    correctOptionText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    incorrectOptionText: {
        color: '#F44336',
    },
    nextButton: {
        backgroundColor: '#4C9EFF',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8,
    },
    resultsContainer: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 24,
    },
    scoreContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    scoreText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4C9EFF',
        marginBottom: 8,
    },
    scoreSubtext: {
        fontSize: 16,
        color: '#666666',
    },
    feedbackContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    feedbackText: {
        fontSize: 18,
        color: '#333333',
        textAlign: 'center',
        marginTop: 16,
    },
    resultsButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    resultButton: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    tryAgainButton: {
        backgroundColor: '#4CAF50',
    },
    backButton: {
        backgroundColor: '#FF9800',
    },
    resultButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
});