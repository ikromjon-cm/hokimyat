import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

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
  color,
  testID = "loading-spinner",
}: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const spinnerColor = color || colors.primary;
  const message_ = message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>;

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: colors.bg }]} testID={testID}>
        <ActivityIndicator size={size} color={spinnerColor} />
        {message_}
      </View>
    );
  }

  return (
    <View style={styles.inline} testID={testID}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message_}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
  inline: { padding: 24, alignItems: "center" },
  message: { fontSize: 14, marginTop: 12 },
});
