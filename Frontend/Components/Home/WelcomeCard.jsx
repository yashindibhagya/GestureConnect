import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import {
    fontSize,
    moderateScale,
    scale,
    verticalScale,
} from "../../utils/responsive";

/**
 * Welcome card component for the home screen that appears when no courses are in progress
 */
const WelcomeCard = () => {
    const router = useRouter();

    return (
        <ImageBackground
            source={require('../../assets/images/home_learning.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.contentContainer}>
                <Text style={styles.heading}>What would you {'\n'}like to learn {'\n'}today?</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push("/(tabs)/learning")}
                >
                    <Text style={styles.buttonText}>Get started</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        height: verticalScale(240),
        //borderRadius: 20,
        marginBottom: verticalScale(-20),
        overflow: 'hidden',
        //width: 250
        marginTop: verticalScale(-45)
    },
    contentContainer: {
        flex: 1,
        paddingVertical: verticalScale(24),
        paddingLeft: scale(24),
        paddingRight: 120, // Extra padding on right to leave space for the image
        justifyContent: 'center',
        alignItems: 'flex-start', // Align items to the left
        width: '100%',
    },
    heading: {
        fontSize: fontSize(20),
        fontWeight: 'bold',
        color: '#155658',
        marginBottom: verticalScale(5),
        textAlign: 'left', // Ensure text is left-aligned
        alignSelf: 'flex-start', // Position at the start of the container
        width: '100%', // Full width of the contentContainer
    },
    button: {
        backgroundColor: '#FFF',
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(20),
        borderRadius: moderateScale(50),
        alignSelf: 'flex-start', // Position at the start of the container
        marginTop: verticalScale(5)
    },
    buttonText: {
        fontSize: fontSize(14),
        fontWeight: 'bold',
        color: '#155658',
    }
});

export default WelcomeCard;