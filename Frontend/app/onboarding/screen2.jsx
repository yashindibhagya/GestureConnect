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
 * Second onboarding screen for new users
 * Introduces users to the Text to Sign Language feature
 */
export default function OnboardingScreen2() {
    const router = useRouter();

    // Skip the rest of the onboarding
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
        // Use replace for consistency
        router.replace("/onboarding/screen3");
    };

    // Navigate to the previous onboarding screen
    const handleBack = () => {
        router.replace("/onboarding/screen1");
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
                        source={require("../../assets/images/textsign.png")}
                        style={styles.featureImage}
                    />
                </View>

                <Text style={styles.title}>Text to Sign Language</Text>

                <Text style={styles.description}>
                    Type or speak in English, Sinhala, or Tamil and see the
                    corresponding sign language videos. Our app instantly translates
                    your words into sign language, making communication easy and accessible.
                </Text>

                <View style={styles.stepsContainer}>
                    <View style={styles.step}>
                        <View style={styles.stepNumberContainer}>
                            <Text style={styles.stepNumber}>1</Text>
                        </View>
                        <Text style={styles.stepText}>Type or speak your message</Text>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumberContainer}>
                            <Text style={styles.stepNumber}>2</Text>
                        </View>
                        <Text style={styles.stepText}>Our app translates to sign language</Text>
                    </View>

                    <View style={styles.step}>
                        <View style={styles.stepNumberContainer}>
                            <Text style={styles.stepNumber}>3</Text>
                        </View>
                        <Text style={styles.stepText}>Watch the sign language videos</Text>
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
                    <View style={styles.indicator} />
                    <View style={[styles.indicator, styles.activeIndicator]} />
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
    stepsContainer: {
        width: "100%",
        marginTop: verticalScale(10),
    },
    step: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: verticalScale(15),
    },
    stepNumberContainer: {
        width: moderateScale(30),
        height: moderateScale(30),
        borderRadius: moderateScale(15),
        backgroundColor: "#155658",
        justifyContent: "center",
        alignItems: "center",
        marginRight: scale(15),
    },
    stepNumber: {
        color: "white",
        fontWeight: "bold",
        fontSize: fontSize(14),
    },
    stepText: {
        flex: 1,
        fontSize: fontSize(16),
        color: "#333",
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
