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
 * First onboarding screen for new users
 * Introduces users to the app's purpose
 */
export default function OnboardingScreen1() {
    const router = useRouter();

    // Skip the entire onboarding flow
    const handleSkip = async () => {
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

    // Navigate to the next onboarding screen
    const handleNext = () => {
        // Use replace for consistent navigation behavior
        router.push("/onboarding/screen2");
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Top decorative image */}
            <Image
                source={require("../../assets/images/Unt.png")}
                style={styles.upperLeaves}
            />

            {/* Main content. Scrolls only when it has to — the centred layout
                is preserved on any screen tall enough to fit it. */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Image
                    source={require("../../assets/images/gesture.png")}
                    style={styles.logo}
                />

                <Text style={styles.title}>Welcome to GestureConnect</Text>

                <Text style={styles.description}>
                    Breaking barriers through sign language! Connect with the deaf community
                    and learn sign language in an interactive way.
                </Text>

                <View style={styles.featureContainer}>
                    <View style={styles.featureIconContainer}>
                        <Text style={styles.featureIcon}>👋</Text>
                    </View>
                    <View style={styles.featureTextContainer}>
                        <Text style={styles.featureTitle}>Learn Sign Language</Text>
                        <Text style={styles.featureText}>
                            Access a comprehensive library of sign language videos and tutorials
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Navigation buttons */}
            <View style={styles.navigationContainer}>
                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={handleSkip}
                    activeOpacity={0.7}
                >
                    <Text style={styles.skipButtonText}>Skip</Text>
                </TouchableOpacity>

                <View style={styles.indicatorsContainer}>
                    <View style={[styles.indicator, styles.activeIndicator]} />
                    <View style={styles.indicator} />
                    <View style={styles.indicator} />
                </View>

                <TouchableOpacity
                    style={styles.nextButton}
                    onPress={handleNext}
                    activeOpacity={0.7}
                >
                    <Text style={styles.nextButtonText}>Next</Text>
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
    scroll: {
        flex: 1,
    },
    contentContainer: {
        ...contentContainer,
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: scale(30),
        paddingVertical: verticalScale(20),
    },
    logo: {
        width: moderateScale(150),
        height: moderateScale(150),
        marginBottom: verticalScale(30),
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
        marginBottom: verticalScale(40),
    },
    featureContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: moderateScale(16),
        padding: moderateScale(20),
        marginBottom: verticalScale(20),
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    featureIconContainer: {
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        backgroundColor: "#FFECB3",
        justifyContent: "center",
        alignItems: "center",
        marginRight: scale(20),
    },
    featureIcon: {
        fontSize: fontSize(30),
    },
    featureTextContainer: {
        flex: 1,
    },
    featureTitle: {
        fontSize: fontSize(18),
        fontWeight: "bold",
        color: "#155658",
        marginBottom: verticalScale(5),
    },
    featureText: {
        fontSize: fontSize(14),
        color: "#666",
        lineHeight: fontSize(20),
    },
    navigationContainer: {
        ...contentContainer,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(40),
    },
    skipButton: {
        padding: moderateScale(10),
    },
    skipButtonText: {
        color: "#155658",
        fontSize: fontSize(16),
        fontWeight: "500",
    },
    indicatorsContainer: {
        flexDirection: "row",
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
    nextButton: {
        backgroundColor: "#F5A623",
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(25),
        borderRadius: moderateScale(25),
    },
    nextButtonText: {
        color: "white",
        fontSize: fontSize(16),
        fontWeight: "bold",
    },
});