import React, { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";

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
  const containerStyle = [
    styles.card,
    accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={containerStyle} onPress={onPress} activeOpacity={0.7} disabled={disabled} testID={testID}>
        {title && <Text style={styles.title}>{title}</Text>}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={containerStyle} testID={testID}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  disabled: { opacity: 0.5 },
});
