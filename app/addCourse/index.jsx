import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Common from "../../Components/Container/Common"; // Assuming Common is a custom component
//import { firestore } from "../../firebaseConfig"; // Import your Firestore setup
import { Firestore } from "firebase/firestore";

export default function Learning() {
  const [loading, setLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [file, setFile] = useState(null);
  const [wordName, setWordName] = useState(""); // For new word name

  const handleFileUpload = async () => {
    try {
      // Open Document Picker to select image or video
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allows all file types
      });

      if (res.canceled) return;

      console.log("Selected File:", res);

      // Set the selected file
      setFile(res.assets[0]);
      setLoading(true);

      const { uri, mimeType, name } = res.assets[0];

      // Convert local URI to base64 string (required for Cloudinary)
      const base64Data = await fetch(uri)
        .then((response) => response.blob())
        .then(
          (blob) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
        );

      // Prepare FormData for Cloudinary upload
      const data = new FormData();
      data.append("file", base64Data);
      data.append("upload_preset", "GestureConnectImage"); // Correct preset name
      data.append("cloud_name", "dxjb5lepy"); // Your Cloudinary cloud name

      // Upload to Cloudinary
      const uploadRes = await fetch(
        "https://api.cloudinary.com/v1_1/dxjb5lepy/image/upload",
        {
          method: "POST",
          body: data,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const uploadedImageURL = await uploadRes.json();
      console.log("Uploaded URL:", uploadedImageURL.url);
      setUploadedImage(uploadedImageURL.url);

      setLoading(false);
      Alert.alert("Upload Successful", "Image/Video uploaded successfully!");
    } catch (err) {
      console.error("Upload Error:", err);
      Alert.alert("Error", "Failed to upload image/video.");
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!wordName || !uploadedImage) {
      Alert.alert(
        "Error",
        "Please provide a word name and upload an image or video."
      );
      return;
    }

    try {
      // Add the new word and image/video URL to Firestore
      await Firestore.collection("signLanguageWords").add({
        word: wordName,
        mediaUrl: uploadedImage,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      console.log("New word added:", wordName, uploadedImage);
      Alert.alert("Success", "New word added successfully!");

      // Reset the form after adding the word
      setWordName("");
      setUploadedImage(null);
      setFile(null);
    } catch (error) {
      console.error("Error adding word to Firestore:", error);
      Alert.alert("Error", "Failed to add word to Firestore.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Common Header */}
        <Common />

        <Text style={{ fontSize: 18, marginBottom: 10, textAlign: "center" }}>
          Learn Sign Language
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter the new word"
          value={wordName}
          onChangeText={setWordName}
        />

        {loading ? (
          <ActivityIndicator size="large" color="blue" />
        ) : uploadedImage ? (
          <Image
            source={{ uri: uploadedImage }}
            style={{ width: 100, height: 100, borderRadius: 10 }}
          />
        ) : (
          <Text>No Image/Video Uploaded</Text>
        )}

        <Button title="Pick an Image or Video" onPress={handleFileUpload} />

        {file && (
          <Text style={styles.fileInfo}>Selected File: {file.name}</Text>
        )}

        <Button title="Add Word" onPress={handleAddWord} />
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
  fileInfo: {
    marginTop: 10,
    fontSize: 16,
    color: "black",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
    marginBottom: 20,
    fontSize: 16,
  },
});
