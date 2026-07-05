import React from "react";
import { View, Text, StyleSheet } from "react-native";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  testID?: string;
}

const COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: "#1b4332", text: "#52b788" },
  warning: { bg: "#3d2e00", text: "#ffd60a" },
  danger: { bg: "#3d2020", text: "#ff6b6b" },
  info: { bg: "#0a2a4a", text: "#5dade2" },
  default: { bg: "#1e2a3a", text: "#8899aa" },
};

export default function Badge({ label, variant = "default", size = "sm", testID = "badge" }: BadgeProps) {
  const colors = COLORS[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, size === "md" && styles.badgeMd]} testID={testID}>
      <Text style={[styles.text, { color: colors.text }, size === "md" && styles.textMd]} testID="badge-label">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  badgeMd: { paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 11, fontWeight: "600" },
  textMd: { fontSize: 13 },
});
