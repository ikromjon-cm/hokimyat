import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export default function EmptyState({
  title = "Ma'lumot topilmadi",
  message = "Hozircha hech qanday ma'lumot mavjud emas",
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📭</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 8 },
  message: { fontSize: 14, color: "#8899aa", textAlign: "center" },
});
