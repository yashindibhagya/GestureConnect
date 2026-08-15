import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Common from "../../Components/Container/Common";
import { useUserDetail } from "../../context/UserDetailContext";
import {
    updateUserProfile,
    // FIREBASE_AUTH_DISABLED — restore alongside sign in/sign up:
    // changePassword,
    // logoutUser
} from "../../services/authService";
import { auth } from "../../config/firebaseConfig";
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";
import { tabBarClearance } from "../../constants/navigation";

/**
 * Profile/Settings screen that allows users to manage their account
 */
export default function Profile() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { userDetail, setUserDetail, isLoading: userLoading } = useUserDetail();

    const [expanded, setExpanded] = useState({
        account: false,
        accountInfo: false,
        password: false,
        logout: false,
        sendFeedback: false,
    });

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        newPassword: "",
        confirmPassword: "",
        feedback: "",
    });

    const [loading, setLoading] = useState(false);
    const [sendingFeedback, setSendingFeedback] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Initialize form data with user details when they're loaded
    useEffect(() => {
        if (userDetail) {
            setFormData({
                name: userDetail.name || "",
                email: userDetail.email || auth.currentUser?.email || "",
                newPassword: "",
                confirmPassword: "",
                feedback: "",
            });
        }
    }, [userDetail]);

    const toggleExpand = (section) => {
        setExpanded((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Update Profile in Firebase
    const handleUpdateProfile = async () => {
        if (!formData.name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("Not logged in");
            }

            await updateUserProfile(user, { name: formData.name.trim() });

            // Update local state
            setUserDetail({
                ...userDetail,
                name: formData.name.trim()
            });

            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    // Change Password
    const handleChangePassword = async () => {
        if (!formData.newPassword || !formData.confirmPassword) {
            Alert.alert("Error", "Please enter both password fields.");
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        if (formData.newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters.");
            return;
        }

        // FIREBASE_AUTH_DISABLED — changing a password needs a signed-in Firebase user.
        Alert.alert("Unavailable", "Password change is disabled while sign in is turned off.");

        // setLoading(true);
        // try {
        //     const user = auth.currentUser;
        //     if (!user) {
        //         throw new Error("Not logged in");
        //     }
        //
        //     await changePassword(user, formData.newPassword);
        //
        //     Alert.alert("Success", "Password changed successfully!");
        //
        //     // Clear password fields
        //     setFormData({
        //         ...formData,
        //         newPassword: "",
        //         confirmPassword: ""
        //     });
        // } catch (error) {
        //     console.error("Password change error:", error);
        //
        //     // Handle specific Firebase auth errors
        //     if (error.code === 'auth/requires-recent-login') {
        //         Alert.alert(
        //             "Authentication Required",
        //             "Please sign out and sign in again to change your password.",
        //             [
        //                 { text: "OK" },
        //                 {
        //                     text: "Sign Out Now",
        //                     onPress: handleLogout,
        //                     style: "destructive"
        //                 }
        //             ]
        //         );
        //     } else {
        //         Alert.alert("Error", "Failed to change password.");
        //     }
        // } finally {
        //     setLoading(false);
        // }
    };

    // Logout and Redirect to Sign In
    const handleLogout = async () => {
        // FIREBASE_AUTH_DISABLED — there is no session to end, so just go back to
        // the welcome screen. Restore the block below with sign in/sign up.
        router.replace("/");

        // try {
        //     await logoutUser();
        //     // Explicitly navigate to the welcome screen after logout
        //     router.replace("/"); // Redirect to welcome screen
        // } catch (error) {
        //     console.error("Logout error:", error);
        //     Alert.alert("Error", "Failed to log out.");
        // }
    };

    // Send Feedback
    const handleSendFeedback = async () => {
        if (!formData.feedback.trim()) {
            Alert.alert("Error", "Please enter your feedback");
            return;
        }

        setSendingFeedback(true);
        try {
            // This is where you would implement your feedback submission logic
            // For example, sending to your server or Firebase

            // Simulating an API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Show success message
            Alert.alert(
                "Feedback Sent",
                "Thank you for your feedback! We appreciate your input."
            );

            // Clear feedback field
            setFormData({
                ...formData,
                feedback: ""
            });

            // Collapse the feedback section
            setExpanded(prev => ({
                ...prev,
                sendFeedback: false
            }));

        } catch (error) {
            console.error("Send feedback error:", error);
            Alert.alert("Error", "Failed to send feedback. Please try again.");
        } finally {
            setSendingFeedback(false);
        }
    };

    if (userLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <Common />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F7B316" />
                    <Text>Loading user profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={{ paddingBottom: tabBarClearance(insets.bottom) }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Common Header */}
                    <Common />

                    <StatusBar backgroundColor="#D0F3DA" barStyle="dark-content" />

                    <Text style={styles.title}>Settings</Text>

                    <View>
                        <Text style={styles.sectionHeader}>GENERAL</Text>

                        {/* Account */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => toggleExpand("account")}
                        >
                            <View style={styles.optionRow}>
                                <AntDesign name="user" size={moderateScale(20)} color="#FFA726" />
                                <Text style={styles.optionText}>Account</Text>
                            </View>
                            <AntDesign
                                name={expanded.account ? "up" : "down"}
                                size={moderateScale(16)}
                                color="black"
                            />
                        </TouchableOpacity>

                        {expanded.account && (
                            <View style={styles.expandedContent}>
                                {/* Account Information */}
                                <TouchableOpacity
                                    style={styles.subOption}
                                    onPress={() => toggleExpand("accountInfo")}
                                >
                                    <Text style={styles.subOptionText}>Account Information</Text>
                                    <AntDesign
                                        name={expanded.accountInfo ? "up" : "down"}
                                        size={moderateScale(16)}
                                        color="black"
                                    />
                                </TouchableOpacity>

                                {expanded.accountInfo && (
                                    <View style={styles.expandedSubContent}>
                                        <Text style={styles.label}>Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.name}
                                            onChangeText={(text) =>
                                                setFormData((prev) => ({ ...prev, name: text }))
                                            }
                                        />
                                        <Text style={styles.label}>Email (Read-only)</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={formData.email}
                                            editable={false}
                                        />
                                        <TouchableOpacity
                                            style={styles.updateButton}
                                            onPress={handleUpdateProfile}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <Text style={styles.buttonText}>Update Profile</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Password */}
                                <TouchableOpacity
                                    style={styles.subOption}
                                    onPress={() => toggleExpand("password")}
                                >
                                    <Text style={styles.subOptionText}>Password</Text>
                                    <AntDesign
                                        name={expanded.password ? "up" : "down"}
                                        size={moderateScale(16)}
                                        color="black"
                                    />
                                </TouchableOpacity>

                                {expanded.password && (
                                    <View style={styles.expandedSubContent}>
                                        <Text style={styles.label}>New Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                style={styles.input}
                                                value={formData.newPassword}
                                                onChangeText={(text) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        newPassword: text,
                                                    }))
                                                }
                                                secureTextEntry={!showPassword}
                                            />
                                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                                <Ionicons
                                                    name={showPassword ? "eye-off" : "eye"}
                                                    size={moderateScale(20)}
                                                    color="black"
                                                    style={styles.eyeIcon}
                                                />
                                            </Pressable>
                                        </View>

                                        <Text style={styles.label}>Confirm Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <TextInput
                                                style={styles.input}
                                                value={formData.confirmPassword}
                                                onChangeText={(text) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        confirmPassword: text,
                                                    }))
                                                }
                                                secureTextEntry={!showConfirmPassword}
                                            />
                                            <Pressable
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                <Ionicons
                                                    name={showConfirmPassword ? "eye-off" : "eye"}
                                                    size={moderateScale(20)}
                                                    color="black"
                                                    style={styles.eyeIcon}
                                                />
                                            </Pressable>
                                        </View>

                                        <TouchableOpacity
                                            style={styles.updateButton}
                                            onPress={handleChangePassword}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <ActivityIndicator size="small" color="#FFFFFF" />
                                            ) : (
                                                <Text style={styles.buttonText}>Change Password</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Logout */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => toggleExpand("logout")}
                        >
                            <View style={styles.optionRow}>
                                <AntDesign name="logout" size={moderateScale(20)} color="#FFA726" />
                                <Text style={styles.optionText}>Logout</Text>
                            </View>
                            <AntDesign
                                name={expanded.logout ? "up" : "down"}
                                size={moderateScale(16)}
                                color="black"
                            />
                        </TouchableOpacity>

                        {expanded.logout && (
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={handleLogout}
                            >
                                <Text style={styles.buttonText}>Confirm Logout</Text>
                            </TouchableOpacity>
                        )}

                        {/* Feedback Section */}
                        <Text style={styles.sectionHeader}>FEEDBACK</Text>

                        {/* Send Feedback */}
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => toggleExpand("sendFeedback")}
                        >
                            <View style={styles.optionRow}>
                                <AntDesign name="form" size={moderateScale(20)} color="#FFA726" />
                                <Text style={styles.optionText}>Send Feedback</Text>
                            </View>
                            <AntDesign
                                name={expanded.sendFeedback ? "up" : "down"}
                                size={moderateScale(16)}
                                color="black"
                            />
                        </TouchableOpacity>

                        {expanded.sendFeedback && (
                            <View style={styles.expandedContent}>
                                <Text style={styles.feedbackLabel}>
                                    We&apos;d love to hear your thoughts on how we can improve the app!
                                </Text>
                                <TextInput
                                    style={styles.feedbackInput}
                                    value={formData.feedback}
                                    onChangeText={(text) =>
                                        setFormData((prev) => ({ ...prev, feedback: text }))
                                    }
                                    placeholder="Enter your feedback here..."
                                    multiline={true}
                                    numberOfLines={5}
                                    textAlignVertical="top"
                                />
                                <TouchableOpacity
                                    style={styles.submitFeedbackButton}
                                    onPress={handleSendFeedback}
                                    disabled={sendingFeedback}
                                >
                                    {sendingFeedback ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.buttonText}>Submit Feedback</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
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
    container: {
        flex: 1,
        padding: moderateScale(25),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: fontSize(24),
        fontWeight: "bold",
    },
    sectionHeader: {
        fontSize: fontSize(12),
        fontWeight: "bold",
        color: "#717171",
        marginTop: verticalScale(24),
        marginBottom: verticalScale(8),
    },
    option: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: verticalScale(15),
        borderBottomWidth: 1,
        borderBottomColor: "#8A9A95",
    },
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    optionText: {
        marginLeft: scale(8),
        fontSize: fontSize(14),
        fontWeight: "500",
    },
    subOption: {
        paddingVertical: verticalScale(15),
        marginLeft: scale(20),
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#8A9A95",
    },
    subOptionText: {
        fontSize: fontSize(14),
        fontWeight: "500",
        marginLeft: scale(10),
    },
    expandedContent: {
        paddingLeft: scale(20),
        paddingRight: scale(20),
        paddingVertical: verticalScale(10),
    },
    expandedSubContent: {
        marginTop: verticalScale(10),
        paddingLeft: scale(20),
    },
    label: {
        fontSize: fontSize(12),
        fontWeight: "500",
        marginBottom: verticalScale(8),
        marginLeft: scale(20),
    },
    input: {
        height: verticalScale(40),
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: moderateScale(4),
        paddingLeft: scale(10),
        marginBottom: verticalScale(20),
        width: scale(200),
        marginLeft: scale(20),
        backgroundColor: "#fff",
    },
    passwordContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    eyeIcon: {
        marginBottom: verticalScale(20),
        marginRight: scale(50),
    },
    updateButton: {
        backgroundColor: "#FFA726",
        paddingVertical: verticalScale(10),
        borderRadius: moderateScale(30),
        alignItems: 'center',
        justifyContent: 'center',
        width: scale(200),
        marginLeft: scale(20),
    },
    buttonText: {
        color: "#fff",
        fontSize: fontSize(16),
        textAlign: "center",
    },
    logoutButton: {
        backgroundColor: "#FFA726",
        paddingVertical: verticalScale(10),
        borderRadius: moderateScale(30),
        marginTop: verticalScale(20),
        alignItems: 'center',
        justifyContent: 'center',
    },
    // New styles for feedback section
    feedbackLabel: {
        fontSize: fontSize(14),
        color: "#333",
        marginBottom: verticalScale(10),
        marginLeft: scale(10),
    },
    feedbackInput: {
        width: "100%",
        height: verticalScale(120),
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: moderateScale(8),
        padding: moderateScale(10),
        marginBottom: verticalScale(15),
        backgroundColor: "#fff",
        marginLeft: 0,
    },
    submitFeedbackButton: {
        backgroundColor: "#FFA726",
        paddingVertical: verticalScale(10),
        borderRadius: moderateScale(30),
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: verticalScale(5),
    },
});