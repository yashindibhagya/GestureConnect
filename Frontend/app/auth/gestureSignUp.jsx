import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import Common from "../../Components/Container/Common";

/**
 * Placeholder for gesture-based sign up.
 *
 * The gesture authentication flow is not implemented yet. This screen exists so the
 * "Non-typing individuals" option on the sign-up chooser resolves to a real route
 * instead of a dead link, and so the state is visible rather than a blank screen.
 */
export default function GestureSignUp() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Common showBackButton />

            <View style={styles.content}>
                <MaterialIcons name="gesture" size={54} color="#155658" />
                <Text style={styles.title}>Gesture sign up</Text>
                <Text style={styles.body}>
                    Signing up with hand gestures is still being built. For now you can
                    create your account with the typing option.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.replace("/auth/signUp")}
                >
                    <Text style={styles.buttonText}>Use typing instead</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#D0F3DA",
        paddingHorizontal: 25,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 60,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#155658",
        marginTop: 14,
    },
    body: {
        fontSize: 15,
        color: "#555",
        textAlign: "center",
        marginTop: 10,
        lineHeight: 22,
    },
    button: {
        backgroundColor: "#155658",
        paddingVertical: 13,
        paddingHorizontal: 30,
        borderRadius: 30,
        marginTop: 24,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
