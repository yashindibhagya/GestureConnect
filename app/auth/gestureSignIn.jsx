import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';  // Import CameraType directly
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Common from '../../Components/Container/Common';

export default function GestureSignIn() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef(null);
  const [cameraType, setCameraType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (Camera.Constants?.Type) {
        setCameraType(Camera.Constants.Type.front);
      } else {
        setTimeout(() => {
          if (Camera.Constants?.Type) {
            setCameraType(Camera.Constants.Type.front);
          }
        }, 500);
      }
    })();
  }, []);


  const handleLogin = () => {
    // Add your login logic here
    console.log('Login attempted with:', username, password);
  };

  // Function to toggle camera type
  const toggleCameraType = () => {
    setCameraType(current => (
      current === CameraType.front ? CameraType.back : CameraType.front
    ));
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubtext}>Camera access is required for gesture authentication</Text>
      </View>
    );
  }

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Common />

      <View style={styles.cameraContainer}>
        {isReady ? (
          <Camera
            ref={cameraRef}
            style={styles.camera}
            type={cameraType}
          />
        ) : (
          <View style={[styles.camera, styles.cameraPlaceholder]}>
            <Text style={styles.cameraPlaceholderText}>Initializing camera...</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.cameraSwitch}
        onPress={toggleCameraType}
      >
        <Text style={styles.cameraSwitchText}>Switch Camera</Text>
      </TouchableOpacity>

      <Text style={styles.appTitle}>GestureConnect</Text>

      <View style={styles.inputsContainer}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={() => console.log('Forgot password')}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

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

        <View style={styles.signupContainer}>
          <Text style={styles.noAccountText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/gestureSignUp")}>
            <Text style={styles.signupText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cameraSize = Math.min(width - 40, 300);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D0F3DA',
    padding: 25
  },
  cameraContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  camera: {
    width: cameraSize,
    height: cameraSize,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cameraPlaceholder: {
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    color: 'white',
    fontSize: 16,
  },
  cameraSwitch: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  cameraSwitchText: {
    color: 'white',
    fontWeight: 'bold',
  },
  appTitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    color: '#2c3e50'
  },
  inputsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  input: {
    width: '90%',
    padding: 15,
    fontSize: 14,
    marginTop: 10,
    borderBottomWidth: 1,
    textAlign: 'center'
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#2c3e50',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#ffb74d',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  noAccountText: {
    color: '#2c3e50',
  },
  signupText: {
    color: '#ffb74d',
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: 'red',
    fontSize: 18,
  },
  errorSubtext: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#2c3e50',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#2c3e50',
    fontSize: 16,
  },
  button: {
    padding: 15,
    backgroundColor: '#f5a623',
    width: '90%',
    marginTop: 20,
    borderRadius: 30
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16
  },
});