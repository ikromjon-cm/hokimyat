import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
  testID?: string;
}

export default function ErrorMessage({ message, onRetry, fullScreen = false, testID = "error-message" }: ErrorMessageProps) {
  const content = (
    <>
      <Text style={styles.icon} testID="error-message-icon">!</Text>
      <Text style={styles.message} testID="error-message-text">{message || "Xatolik yuz berdi"}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} testID="error-message-retry">
          <Text style={styles.retryText}>Qayta urinish</Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen} testID={testID}>{content}</View>;
  }

  return <View style={styles.container} testID={testID}>{content}</View>;
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", padding: 24 },
  container: { backgroundColor: "#2d1b1b", borderRadius: 12, padding: 16, margin: 16, alignItems: "center", borderLeftWidth: 4, borderLeftColor: "#e74c3c" },
  icon: { fontSize: 24, fontWeight: "bold", color: "#e74c3c", marginBottom: 8, width: 40, height: 40, textAlign: "center", lineHeight: 40, borderRadius: 20, backgroundColor: "#3d2020", overflow: "hidden" },
  message: { fontSize: 14, color: "#ff6b6b", textAlign: "center", marginBottom: 12 },
  retryButton: { backgroundColor: "#e74c3c", borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
