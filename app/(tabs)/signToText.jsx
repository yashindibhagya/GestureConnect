{/*
import { View, Text } from "react-native";
import React from "react";

export default function SignToText() {
  return (
    <View>
      <Text>SignToText</Text>
    </View>
  );
}
*/}

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import firebase from 'firebase/app';
import { auth, db } from "../../config/firebaseConfig";
import 'firebase/firestore';

const MainDashboard = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    lessonCompleted: 0,
    totalLessons: 20,
    currentStreak: 0,
  });

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // Get user profile data
        fetchUserData(user.uid);
      } else {
        // User is signed out
        navigation.replace('Welcome');
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserData = async (userId) => {
    try {
      const userDoc = await firebase.firestore().collection('users').doc(userId).get();

      if (userDoc.exists) {
        setUser({
          uid: userId,
          displayName: userDoc.data().name || 'User',
          isDeaf: userDoc.data().isDeaf || false,
          email: userDoc.data().email,
          profileImage: userDoc.data().profileImage,
          ...userDoc.data()
        });
      }

      // Fetch learning progress
      const progressDoc = await firebase.firestore().collection('learningProgress').doc(userId).get();

      if (progressDoc.exists) {
        setProgress(progressDoc.data());
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebase.auth().signOut();
      navigation.replace('Welcome');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfoContainer}>
          <View style={styles.profileImageContainer}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={styles.profilePlaceholderText}>
                  {user?.displayName?.charAt(0) || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('UserProfile')}
        >
          <Ionicons name="settings-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Learning Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>{progress.lessonCompleted}</Text>
                <Text style={styles.progressLabel}>Lessons Completed</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressNumber}>{progress.currentStreak}</Text>
                <Text style={styles.progressLabel}>Day Streak</Text>
              </View>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(progress.lessonCompleted / progress.totalLessons) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressBarText}>
                {Math.round((progress.lessonCompleted / progress.totalLessons) * 100)}% Complete
              </Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.featuresGrid}>
          {/* Sign Language Recognition */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('SignLanguageRecognition')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
              <Ionicons name="camera-outline" size={30} color="#4CAF50" />
            </View>
            <Text style={styles.featureTitle}>Sign Language Recognition</Text>
            <Text style={styles.featureDescription}>
              Translate hand gestures to text in real-time
            </Text>
          </TouchableOpacity>

          {/* Text to Sign */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('TextToSign')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(33, 150, 243, 0.2)' }]}>
              <Ionicons name="text-outline" size={30} color="#2196F3" />
            </View>
            <Text style={styles.featureTitle}>Text to Sign</Text>
            <Text style={styles.featureDescription}>
              Convert text to sign language using avatar
            </Text>
          </TouchableOpacity>

          {/* Learning Platform */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('LearningPlatform')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(255, 152, 0, 0.2)' }]}>
              <Ionicons name="school-outline" size={30} color="#FF9800" />
            </View>
            <Text style={styles.featureTitle}>Learning Platform</Text>
            <Text style={styles.featureDescription}>
              Interactive lessons to learn sign language
            </Text>
          </TouchableOpacity>

          {/* Saved Conversations */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => navigation.navigate('SavedConversations')}
          >
            <View style={[styles.featureIconContainer, { backgroundColor: 'rgba(156, 39, 176, 0.2)' }]}>
              <Ionicons name="chatbubbles-outline" size={30} color="#9C27B0" />
            </View>
            <Text style={styles.featureTitle}>Saved Conversations</Text>
            <Text style={styles.featureDescription}>
              Access your previous conversations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.recentActivitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <View style={styles.activityCard}>
            <View style={styles.activityIconContainer}>
              <Ionicons name="school-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Completed Lesson</Text>
              <Text style={styles.activityDescription}>Basic Hand Gestures</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
          </View>

          <View style={styles.activityCard}>
            <View style={styles.activityIconContainer}>
              <Ionicons name="chatbubbles-outline" size={24} color="#2196F3" />
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Conversation</Text>
              <Text style={styles.activityDescription}>15 signs translated</Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
          </View>
        </View>

        {/* Sign out button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userTextContainer: {
    justifyContent: 'center',
  },
  welcomeText: {
    color: '#AAA',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  progressSection: {
    marginBottom: 15,
  },
  progressCard: {
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressLabel: {
    color: '#AAA',
    fontSize: 14,
  },
  progressBarContainer: {
    marginTop: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  progressBarText: {
    color: '#AAA',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  featureDescription: {
    color: '#AAA',
    fontSize: 12,
  },
  recentActivitySection: {
    marginTop: 10,
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityDescription: {
    color: '#AAA',
    fontSize: 14,
    marginVertical: 3,
  },
  activityTime: {
    color: '#777',
    fontSize: 12,
  },
  signOutButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  signOutButtonText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MainDashboard;