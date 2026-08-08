// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStorage } from "firebase/storage";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC194IEGnJ3hfH7xHvbUQfhILWfuFvIhqQ",
    authDomain: "gestureconnect-8aa03.firebaseapp.com",
    projectId: "gestureconnect-8aa03",
    storageBucket: "gestureconnect-8aa03.firebasestorage.app",
    messagingSenderId: "856668870109",
    appId: "1:856668870109:web:8561fec2a8cadce7cd5234",
    measurementId: "G-K6YQRG6TFV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore
export const db = getFirestore(app);

// Analytics is intentionally not initialised here. getAnalytics() comes from the
// Firebase *web* SDK and reaches for document.getElementsByTagName, which does not
// exist in React Native — it rejects asynchronously, so a try/catch around it does
// not help. Use @react-native-firebase/analytics (already a dependency) instead.

export default { auth, db, storage };