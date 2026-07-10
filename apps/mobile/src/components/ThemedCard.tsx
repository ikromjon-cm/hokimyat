import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

interface ThemedCardProps {
  children: ReactNode;
  title?: string;
  onPress?: () => void;
  style?: ViewStyle;
  accentColor?: string;
  testID?: string;
  disabled?: boolean;
}

export default function ThemedCard({ children, title, onPress, style, accentColor, testID = "themed-card", disabled }: ThemedCardProps) {
  const { colors } = useTheme();
  const containerStyle = [
    styles.card,
    { backgroundColor: colors.surface },
    accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7} disabled={disabled} testID={testID}>
        {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {title && <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  disabled: { opacity: 0.5 },
});
