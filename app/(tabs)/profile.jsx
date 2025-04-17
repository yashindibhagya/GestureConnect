import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { auth, db } from "../../config/firebaseConfig";
import { updateProfile, signOut, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Common from "../../Components/Container/Common";
import Header from "../../Components/Home/Header";

const SettingsScreen = () => {
  const [expanded, setExpanded] = useState({
    account: false,
    accountInfo: false,
    password: false,
    logout: false,
    reportBug: false,
    sendFeedback: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const user = auth.currentUser;
  const router = useRouter();

  // Fetch User Data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFormData({
            name: userData.name || "",
            email: userData.email || user.email,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const toggleExpand = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Update Profile in Firebase
  const handleUpdateProfile = async () => {
    try {
      await updateProfile(user, { displayName: formData.name.trim() });
      await updateDoc(doc(db, "users", user.uid), {
        name: formData.name.trim(),
        email: formData.email.trim(),
      });
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  // Change Password
  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }
    try {
      await updatePassword(user, formData.newPassword);
      Alert.alert("Success", "Password changed successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to change password.");
    }
  };

  // Logout and Redirect to Sign In
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/selectOption/optionSignIn"); // Redirect to the sign-in page
    } catch (error) {
      Alert.alert("Error", "Failed to log out.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 100 }}
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
                <AntDesign name="user" size={20} color="#FFA726" />
                <Text style={styles.optionText}>Account</Text>
              </View>
              <AntDesign
                name={expanded.account ? "up" : "down"}
                size={16}
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
                    size={16}
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
                    >
                      <Text style={styles.buttonText}>Update Profile</Text>
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
                    size={16}
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
                          size={20}
                          color="black"
                          marginBottom={20}
                          marginRight={50}
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
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={20}
                          color="black"
                          marginBottom={20}
                          marginRight={50}
                        />
                      </Pressable>
                    </View>

                    <TouchableOpacity
                      style={styles.updateButton}
                      onPress={handleChangePassword}
                    >
                      <Text style={styles.buttonText}>Change Password</Text>
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
                <AntDesign name="logout" size={20} color="#FFA726" />
                <Text style={styles.optionText}>Logout</Text>
              </View>
              <AntDesign
                name={expanded.logout ? "up" : "down"}
                size={16}
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

            {/* Report a Bug */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => toggleExpand("reportBug")}
            >
              <View style={styles.optionRow}>
                <AntDesign name="warning" size={20} color="#FFA726" />
                <Text style={styles.optionText}>Report a bug</Text>
              </View>
              <AntDesign
                name={expanded.reportBug ? "up" : "down"}
                size={16}
                color="black"
              />
            </TouchableOpacity>

            {/* Send Feedback */}
            <TouchableOpacity
              style={styles.option}
              onPress={() => toggleExpand("sendFeedback")}
            >
              <View style={styles.optionRow}>
                <AntDesign name="form" size={20} color="#FFA726" />
                <Text style={styles.optionText}>Send Feedback</Text>
              </View>
              <AntDesign
                name={expanded.sendFeedback ? "up" : "down"}
                size={16}
                color="black"
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#D0F3DA",
    flex: 1,
    padding: 25,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    //marginTop: 10,
    //marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#717171",
    marginTop: 24,
    marginBottom: 8,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#8A9A95",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  subOption: {
    paddingVertical: 15,
    marginLeft: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#8A9A95",
  },
  subOptionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
  },
  expandedContent: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingVertical: 10,
  },
  expandedSubContent: {
    marginTop: 10,
    paddingLeft: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
    marginLeft: 20,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingLeft: 10,
    marginBottom: 20,
    width: 200,
    marginLeft: 20,
  },
  passwordContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateButton: {
    backgroundColor: "#FFA726",
    paddingVertical: 10,
    borderRadius: 30,
    //marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#FFA726",
    paddingVertical: 10,
    borderRadius: 30,
    marginTop: 20,
  },
});

export default SettingsScreen;
