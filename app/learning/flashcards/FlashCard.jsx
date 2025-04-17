import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Animated,
    Dimensions,
    PanResponder
} from 'react-native';
import { Video } from 'expo-av';
import { VideoContext } from '../../../context/VideoContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

export default function Flashcards() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { coursesData, markSignAsCompleted } = useContext(VideoContext);

    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const swipe = useRef(new Animated.ValueXY()).current;
    const tiltAnimation = useRef(new Animated.Value(0)).current;
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const videoRef = useRef(null);

    // Find the current course
    const course = coursesData.find(course => course.id === id);

    // Prepare flashcards from course signs
    useEffect(() => {
        if (course && course.signs.length > 0) {
            // Filter out signs with no video
            const validSigns = course.signs.filter(sign => sign.videoUrl);
            setCards(validSigns);
        }
    }, [course]);

    // Reset animations when current index changes
    useEffect(() => {
        flipAnimation.setValue(0);
        setIsFlipped(false);
        swipe.setValue({ x: 0, y: 0 });
        tiltAnimation.setValue(0);
    }, [currentIndex]);

    // Pan responder for swipe gestures
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                if (!isFlipped) {
                    swipe.setValue({ x: gesture.dx, y: gesture.dy });
                    tiltAnimation.setValue(gesture.dx / SCREEN_WIDTH);
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (isFlipped) return;

                if (gesture.dx > SWIPE_THRESHOLD) {
                    // Swipe right (correct)
                    swipeRight();
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    // Swipe left (skip)
                    swipeLeft();
                } else {
                    // Return to center
                    Animated.spring(swipe, {
                        toValue: { x: 0, y: 0 },
                        friction: 5,
                        useNativeDriver: true,
                    }).start();

                    Animated.spring(tiltAnimation, {
                        toValue: 0,
                        friction: 5,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    // Flip card animation
    const flipCard = () => {
        if (isFlipped) {
            Animated.timing(flipAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIsFlipped(false));
        } else {
            Animated.timing(flipAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setIsFlipped(true));
        }
    };

    // Swipe right animation (correct)
    const swipeRight = () => {
        Animated.timing(swipe, {
            toValue: { x: SCREEN_WIDTH + 100, y: 0 },
            duration: 400,
            useNativeDriver: true,
        }).start(() => handleSwipeComplete('right'));

        if (cards[currentIndex]) {
            markSignAsCompleted(cards[currentIndex].signId);
        }
    };

    // Swipe left animation (skip)
    const swipeLeft = () => {
        Animated.timing(swipe, {
            toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
            duration: 400,
            useNativeDriver: true,
        }).start(() => handleSwipeComplete('left'));
    };

    // Handle after swipe completion
    const handleSwipeComplete = (direction) => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setIsCompleted(true);
        }
    };

    // Handle back to course
    const handleBackToCourse = () => {
        router.push(`/learning/${id}`);
    };

    // Handle restart
    const handleRestart = () => {
        setCurrentIndex(0);
        setIsCompleted(false);
    };

    // Get card rotate animation style
    const getCardRotateStyle = () => {
        const rotate = tiltAnimation.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: ['-10deg', '0deg', '10deg'],
        });

        const flipRotate = flipAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
        });

        return {
            transform: [
                { translateX: swipe.x },
                { rotate },
                { rotateY: flipRotate },
            ],
        };
    };

    // Get back card rotate style
    const getBackCardRotateStyle = () => {
        const flipRotate = flipAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ['180deg', '360deg'],
        });

        return {
            transform: [
                { rotateY: flipRotate },
            ],
            backfaceVisibility: 'hidden',
        };
    };

    // Render flashcard front (word)
    const renderCardFront = () => {
        if (currentIndex >= cards.length) return null;

        const card = cards[currentIndex];

        return (
            <Animated.View
                style={[styles.card, getCardRotateStyle()]}
                {...panResponder.panHandlers}
            >
                <Text style={styles.cardWord}>{card.word}</Text>
                <Text style={styles.cardInstructions}>Tap to see the sign</Text>

                <View style={styles.swipeInstructions}>
                    <View style={styles.swipeInstruction}>
                        <Ionicons name="arrow-back" size={24} color="#F44336" />
                        <Text style={styles.swipeInstructionText}>Skip</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.flipButton}
                        onPress={flipCard}
                    >
                        <Ionicons name="sync" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.swipeInstruction}>
                        <Text style={styles.swipeInstructionText}>Correct</Text>
                        <Ionicons name="arrow-forward" size={24} color="#4CAF50" />
                    </View>
                </View>

                <Text style={styles.cardProgress}>
                    {currentIndex + 1} / {cards.length}
                </Text>
            </Animated.View>
        );
    };

    // Render flashcard back (video)
    const renderCardBack = () => {
        if (currentIndex >= cards.length) return null;

        const card = cards[currentIndex];

        return (
            <Animated.View
                style={[styles.card, styles.cardBack, getBackCardRotateStyle()]}
            >
                <View style={styles.videoContainer}>
                    <Video
                        ref={videoRef}
                        source={{ uri: card.videoUrl }}
                        style={styles.video}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        shouldPlay
                    />
                </View>

                <Text style={styles.cardInstructions}>
                    Practice this sign, then swipe right if you've got it!
                </Text>

                <TouchableOpacity
                    style={styles.flipButton}
                    onPress={flipCard}
                >
                    <Ionicons name="sync" size={24} color="#FFF" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Render completion screen
    const renderCompletionScreen = () => {
        return (
            <View style={styles.completionContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                <Text style={styles.completionTitle}>You've completed all flashcards!</Text>
                <Text style={styles.completionSubtext}>
                    Great job practicing these signs. Continue practicing to improve your skills.
                </Text>

                <View style={styles.completionButtons}>
                    <TouchableOpacity
                        style={[styles.completionButton, styles.restartButton]}
                        onPress={handleRestart}
                    >
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        <Text style={styles.completionButtonText}>Start Over</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.completionButton, styles.backButton]}
                        onPress={handleBackToCourse}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                        <Text style={styles.completionButtonText}>Back to Course</Text>
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

    if (cards.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Preparing flashcards...</Text>
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
                <Text style={styles.headerTitle}>{course.title} Flashcards</Text>
            </View>

            <View style={styles.cardsContainer}>
                {isCompleted ? (
                    renderCompletionScreen()
                ) : (
                    <>
                        {renderCardFront()}
                        {renderCardBack()}
                    </>
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
    cardsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: SCREEN_WIDTH - 40,
        height: 450,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        position: 'absolute',
        backfaceVisibility: 'hidden',
    },
    cardBack: {
        backgroundColor: '#F5F5F5',
    },
    cardWord: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333333',
        marginBottom: 24,
        textAlign: 'center',
    },
    cardInstructions: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
    },
    swipeInstructions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 24,
    },
    swipeInstruction: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    swipeInstructionText: {
        marginHorizontal: 8,
        fontSize: 14,
        color: '#666666',
    },
    flipButton: {
        backgroundColor: '#4C9EFF',
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardProgress: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        fontSize: 14,
        color: '#999999',
    },
    videoContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#000000',
        borderRadius: 8,
        marginBottom: 24,
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    completionContainer: {
        alignItems: 'center',
        padding: 24,
    },
    completionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333333',
        marginTop: 24,
        marginBottom: 16,
        textAlign: 'center',
    },
    completionSubtext: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 32,
    },
    completionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    completionButton: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    restartButton: {
        backgroundColor: '#4C9EFF',
    },
    backButton: {
        backgroundColor: '#FF9800',
    },
    completionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
});