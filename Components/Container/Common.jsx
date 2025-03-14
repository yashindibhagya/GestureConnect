import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function Common() {
  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        <Image
          source={require("../../assets/images/gesture.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>GestureConnect</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    marginBottom: 10,
    width: "100%",
    marginTop: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#155658",
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
  logo: {
    height: 30,
    width: 30,
  },
});
