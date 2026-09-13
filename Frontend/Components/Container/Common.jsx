import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

/**
 * Common header component that displays the app logo and title
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.showBackButton - Whether to show a back button
 * @param {Function} props.onBack - Custom back button handler (defaults to router.back)
 * @param {Object} props.style - Additional styles for the container
 * @returns {React.Component} Common component
 */
export default function Common({ showBackButton = false, onBack, style = {} }) {
    const router = useRouter();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            router.back();
        }
    };

    return (
        <View style={[styles.container, style]}>
            <View style={styles.contentContainer}>
                {showBackButton && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBack}
                    >
                        <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.buttonContainer}>
                    <Image
                        source={require("../../assets/images/gesture.png")}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>GestureConnect</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "flex-start",
        marginBottom: verticalScale(5),
        width: "100%",
        // No top margin: the screen's SafeAreaView already clears the status
        // bar and its own padding supplies the inset, so anything added here
        // stacks on top of both and reads as dead space.
    },
    contentContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
    },
    title: {
        fontSize: fontSize(16),
        fontWeight: "900",
        color: "#155658",
        marginLeft: scale(5),
    },
    buttonContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        height: moderateScale(30),
        width: moderateScale(30),
    },
    backButton: {
        marginRight: scale(10),
        width: moderateScale(30),
        height: moderateScale(30),
        justifyContent: "center",
        alignItems: "center",
        borderRadius: moderateScale(15),
        backgroundColor: "#E0F2F1",
    },
    backButtonText: {
        fontSize: fontSize(18),
        fontWeight: "bold",
        color: "#155658",
    }
});