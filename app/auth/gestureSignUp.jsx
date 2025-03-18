import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Camera } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';

export default function GestureSignIn({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cameraType, setCameraType] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      // Request camera permissions
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      // Safely set camera type after import is complete
      if (Camera.Constants && Camera.Constants.Type) {
        setCameraType(Camera.Constants.Type.front);
      } else {
        // Fallback approach if constants are not available immediately
        setTimeout(() => {
          if (Camera.Constants && Camera.Constants.Type) {
            setCameraType(Camera.Constants.Type.front);
          }
        }, 500);
      }
    })();
  }, []);

  const handleSignUp = () => {
    // Add your sign up logic here
    console.log('Sign up attempted with:', { fullName, email, username, password });
    // Validation would go here
  };

  const navigateToLogin = () => {
    // Navigate back to login screen
    console.log('Navigate to login');
    // If using React Navigation:
    // navigation.navigate('Login');
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubtext}>Camera access is required for gesture authentication</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>GestureConnect</Text>
        </View>

        <View style={styles.cameraContainer}>
          {cameraType ? (
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

        <Text style={styles.appTitle}>GestureConnect</Text>
        <Text style={styles.subtitle}>Create Your Account</Text>

        <View style={styles.inputsContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
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
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.haveAccountText}>Already have an account? </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.loginText}>Log In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By signing up, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const cameraSize = Math.min(width - 40, 300);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2e9',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  headerContainer: {
    padding: 10,
  },
  headerText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  cameraContainer: {
    alignItems: 'center',
    marginTop: 10,
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
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    color: '#2c3e50',
  },
  inputsContainer: {
    marginHorizontal: 20,
    marginTop: 15,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  signupButton: {
    backgroundColor: '#ffb74d',
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 12,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  haveAccountText: {
    color: '#2c3e50',
  },
  loginText: {
    color: '#ffb74d',
    fontWeight: 'bold',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7f8c8d',
    marginHorizontal: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: 'red',
  },
  errorSubtext: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#2c3e50',
  },
});
