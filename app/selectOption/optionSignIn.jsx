import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { MaterialIcons, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function OptionSignIn() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#D0F3DA" barStyle="dark-content" />

      <Image
        source={require("../../assets/images/Unt.png")}
        style={styles.upperLeaves}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={20} color="black" />
      </TouchableOpacity>

      <Image
        source={require("../../assets/images/gesture.png")}
        style={styles.logo}
      />
      <Text style={styles.welcome}>Welcome Back 🌿</Text>
      <Text style={styles.description}>
        Seamlessly communicate in your own way.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("auth/signIn")}
      >
        <Text style={styles.buttonText}>Typing-proficient</Text>
        <FontAwesome name="keyboard-o" size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("auth/gestureSignIn")}
      >
        <Text style={styles.buttonText}>Non-typing individuals</Text>
        <MaterialIcons name="gesture" size={20} color="white" />
      </TouchableOpacity>

      <Image
        source={require("../../assets/images/Unt.png")}
        style={styles.lowerLeaves}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D0F3DA",
    alignItems: "center",
    paddingTop: 20,
  },
  upperLeaves: {
    position: "absolute",
    top: -70,
    //width: "100%",
    height: 300,
    resizeMode: "cover",
    transform: [{ rotate: "180deg" }],
    opacity: 0.4,
  },
  lowerLeaves: {
    position: "absolute",
    bottom: -90,
    //width: "100%",
    height: 300,
    opacity: 0.4,
  },
  backButton: {
    position: "absolute",
    top: 30,
    left: 10,
    padding: 10, // Adds touchable area
    backgroundColor: "#fff",
    borderRadius: 30,
  },
  logo: {
    width: 200,
    height: 200,
    marginTop: 180,
    alignContent: "center",
  },
  welcome: {
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 8,
  },
  description: {
    textAlign: "center",
    color: "#555",
    paddingHorizontal: 20,
    marginBottom: 10,
    fontWeight: "600",
    marginTop: -8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5a623",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 10,
    width: "80%",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
    textAlign: "center",
    flex: 1,
  },
});
