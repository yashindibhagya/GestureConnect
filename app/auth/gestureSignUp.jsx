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
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Common from '../../Components/Container/Common';
import { auth, db } from '../../config/firebaseConfig';

export default function GestureSignIn({ navigation }) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cameraType, setCameraType] = useState(null);
  const cameraRef = useRef(null);

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

  if (hasPermission === null) return <View style={styles.container} />;
  if (hasPermission === false)
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.errorSubtext}>Camera access is required for gesture authentication</Text>
      </View>
    );

  const CreateNewAccount = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      const resp = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = resp.user;
      console.log('User Created:', user);
      await SaveUser(user);
    } catch (error) {
      console.log('Error:', error.message);
      Alert.alert('Sign Up Failed', error.message);
    }
  };

  const SaveUser = async (user) => {
    const data = {
      name: fullName.trim(),
      email: email.trim(),
      member: false,
      uid: user.uid,
    };

    try {
      await setDoc(doc(db, 'users', user.uid), data);
      console.log('User saved to Firestore');
      Alert.alert('Success', 'Account created successfully!');
      router.push('/auth/signIn');
    } catch (error) {
      console.log('Error saving user:', error.message);
      Alert.alert('Error', 'Failed to save user data.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Common />

        <View style={styles.cameraContainer}>
          {cameraType ? (
            <Camera ref={cameraRef} style={styles.camera} type={cameraType} />
          ) : (
            <View style={[styles.camera, styles.cameraPlaceholder]}>
              <Text style={styles.cameraPlaceholderText}>Initializing camera...</Text>
            </View>
          )}
        </View>

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

          <TouchableOpacity onPress={CreateNewAccount} style={styles.button}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.haveAccountText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/gestureSignIn')}>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30
  },
  cameraContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  camera: {
    width: cameraSize,
    height: cameraSize,
    borderRadius: 8,
    overflow: 'hidden'
  },
  cameraPlaceholder: {
    backgroundColor: '#95a5a6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraPlaceholderText: {
    color: 'white',
    fontSize: 16
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
    color: '#2c3e50'
  },
  inputsContainer: {
    marginHorizontal: 20,
    marginTop: 15
  },
  input: {
    width: '90%',
    padding: 15,
    fontSize: 14,
    marginTop: 10,
    borderBottomWidth: 1,
    textAlign: 'center'
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15
  },
  haveAccountText: {
    color: '#2c3e50'
  },
  loginText: {
    color: '#f5a623',
    fontWeight: 'bold'
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#7f8c8d',
    marginHorizontal: 20
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
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: 'red'
  },
  errorSubtext: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    color: '#2c3e50'
  },
});
