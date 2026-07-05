import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export default function EmptyState({ icon, title, message, actionLabel, onAction, testID = "empty-state" }: EmptyStateProps) {
  return (
    <View style={styles.container} testID={testID}>
      {icon && <Text style={styles.icon} testID="empty-state-icon">{icon}</Text>}
      <Text style={styles.title} testID="empty-state-title">{title}</Text>
      {message && <Text style={styles.message} testID="empty-state-message">{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.button} onPress={onAction} testID="empty-state-action">
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 14, color: "#8899aa", textAlign: "center", marginBottom: 24 },
  button: { backgroundColor: "#1a73e8", borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
