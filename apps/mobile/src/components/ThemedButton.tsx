import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const COLORS: Record<string, { bg: string; text: string; border?: string }> = {
  primary: { bg: "#1a73e8", text: "#fff" },
  secondary: { bg: "#0f3460", text: "#fff" },
  danger: { bg: "#e74c3c", text: "#fff" },
  ghost: { bg: "transparent", text: "#8899aa" },
  outline: { bg: "transparent", text: "#1a73e8", border: "#1a73e8" },
};

const SIZES = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17 },
};

export default function ThemedButton({
  title, onPress, variant = "primary", size = "md",
  loading = false, disabled = false, fullWidth = false, style, testID,
}: ThemedButtonProps) {
  const colors = COLORS[variant];
  const sizes = SIZES[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.bg,
          paddingVertical: sizes.paddingVertical,
          paddingHorizontal: sizes.paddingHorizontal,
          borderWidth: colors.border ? 1 : 0,
          borderColor: colors.border || "transparent",
        },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID || "themed-button"}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <Text style={[styles.text, { color: colors.text, fontSize: sizes.fontSize }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.5 },
  fullWidth: { width: "100%" },
  text: { fontWeight: "600" },
});
