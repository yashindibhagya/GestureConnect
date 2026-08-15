import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    SCREEN_WIDTH,
    scale,
    verticalScale,
    moderateScale,
    fontSize,
    hp,
    contentContainer,
} from "../../utils/responsive";

/**
 * Option Sign Up screen that lets users choose between regular and gesture-based registration
 */
export default function OptionSignUp() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor="#D0F3DA" barStyle="dark-content" />

            <View style={styles.container}>
                <Image
                    source={require("../../assets/images/Unt.png")}
                    style={styles.upperLeaves}
                />

                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back" size={moderateScale(20)} color="black" />
                </TouchableOpacity>

                {/* Centred as a block, so the composition holds at any height
                    instead of being pushed down by a fixed top margin. */}
                <View style={styles.content}>
                    <Image
                        source={require("../../assets/images/gesture.png")}
                        style={styles.logo}
                    />

                    <Text style={styles.welcome}>Join GestureConnect Today! 🌟</Text>

                    <Text style={styles.description}>
                        Communication knows no barriers only bridges
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/auth/signUp")}
                    >
                        <Text style={styles.buttonText}>Typing-proficient</Text>
                        <FontAwesome name="keyboard-o" size={moderateScale(20)} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push("/auth/gestureSignUp")}
                    >
                        <Text style={styles.buttonText}>Non-typing individuals</Text>
                        <MaterialIcons name="gesture" size={moderateScale(20)} color="white" />
                    </TouchableOpacity>
                </View>

                <Image
                    source={require("../../assets/images/Unt.png")}
                    style={styles.lowerLeaves}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#D0F3DA",
    },
    container: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: scale(20),
    },
    upperLeaves: {
        position: "absolute",
        top: verticalScale(-70),
        width: SCREEN_WIDTH,
        height: hp(30),
        resizeMode: "cover",
        transform: [{ rotate: "180deg" }],
        opacity: 0.4,
    },
    lowerLeaves: {
        position: "absolute",
        bottom: verticalScale(-90),
        width: SCREEN_WIDTH,
        height: hp(30),
        resizeMode: "cover",
        opacity: 0.4,
    },
    backButton: {
        position: "absolute",
        top: verticalScale(10),
        left: scale(20),
        padding: moderateScale(10), // Adds touchable area
        backgroundColor: "#fff",
        borderRadius: moderateScale(30),
        zIndex: 1,
    },
    content: {
        ...contentContainer,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: moderateScale(200),
        height: moderateScale(200),
        resizeMode: "contain",
    },
    welcome: {
        fontSize: fontSize(26),
        fontWeight: "bold",
        marginVertical: verticalScale(8),
        color: "#155658",
        textAlign: "center",
    },
    description: {
        textAlign: "center",
        fontSize: fontSize(14),
        color: "#555",
        paddingHorizontal: scale(20),
        marginBottom: verticalScale(30),
        fontWeight: "600",
    },
    button: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5a623",
        paddingVertical: verticalScale(12),
        paddingHorizontal: scale(30),
        borderRadius: moderateScale(25),
        marginVertical: verticalScale(10),
        width: "90%",
        justifyContent: "center",
    },
    buttonText: {
        color: "white",
        fontSize: fontSize(16),
        fontWeight: "bold",
        marginRight: scale(10),
        textAlign: "center",
        flex: 1,
    },
});
