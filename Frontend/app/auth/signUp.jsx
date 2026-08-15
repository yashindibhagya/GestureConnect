import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
// FIREBASE_AUTH_DISABLED — restore when re-enabling sign up:
// import { registerUser } from "../../services/authService";
import Button from "../../Components/Shared/Button";
import {
    SCREEN_WIDTH,
    contentContainer,
    fontSize,
    hp,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

/**
 * Sign Up screen for creating a new account
 */
export default function SignUp() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle sign up
    const handleSignUp = async () => {
        // Validate input
        if (!name.trim()) {
            Alert.alert("Error", "Please enter your name");
            return;
        }

        if (!email.trim()) {
            Alert.alert("Error", "Please enter your email");
            return;
        }

        if (!password) {
            Alert.alert("Error", "Please enter a password");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        // FIREBASE_AUTH_DISABLED — no account is created; go straight to the app.
        // Delete these two lines when restoring the block below.
        setLoading(false);
        router.replace("/(tabs)/home");

        // try {
        //     // Register the user
        //     await registerUser(email, password, name);
        //
        //     // Show success message and navigate to sign in
        //     Alert.alert(
        //         "Account Created",
        //         "Your account has been successfully created!",
        //         [
        //             {
        //                 text: "Sign In Now",
        //                 onPress: () => router.push("/auth/signIn")
        //             }
        //         ]
        //     );
        // } catch (error) {
        //     console.error("Registration error:", error);
        //
        //     // Handle specific error codes
        //     let errorMessage = "Failed to create account.";
        //
        //     if (error.code === 'auth/email-already-in-use') {
        //         errorMessage = "This email is already in use. Please use a different email or sign in.";
        //     } else if (error.code === 'auth/invalid-email') {
        //         errorMessage = "Invalid email address.";
        //     } else if (error.code === 'auth/weak-password') {
        //         errorMessage = "Password is too weak. Please choose a stronger password.";
        //     }
        //
        //     Alert.alert("Sign Up Failed", errorMessage);
        // } finally {
        //     setLoading(false);
        // }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back" size={moderateScale(20)} color="black" />
                    </TouchableOpacity>

                    {/* Logo */}
                    <Image
                        source={require("../../assets/images/gesture.png")}
                        style={styles.logo}
                    />

                    {/* Header */}
                    <Text style={styles.heading}>Create New Account</Text>
                    <Text style={styles.subHeading}>
                        Sign up now for free and start learning and translating signs to text
                    </Text>

                    {/* Form */}
                    <TextInput
                        placeholder="Full Name"
                        style={styles.textInput}
                        onChangeText={setName}
                        value={name}
                    />

                    <TextInput
                        placeholder="Email"
                        style={styles.textInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onChangeText={setEmail}
                        value={email}
                    />

                    <TextInput
                        placeholder="Password"
                        secureTextEntry={true}
                        style={styles.textInput}
                        onChangeText={setPassword}
                        value={password}
                    />

                    {/* Sign Up Button */}
                    <Button
                        text="Create Account"
                        onPress={handleSignUp}
                        loading={loading}
                        style={styles.button}
                    />

                    {/* Sign In Link */}
                    <View style={styles.buttonContainer}>
                        <Text>Already have an account?</Text>
                        <TouchableOpacity onPress={() => router.push("/auth/signIn")}>
                            <Text style={styles.signInLink}>Sign In here</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Decorative Image */}
                    <Image
                        source={require("../../assets/images/Unt.png")}
                        style={styles.lowerLeaves}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#D0F3DA",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        ...contentContainer,
        flexGrow: 1,
        alignItems: "center",
        padding: moderateScale(25),
    },
    logo: {
        width: moderateScale(100),
        height: moderateScale(100),
        marginTop: verticalScale(80),
        marginBottom: verticalScale(20),
    },
    heading: {
        textAlign: "center",
        fontSize: fontSize(30),
        fontWeight: "bold",
        marginBottom: verticalScale(10),
        color: "#155658",
    },
    subHeading: {
        textAlign: "center",
        fontSize: fontSize(16),
        color: "#555",
        marginBottom: verticalScale(20),
    },
    textInput: {
        width: "90%",
        padding: moderateScale(15),
        fontSize: fontSize(16),
        marginTop: verticalScale(10),
        borderBottomWidth: 1,
        borderBottomColor: "#555",
        backgroundColor: "rgba(255,255,255,0.4)",
        borderRadius: moderateScale(5),
    },
    button: {
        marginTop: verticalScale(20),
        marginBottom: verticalScale(20),
    },
    buttonContainer: {
        flexDirection: "row",
        marginTop: verticalScale(10),
    },
    signInLink: {
        color: "#155658",
        fontWeight: "bold",
        marginLeft: scale(5),
    },
    lowerLeaves: {
        width: SCREEN_WIDTH,
        height: hp(30),
        resizeMode: "cover",
        opacity: 0.4,
    },
    backButton: {
        position: "absolute",
        top: verticalScale(20),
        left: scale(10),
        padding: moderateScale(10),
        backgroundColor: "#fff",
        borderRadius: moderateScale(30),
        zIndex: 1,
    },
});