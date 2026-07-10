import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export default function EmptyState({ icon, title, message, actionLabel, onAction, testID = "empty-state" }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container} testID={testID}>
      {icon && <Text style={styles.icon} testID="empty-state-icon">{icon}</Text>}
      <Text style={[styles.title, { color: colors.textPrimary }]} testID="empty-state-title">{title}</Text>
      {message && <Text style={[styles.message, { color: colors.textSecondary }]} testID="empty-state-message">{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onAction} testID="empty-state-action">
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 14, textAlign: "center", marginBottom: 24 },
  button: { borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
