import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Button,
  Pressable,
} from "react-native";
import React from "react";
import Common from "../../Components/Container/Common";
import Header from "../../Components/Home/Header";
import { useRouter } from "expo-router";

export default function Learning() {
  const router = useRouter();
  const handleFileUpload = (event) => { };
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }} // Add extra bottom padding
        keyboardShouldPersistTaps="handled" // Ensures smooth scrolling
        showsVerticalScrollIndicator={false}
      >
        {/* Common Header */}
        <Common />
        <Pressable onPress={() => router.push("/addCourse")}>
          <Text>Create New Account</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D0F3DA",
    padding: 20,
  },
});
