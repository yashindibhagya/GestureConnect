import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
    TAB_BAR_HEIGHT,
    TAB_BAR_MARGIN,
    TAB_BAR_MIN_BOTTOM,
    TAB_ICON_SIZE,
    TAB_CENTER_BUTTON_SIZE,
    TAB_CENTER_ICON_SIZE,
} from "../../constants/navigation";

/**
 * Tab layout component that sets up the bottom tab navigation
 *
 * Every measurement here is a fixed point value from constants/navigation.js
 * rather than a screen-scaled one — see the note there. The bar's width and
 * its distance from the bottom edge are the only device-dependent parts.
 */
export default function TabsLayout() {
    const insets = useSafeAreaInsets();

    // The bar floats above the screen, so it has to be lifted clear of the iOS home
    // indicator and the Android gesture bar itself — the navigator cannot do it for
    // an absolutely positioned bar. A small floor keeps it off the very edge on
    // devices with no inset at all.
    const bottomOffset = Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false, // Hide text labels
                tabBarStyle: [styles.tabBar, { bottom: bottomOffset }],
                tabBarItemStyle: styles.tabBarItem,
                tabBarActiveTintColor: "#074D4E", // Active icon color
                tabBarInactiveTintColor: "#074D4E", // Inactive icon color
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeTab]}>
                            {focused && <View style={styles.activeLine} />}
                            <FontAwesome name="home" size={TAB_ICON_SIZE} color={color} />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="textToSign"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeTab]}>
                            {focused && <View style={styles.activeLine} />}
                            <Feather name="type" size={TAB_ICON_SIZE} color={color} />
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
                            accessibilityRole="button"
                            accessibilityState={props.accessibilityState}
                            accessibilityLabel="Sign to text"
                            style={[
                                styles.middleButton,
                                props.accessibilityState?.selected && styles.middleButtonActive,
                            ]}
                            onPress={props.onPress}
                        >
                            <MaterialCommunityIcons
                                name="hand-heart"
                                size={TAB_CENTER_ICON_SIZE}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    ),
                }}
            />

            <Tabs.Screen
                name="learning"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeTab]}>
                            {focused && <View style={styles.activeLine} />}
                            <FontAwesome6 name="book-atlas" size={TAB_ICON_SIZE} color={color} />
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconContainer, focused && styles.activeTab]}>
                            {focused && <View style={styles.activeLine} />}
                            <FontAwesome name="user-circle-o" size={TAB_ICON_SIZE} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: "absolute",
        left: TAB_BAR_MARGIN,
        right: TAB_BAR_MARGIN,
        height: TAB_BAR_HEIGHT,
        elevation: 5,
        backgroundColor: "#fff",
        // Rounded on all four corners because the bar floats clear of the bottom
        // edge rather than sitting flush against it.
        borderRadius: 20,
        borderTopWidth: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        paddingBottom: 0,
    },
    tabBarItem: {
        // Without this the icons sit high on iOS, where the navigator reserves room
        // for labels that this bar does not show.
        height: TAB_BAR_HEIGHT,
        paddingTop: 0,
        paddingBottom: 0,
    },
    iconContainer: {
        // Fills the tab item and centres the icon, instead of nudging it down by a
        // fixed number of pixels that only lined up on one platform.
        height: TAB_BAR_HEIGHT,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    activeTab: {
        position: "relative",
    },
    activeLine: {
        position: "absolute",
        top: 6,
        width: 25,
        height: 4,
        backgroundColor: "#074D4E", // Match the active color
        borderRadius: 2,
    },
    middleButton: {
        width: TAB_CENTER_BUTTON_SIZE,
        height: TAB_CENTER_BUTTON_SIZE,
        borderRadius: TAB_CENTER_BUTTON_SIZE / 2,
        backgroundColor: "#074D4E", // Dark green
        justifyContent: "center",
        alignItems: "center",
        // Centres the raised button on the bar's top edge, derived from the two
        // heights rather than a magic offset.
        marginTop: (TAB_BAR_HEIGHT - TAB_CENTER_BUTTON_SIZE) / 2 - 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        alignSelf: "center",
    },
    middleButtonActive: {
        backgroundColor: "#056363", // Slightly different shade when active
    },
});
