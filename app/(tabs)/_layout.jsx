import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { VideoProvider } from '../../context/VideoContext';

export default function _layout() {
  return (
    <VideoProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false, // Hide text labels
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#074D4E", // Active icon color
          tabBarInactiveTintColor: "#074D4E", // Inactive icon color
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                {focused && <View style={styles.activeLine} />}
                <FontAwesome name="home" size={size} color={color} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="textToSign"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                {focused && <View style={styles.activeLine} />}
                <Feather name="type" size={size} color={color} />
              </View>
            ),
          }}
        />

        {/* Custom Floating Button in the Middle */}
        <Tabs.Screen
          name="signToText"
          options={{
            tabBarButton: (props) => (
              <TouchableOpacity
                style={[
                  styles.middleButton,
                  props.accessibilityState?.selected && styles.middleButtonActive,
                ]}
                onPress={props.onPress}
              >
                <MaterialCommunityIcons
                  name="hand-heart"
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
            ),
          }}
        />

        <Tabs.Screen
          name="learning"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                {focused && <View style={styles.activeLine} />}
                <FontAwesome6 name="book-atlas" size={size} color={color} />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, size, focused }) => (
              <View style={[styles.iconContainer, focused && styles.activeTab]}>
                {focused && <View style={styles.activeLine} />}
                <FontAwesome name="user-circle-o" size={size} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </VideoProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    //bottom: 20,
    left: 20,
    right: 20,
    elevation: 5,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 60,
    //shadowColor: "#000",
    //shadowOffset: { width: 0, height: 10 },
    //shadowOpacity: 0.1,
    //shadowRadius: 5,
    boxShadow: "0px 10px 5px rgb(0, 0, 0)", // CSS equivalent
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    top: 9,
  },
  activeTab: {
    position: "relative",
  },
  activeLine: {
    position: "absolute",
    top: -16, // Adjust height of the line
    width: 25,
    height: 4,
    backgroundColor: "#074D4E", // Match the active color
    borderRadius: 2,
  },
  middleButton: {
    width: 45,
    height: 45,
    borderRadius: 35,
    backgroundColor: "#074D4E", // Dark green
    justifyContent: "center",
    alignItems: "center",
    top: -20, // Floating effect
    shadowColor: "#000",
    //shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    alignSelf: "center",
  },
  middleButtonActive: {
    backgroundColor: "#056363", // Slightly different shade when active
  },
});