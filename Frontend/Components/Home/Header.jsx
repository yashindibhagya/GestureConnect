import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useUserDetail } from "../../context/UserDetailContext";
import {
    fontSize,
    verticalScale,
} from "../../utils/responsive";

/**
 * Header component for the home screen
 * Displays a personalized greeting to the user
 * 
 * @returns {React.Component} Header component
 */
export default function Header() {
    const { userDetail } = useUserDetail();

    // Get appropriate greeting based on time of day
    const getGreeting = () => {
        const currentHour = new Date().getHours();

        if (currentHour < 12) {
            return "Good Morning";
        } else if (currentHour < 18) {
            return "Good Afternoon";
        } else {
            return "Good Evening";
        }
    };

    return (
        <View style={styles.container}>
            <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.heading}>
                    {userDetail?.name || "Name"}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: verticalScale(10),
        marginBottom: verticalScale(20),
    },
    greeting: {
        fontSize: fontSize(16),
        color: "#666",
        marginBottom: verticalScale(4),
    },
    heading: {
        fontWeight: "900",
        fontSize: fontSize(28),
        color: "#000",
        marginBottom: verticalScale(8),
    },
});