import React from "react";
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    scale,
    verticalScale,
    moderateScale,
    fontSize,
    contentContainer,
    SCREEN_WIDTH,
} from "../utils/responsive";

// Import the background illustration
import frontImage from "../assets/images/Untitled.png";

// Intrinsic size of the illustration. The artwork is a full bleed scene: a
// white sky at the top and a flat #155658 ground filling the bottom third,
// which is what the welcome copy sits on.
const ILLUSTRATION_ASPECT = 788 / 1704;

export default function WelcomeScreen() {
    const router = useRouter(); // Use Expo Router's navigation

    return (
        <View style={styles.container}>
            {/* Translucent so the illustration runs under the status bar too;
                dark icons because the top of the artwork is the white sky. */}
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle="dark-content"
            />

            {/* Full-bleed illustration.
                It is pinned to the bottom at its natural aspect ratio rather
                than stretched: the width always matches the screen, so the
                scene never letterboxes sideways, and anchoring the bottom
                keeps the ground — and the figures standing on it — in a fixed
                relationship to the copy below on every screen height. Taller
                screens simply reveal more sky, which the white container
                background continues seamlessly; shorter ones crop it. */}
            <Image
                source={frontImage}
                style={styles.illustration}
                resizeMode="cover"
            />

            {/* Overlay content, anchored to the bottom of the safe area so it
                sits above the home indicator on every device height. */}
            <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome to</Text>
                    <Text style={styles.brand}>GestureConnect</Text>

                    {/* Get Started Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/selectOption/optionSignUp")}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>

                    {/* Already have an account? (Link to Sign In Page) */}
                    <TouchableOpacity
                        onPress={() => router.push("/selectOption/optionSignIn")}
                    >
                        <Text style={styles.linkText}>Already have an account?</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Matches the sky at the top of the illustration, so a screen taller
        // than the artwork extends it instead of showing a seam.
        backgroundColor: "#FEFEFE",
    },
    illustration: {
        position: "absolute",
        left: 0,
        bottom: 0,
        // Height follows from the full-screen width via the artwork's own
        // aspect ratio. On a screen taller than that it leaves sky-coloured
        // space at the top; on a shorter one it simply overflows and the sky
        // is cropped, which costs nothing.
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH / ILLUSTRATION_ASPECT,
    },
    safeArea: {
        flex: 1,
        justifyContent: "flex-end",
    },
    content: {
        ...contentContainer,
        alignItems: "center",
        paddingHorizontal: scale(20),
        paddingBottom: verticalScale(60),
    },
    title: {
        fontSize: fontSize(22),
        color: "#fff",
        fontWeight: "400",
    },
    brand: {
        fontSize: fontSize(32),
        fontWeight: "900",
        color: "#fff",
        textAlign: "center",
    },
    button: {
        backgroundColor: "#F5A623", // Yellow button color
        paddingVertical: verticalScale(14),
        paddingHorizontal: scale(40),
        borderRadius: moderateScale(30),
        marginTop: verticalScale(24),
        width: "80%",
        alignItems: "center",
    },
    buttonText: {
        fontSize: fontSize(18),
        fontWeight: "600",
        color: "#fff",
    },
    linkText: {
        fontSize: fontSize(14),
        color: "#C0C0C0",
        marginTop: verticalScale(14),
        textAlign: "center",
    },
    signInText: {
        fontSize: fontSize(14),
        color: "#C0C0C0",
        textDecorationLine: "underline", // Underline only "Sign In"
        fontWeight: "bold", // Make it stand out
    },
});
