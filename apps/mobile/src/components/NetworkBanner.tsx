import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

export default function NetworkBanner() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Internet aloqasi yo'q</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#e74c3c",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
