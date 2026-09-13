// Frontend/app/(tabs)/home.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { UserDetailContext } from "../../context/UserDetailContext";
import { VideoContext } from "../../context/VideoContext";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import Common from "../../Components/Container/Common";
import InProgressCourses from "../../Components/Home/InProgressCourses";
import NewCourses from "../../Components/Home/NewCourses";
import Header from "../../Components/Home/Header";
import WelcomeCard from "../../Components/Home/WelcomeCard"; // Import WelcomeCard
import { MaterialIcons } from "@expo/vector-icons";
import {
    GUTTER,
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";
import { tabBarClearance } from "../../constants/navigation";

export default function Home() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Use direct context access with fallback for when context is missing
    const userDetailContext = useContext(UserDetailContext);
    const userDetail = userDetailContext?.userDetail || { name: "Friend" };

    // Read the context directly rather than via useVideo(), which throws outside a
    // VideoProvider — a hook call in a try/catch breaks React's hook ordering.
    const videoContext = useContext(VideoContext) ?? {
        coursesData: [],
        getCoursesWithProgress: () => []
    };

    const { coursesData, getCoursesWithProgress } = videoContext;

    const [inProgressCourses, setInProgressCourses] = useState([]);
    const [notStartedCourses, setNotStartedCourses] = useState([]);
    const [recentConversations, setRecentConversations] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Load data function that can be called on initial load and refresh
    const loadData = useCallback(async () => {
        // Handle potential missing context
        if (!getCoursesWithProgress) {
            console.warn("getCoursesWithProgress not available");
            return;
        }

        // Process courses and categorize them
        if (coursesData && coursesData.length > 0) {
            try {
                // Get all courses with progress
                const coursesWithProgress = getCoursesWithProgress();

                // Categorize courses into in-progress and not started
                const inProgress = [];
                const notStarted = [];

                coursesWithProgress.forEach(course => {
                    if (course.progress && course.progress.completed > 0) {
                        inProgress.push(course);
                    } else {
                        notStarted.push(course);
                    }
                });

                // Sort in-progress courses by completion percentage (descending)
                inProgress.sort((a, b) => (b.progress?.percentage || 0) - (a.progress?.percentage || 0));

                setInProgressCourses(inProgress);
                setNotStartedCourses(notStarted);
            } catch (error) {
                console.error("Error processing courses:", error);
            }
        }

        // Load recent conversations
        if (auth && auth.currentUser) {
            try {
                const conversationsRef = collection(db, "users", auth.currentUser.uid, "conversations");
                const q = query(conversationsRef, orderBy("timestamp", "desc"), limit(3));
                const querySnapshot = await getDocs(q);

                const conversations = [];
                querySnapshot.forEach(doc => {
                    conversations.push(doc.data());
                });

                setRecentConversations(conversations);
            } catch (error) {
                console.error("Error loading conversations:", error);
            }
        }
    }, [coursesData, getCoursesWithProgress]);

    // Load data on initial mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handle refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#D0F3DA" barStyle="dark-content" />
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: tabBarClearance(insets.bottom) }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#155658"]}
                        tintColor={"#155658"}
                    />
                }
            >
                <Common />

                <Header />

                {/* Saved Translations Button */}
                <TouchableOpacity
                    style={styles.savedButton}
                    onPress={() => router.push("/saveSign/savedTranslations")}
                >
                    <MaterialIcons name="history" size={moderateScale(20)} color="#155658" />
                    <Text style={styles.savedButtonText}>View Saved Translations</Text>
                </TouchableOpacity>

                {/* Progress Section - Show WelcomeCard for new users */}
                <View style={styles.sectionContainer}>
                    {inProgressCourses.length > 0 ? (
                        <InProgressCourses courses={inProgressCourses} />
                    ) : (
                        <WelcomeCard />
                    )}
                    <NewCourses courses={notStartedCourses} />
                </View>

                {/* Feature Cards */}
                <View style={styles.featureCardsContainer}>
                    {/* Sign to Text Card */}
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/signToText")}
                        style={styles.card}
                    >
                        <ImageBackground
                            source={require("../../assets/images/sign.png")}
                            style={styles.container}
                            resizeMode="cover"
                        >
                            <View style={styles.contentContainerCard}>
                                <Text style={styles.featureCardTitle}>Sign language - to- Text</Text>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>

                    {/* Text to Sign Card */}
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/textToSign")}
                        style={styles.card}
                    >
                        <ImageBackground
                            source={require("../../assets/images/text.png")}
                            style={styles.container}
                            resizeMode="cover"
                        >
                            <View style={styles.contentContainerCard}>
                                <Text style={styles.featureCardTitle}>Text - to - Sign language</Text>
                            </View>
                        </ImageBackground>
                    </TouchableOpacity>
                </View>

                {/* Recent Conversations Section */}
                {recentConversations.length > 0 && (
                    <View style={styles.conversationsContainer}>
                        <Text style={styles.sectionTitle}>Recent Conversations</Text>
                        {recentConversations.map((conversation, index) => (
                            <View key={index} style={styles.conversationCard}>
                                <Text style={styles.conversationText}>
                                    {conversation.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#D0F3DA",
    },
    container: {
        flex: 1,
        // Same constant the full-bleed card rows cancel and re-apply, so the
        // two cannot drift out of alignment.
        padding: GUTTER,
    },
    contentContainerCard: {
        paddingBottom: verticalScale(65),
    },
    greetingContainer: {
        marginTop: verticalScale(10),
    },
    greeting: {
        fontSize: fontSize(16),
        color: "#666",
    },
    userName: {
        fontSize: fontSize(28),
        fontWeight: "bold",
        color: "#000",
        marginTop: verticalScale(5),
    },
    startedText: {
        fontSize: fontSize(16),
        color: "#333",
        marginTop: verticalScale(5),
    },
    savedButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E0F2F1",
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(15),
        borderRadius: moderateScale(20),
        alignSelf: "flex-start",
        //marginTop: 10,
        marginBottom: verticalScale(35),
        marginLeft: scale(150),
        marginTop: verticalScale(-70)
    },
    savedButtonText: {
        color: "#155658",
        marginLeft: scale(8),
        fontWeight: "500",
    },
    sectionContainer: {
        marginTop: verticalScale(10),
    },
    sectionTitle: {
        fontSize: fontSize(18),
        fontWeight: "bold",
        color: "#000",
        marginBottom: verticalScale(12),
    },
    featureCardsContainer: {
        //marginTop: 25,
        //marginBottom: 30
    },
    signToTextCard: {
        backgroundColor: "#155658",
    },
    textToSignCard: {
        backgroundColor: "#155658",
    },
    featureCardContent: {
        flex: 1,
    },
    featureCardTitle: {
        fontSize: fontSize(16),
        fontWeight: "bold",
        color: "#fff",
        paddingRight: scale(10),
        top: verticalScale(45)
    },
    featureCardImage: {
        width: moderateScale(80),
        height: moderateScale(80),
        resizeMode: "contain",
    },
    conversationsContainer: {
        marginTop: verticalScale(5),
    },
    conversationCard: {
        backgroundColor: "#fff",
        borderRadius: moderateScale(10),
        padding: moderateScale(15),
        marginBottom: verticalScale(10),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    conversationText: {
        fontSize: fontSize(14),
        color: "#333",
    },
    card: {
        marginTop: verticalScale(-5)
    }
});