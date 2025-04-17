import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import React, { useContext, useState } from "react";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { setDoc, doc } from "firebase/firestore";
import { UserDetailContext } from "../../context/UserDetailContext";
import { MaterialIcons } from "@expo/vector-icons";

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUserDetail } = useContext(UserDetailContext);

  const CreateNewAccount = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "All fields are required.");
      return;
    }

    try {
      const resp = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = resp.user;
      console.log("User Created:", user);
      await SaveUser(user);
    } catch (error) {
      console.log("Error:", error.message);
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  const SaveUser = async (user) => {
    const data = {
      name: name.trim(),
      email: email.trim(),
      member: false,
      uid: user?.uid,
    };

    try {
      await setDoc(doc(db, "users", user.uid), data); // Fix syntax error here
      setUserDetail(data);
      console.log("User saved to Firestore");
      Alert.alert("Success", "Account created successfully!");
      router.push("/auth/signIn");
    } catch (error) {
      console.log("Error saving user:", error.message);
      Alert.alert("Error", "Failed to save user data.");
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={20} color="black" />
      </TouchableOpacity>
      <Image
        source={require("./../../assets/images/gesture.png")}
        style={styles.logo}
      />
      <Text style={styles.heading}>Create New Account</Text>

      <Text style={styles.signText}>
        Sign Up now for free and start learning and translate signs to text
      </Text>

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
        secureTextEntry
        style={styles.textInput}
        onChangeText={setPassword}
        value={password}
      />

      <TouchableOpacity onPress={CreateNewAccount} style={styles.button}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Text>Already have an account?</Text>
        <Pressable onPress={() => router.push("/auth/signIn")}>
          <Text style={styles.signIn}>Sign In here</Text>
        </Pressable>
      </View>

      <View>
        <Image
          source={require("../../assets/images/Unt.png")}
          style={styles.lowerLeaves}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#D0F3DA",
    padding: 25,
  },
  logo: {
    width: 100,
    height: 100,
    marginTop: 180,
  },
  heading: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#155658",
  },
  textInput: {
    //borderWidth: 1,
    width: "90%",
    padding: 15,
    fontSize: 14,
    marginTop: 10,
    //borderRadius: 8,
    borderBottomWidth: 1,
    textAlign: "center",
  },
  button: {
    padding: 15,
    backgroundColor: "#f5a623",
    width: "90%",
    marginTop: 20,
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  signIn: {
    color: "#155658",
    fontWeight: "bold",
    marginLeft: 5,
  },
  lowerLeaves: {
    top: 20,
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
  signText: {
    fontSize: 16,
    fontWeight: "400",
    //right: 22,
    top: -12,
    color: "black",
    textAlign: "center",
  },
});
