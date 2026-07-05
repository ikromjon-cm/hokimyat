import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  testID?: string;
}

export default function ScreenHeader({ title, subtitle, rightAction, testID = "screen-header" }: ScreenHeaderProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.textContainer}>
        <Text style={styles.title} testID="screen-header-title">{title}</Text>
        {subtitle && <Text style={styles.subtitle} testID="screen-header-subtitle">{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.action} testID="screen-header-action">{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  textContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "#8899aa", marginTop: 2 },
  action: { marginLeft: 12 },
});
