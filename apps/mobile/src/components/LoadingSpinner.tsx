import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: "small" | "large";
  color?: string;
  testID?: string;
}

export default function LoadingSpinner({
  message,
  fullScreen = false,
  size = "large",
  color = "#1a73e8",
  testID = "loading-spinner",
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen} testID={testID}>
        <ActivityIndicator size={size} color={color} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline} testID={testID}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  inline: {
    padding: 24,
    alignItems: "center",
  },
  message: {
    color: "#8899aa",
    fontSize: 14,
    marginTop: 12,
  },
});
