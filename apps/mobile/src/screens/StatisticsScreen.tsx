import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ThemedCard from "../components/ThemedCard";

export default function StatisticsScreen() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["attendanceStats"],
    queryFn: () => api.get("/attendance/stats?startDate=2024-01-01&endDate=2024-12-31").then((r) => r.data),
  });

  if (isLoading) return <LoadingSpinner fullScreen message="Statistika yuklanmoqda..." />;

  const items = [
    { label: "Ish kunlari", value: stats?.totalDays || 0, color: "#fff" },
    { label: "Kelgan kunlar", value: stats?.presentDays || 0, color: "#2ecc71" },
    { label: "Kelmagan kunlar", value: stats?.absentDays || 0, color: "#e74c3c" },
    { label: "Kech qolishlar", value: stats?.lateDays || 0, color: "#f39c12" },
    { label: "Davomat foizi", value: `${stats?.attendanceRate || 0}%`, color: "#5dade2" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.grid}>
        {items.map((item, i) => (
          <ThemedCard key={i} style={styles.card}>
            <Text style={[styles.value, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </ThemedCard>
        ))}
      </View>

      {stats?.monthlyStats && (
        <ThemedCard title="Oylik statistika" style={{ marginTop: 8 }}>
          {stats.monthlyStats.map((m: any, i: number) => (
            <View key={i} style={styles.monthRow}>
              <Text style={styles.monthName}>{m.month}</Text>
              <View style={styles.monthBar}>
                <View style={[styles.monthBarFill, { width: `${m.rate || 0}%` }]} />
              </View>
              <Text style={styles.monthRate}>{m.rate || 0}%</Text>
            </View>
          ))}
        </ThemedCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", alignItems: "center", padding: 20, marginBottom: 12, marginHorizontal: 0 },
  value: { fontSize: 32, fontWeight: "bold", marginBottom: 4 },
  label: { fontSize: 13, color: "#8899aa" },
  monthRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  monthName: { width: 40, fontSize: 12, color: "#8899aa" },
  monthBar: { flex: 1, height: 8, backgroundColor: "#0f3460", borderRadius: 4, marginHorizontal: 8, overflow: "hidden" },
  monthBarFill: { height: "100%", backgroundColor: "#1a73e8", borderRadius: 4 },
  monthRate: { width: 40, fontSize: 12, color: "#fff", textAlign: "right" },
});
