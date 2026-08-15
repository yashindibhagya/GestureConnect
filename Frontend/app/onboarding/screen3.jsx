import React from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import {
    SCREEN_WIDTH,
    scale,
    verticalScale,
    moderateScale,
    fontSize,
    hp,
    contentContainer,
} from "../../utils/responsive";

/**
 * Third and final onboarding screen for new users
 * Introduces users to the learning features
 */
export default function OnboardingScreen3() {
    const router = useRouter();

    // Complete onboarding and start using the app
    const handleGetStarted = async () => {
        try {
            // Mark user as not new anymore - onboarding completed
            await AsyncStorage.setItem("onboardingComplete", "true");

            // Navigate to home tab
            router.replace("/(tabs)/home");
        } catch (error) {
            console.error("Error updating user status:", error);
            Alert.alert("Error", "Something went wrong. Please try again.");
        }
    };

    // Navigate to the previous onboarding screen
    const handleBack = () => {
        router.replace("/onboarding/screen2");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top decorative image */}
            <Image
                source={require("../../assets/images/Unt.png")}
                style={styles.upperLeaves}
            />

            {/* Back button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
            >
                <MaterialIcons name="arrow-back" size={moderateScale(24)} color="#155658" />
            </TouchableOpacity>

            {/* Main content. Scrolls only when it has to — the centred layout
                is preserved on any screen tall enough to fit it. */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.featureImageContainer}>
                    <Image
                        source={require("../../assets/images/learning.png")}
                        style={styles.featureImage}
                    />
                </View>

                <Text style={styles.title}>Learn Sign Language</Text>

                <Text style={styles.description}>
                    Explore a variety of courses designed to help you learn sign language at your own pace.
                    From alphabets to common phrases, we&apos;ve got everything you need to get started.
                </Text>

                <View style={styles.categoriesContainer}>
                    <View style={styles.categoryRow}>
                        <View style={[styles.categoryCard, { backgroundColor: "#FFD8B9" }]}>
                            <Text style={styles.categoryIcon}>📚</Text>
                            <Text style={styles.categoryText}>Alphabet</Text>
                        </View>

                        <View style={[styles.categoryCard, { backgroundColor: "#D7F5D3" }]}>
                            <Text style={styles.categoryIcon}>🦄</Text>
                            <Text style={styles.categoryText}>WH Questions</Text>
                        </View>
                    </View>

                    <View style={styles.categoryRow}>
                        <View style={[styles.categoryCard, { backgroundColor: "#FFE4B9" }]}>
                            <Text style={styles.categoryIcon}>💬</Text>
                            <Text style={styles.categoryText}>Conversation</Text>
                        </View>

                        <View style={[styles.categoryCard, { backgroundColor: "#FFECB3" }]}>
                            <Text style={styles.categoryIcon}>🎨</Text>
                            <Text style={styles.categoryText}>Colours</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Navigation buttons */}
            <View style={styles.navigationContainer}>
                <View style={styles.indicatorsContainer}>
                    <View style={styles.indicator} />
                    <View style={styles.indicator} />
                    <View style={[styles.indicator, styles.activeIndicator]} />
                </View>

                <TouchableOpacity
                    style={styles.getStartedButton}
                    onPress={handleGetStarted}
                    activeOpacity={0.7}
                >
                    <Text style={styles.getStartedButtonText}>Get Started</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom decorative image */}
            <Image
                source={require("../../assets/images/Unt.png")}
                style={styles.lowerLeaves}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#D0F3DA",
    },
    upperLeaves: {
        position: "absolute",
        top: verticalScale(-70),
        width: SCREEN_WIDTH,
        height: hp(30),
        resizeMode: "cover",
        transform: [{ rotate: "180deg" }],
        opacity: 0.4,
    },
    lowerLeaves: {
        position: "absolute",
        bottom: verticalScale(-70),
        width: SCREEN_WIDTH,
        height: hp(25),
        resizeMode: "cover",
        opacity: 0.4,
    },
    backButton: {
        position: "absolute",
        top: verticalScale(10),
        left: scale(20),
        zIndex: 10,
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    scroll: {
        flex: 1,
    },
    contentContainer: {
        ...contentContainer,
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: scale(30),
        paddingTop: verticalScale(60),
        paddingBottom: verticalScale(20),
    },
    featureImageContainer: {
        width: moderateScale(180),
        height: moderateScale(180),
        borderRadius: moderateScale(90),
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: verticalScale(30),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    featureImage: {
        width: moderateScale(120),
        height: moderateScale(120),
        resizeMode: "contain",
    },
    title: {
        fontSize: fontSize(28),
        fontWeight: "bold",
        color: "#155658",
        textAlign: "center",
        marginBottom: verticalScale(20),
    },
    description: {
        fontSize: fontSize(16),
        color: "#444",
        textAlign: "center",
        lineHeight: fontSize(24),
        marginBottom: verticalScale(30),
    },
    categoriesContainer: {
        width: "100%",
        marginTop: verticalScale(10),
    },
    categoryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: verticalScale(15),
    },
    categoryCard: {
        width: "48%",
        padding: moderateScale(15),
        borderRadius: moderateScale(12),
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    categoryIcon: {
        fontSize: fontSize(30),
        marginBottom: verticalScale(10),
    },
    categoryText: {
        fontSize: fontSize(14),
        fontWeight: "bold",
        color: "#333",
        textAlign: "center",
    },
    navigationContainer: {
        ...contentContainer,
        alignItems: "center",
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(40),
    },
    indicatorsContainer: {
        flexDirection: "row",
        marginBottom: verticalScale(20),
    },
    indicator: {
        width: moderateScale(10),
        height: moderateScale(10),
        borderRadius: moderateScale(5),
        backgroundColor: "#BBDFC8",
        marginHorizontal: scale(5),
    },
    activeIndicator: {
        backgroundColor: "#155658",
        width: moderateScale(20),
    },
    getStartedButton: {
        backgroundColor: "#F5A623",
        paddingVertical: verticalScale(15),
        paddingHorizontal: scale(40),
        borderRadius: moderateScale(30),
        width: "80%",
    },
    getStartedButtonText: {
        color: "white",
        fontSize: fontSize(18),
        fontWeight: "bold",
        textAlign: "center",
    },
});
