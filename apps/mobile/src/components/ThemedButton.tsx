import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

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

const SIZES = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17 },
};

export default function ThemedButton({
  title, onPress, variant = "primary", size = "md",
  loading = false, disabled = false, fullWidth = false, style, testID,
}: ThemedButtonProps) {
  const { colors: t } = useTheme();
  const PALETTE: Record<string, { bg: string; text: string; border?: string }> = {
    primary: { bg: t.primary, text: t.onPrimary },
    secondary: { bg: t.surfaceAlt, text: t.textPrimary },
    danger: { bg: t.danger, text: "#fff" },
    ghost: { bg: "transparent", text: t.textSecondary },
    outline: { bg: "transparent", text: t.primary, border: t.primary },
  };
  const colors = PALETTE[variant];
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
