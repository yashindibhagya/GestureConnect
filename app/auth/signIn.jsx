import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Pressable,
  ToastAndroid,
  ActivityIndicator,
} from "react-native";
import React, { useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { UserDetailContext } from "../../context/UserDetailContext";
import { MaterialIcons } from "@expo/vector-icons";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUserDetail } = useContext(UserDetailContext);
  const [loading, setLoading] = useState(false);

  // Check if the user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User already signed in:", user);
        await getUserDetail(user.uid);
        router.replace("/(tabs)/home");
      }
    });

    return unsubscribe; // Clean up listener on component unmount
  }, []);

  //forgot password
  const forgotPassword = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("Password reset email sent");
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  const onSignInClick = async () => {
    if (!email || !password) {
      ToastAndroid.show("Email and password are required.", ToastAndroid.SHORT);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      console.log("User signed in:", user);
      router.replace("/(tabs)/home"); // Navigate immediately after sign-in

      // Fetch user details in the background
      getUserDetail(user.uid);
    } catch (e) {
      console.log("Sign-in error:", e.message);
      setLoading(false);
      ToastAndroid.show("Incorrect email or password", ToastAndroid.SHORT);
    }
  };

  // Fetch user details
  const getUserDetail = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const result = await getDoc(userRef);

      if (result.exists()) {
        setUserDetail(result.data());
        console.log("User details:", result.data());
      } else {
        console.log("No user data found in Firestore.");
      }
    } catch (error) {
      console.log("Error fetching user details:", error.message);
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

      <Pressable
        onPress={() => {
          forgotPassword();
        }}
      >
        <Text style={styles.forgot}>Forgot Password?</Text>
      </Pressable>

      <TouchableOpacity
        onPress={onSignInClick}
        disabled={loading}
        style={styles.button}
      >
        {!loading ? (
          <Text style={styles.buttonText}>Sign In</Text>
        ) : (
          <ActivityIndicator size="small" color="#fff" />
        )}
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <Text>Don't have an account?</Text>
        <Pressable onPress={() => router.push("/auth/signUp")}>
          <Text style={styles.signIn}>Create New Account</Text>
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
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
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
    top: 60,
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
  forgot: {
    left: 106,
    marginTop: 5,
    fontWeight: "600",
    color: "#155658",
  },
});
