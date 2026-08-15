import React from "react";
import {
    StyleSheet,
    Text,
    View,
    ImageBackground,
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
} from "../utils/responsive";

// Import the background illustration
import frontImage from "../assets/images/Untitled.png";

export default function WelcomeScreen() {
    const router = useRouter(); // Use Expo Router's navigation

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#155658" barStyle="light-content" />

            {/* Background illustration, filling the screen behind the content */}
            <ImageBackground
                source={frontImage}
                style={styles.imageBackground}
                resizeMode="contain"
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
        backgroundColor: "#155658", // Dark green background
    },
    imageBackground: {
        ...StyleSheet.absoluteFillObject,
        // The illustration is top-weighted; bias it upward so the lower third
        // stays clear for the text block.
        bottom: "25%",
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
