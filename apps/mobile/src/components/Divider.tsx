import React from "react";
import { View, StyleSheet } from "react-native";

interface DividerProps {
  color?: string;
  thickness?: number;
  marginVertical?: number;
  testID?: string;
}

export default function Divider({ color = "#0f3460", thickness = 1, marginVertical = 12, testID = "divider" }: DividerProps) {
  return <View style={[styles.divider, { backgroundColor: color, height: thickness, marginVertical }]} testID={testID} />;
}

const styles = StyleSheet.create({
  divider: { width: "100%" },
});
