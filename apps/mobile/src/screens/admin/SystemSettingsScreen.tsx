import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import ThemedCard from "../../components/ThemedCard";
import Badge from "../../components/Badge";

export default function SystemSettingsScreen() {
  const { data: stats } = useQuery({
    queryKey: ["systemStats"],
    queryFn: () => api.get("/admin/stats").then((r) => r.data),
  });

  const { data: auditHealth } = useQuery({
    queryKey: ["auditHealth"],
    queryFn: () => api.get("/audit/verify-chain").then((r) => r.data),
  });

  const statItems = [
    { label: "Foydalanuvchilar", value: stats?.totalUsers || 0 },
    { label: "Davomat yozuvlari", value: stats?.totalAttendance || 0 },
    { label: "Uchrashuvlar", value: stats?.totalMeetings || 0 },
    { label: "Audit yozuvlari", value: stats?.auditCount || 0 },
  ];

  return (
    <ScrollView style={styles.container}>
      <ThemedCard title="Tizim statistikasi">
        <View style={styles.statsGrid}>
          {statItems.map((item, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ThemedCard>

      <ThemedCard title="Audit zanjiri">
        <View style={styles.statusRow}>
          <Badge
            label={auditHealth?.valid ? "Sog'lom" : "Buzilgan"}
            variant={auditHealth?.valid ? "success" : "danger"}
          />
          <Text style={styles.statusTitle}>
            {auditHealth?.valid ? "Zanjir buzilmagan" : "Zanjir buzilgan!"}
          </Text>
        </View>
        {auditHealth?.brokenLinks?.length > 0 && (
          <Text style={styles.statusDesc}>{auditHealth.brokenLinks.length} ta uzilish aniqlandi</Text>
        )}
      </ThemedCard>

      <ThemedCard title="Tizim ma'lumotlari">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Platforma</Text>
          <Text style={styles.infoValue}>UYCHI MAJLIS</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versiya</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ma'lumotlar bazasi</Text>
          <Text style={styles.infoValue}>PostgreSQL 16</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Auth usuli</Text>
          <Text style={styles.infoValue}>OTP + JWT</Text>
        </View>
      </ThemedCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statItem: { backgroundColor: "#0f3460", borderRadius: 10, padding: 16, width: "48%", alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 12, color: "#8899aa", marginTop: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  statusDesc: { color: "#8899aa", fontSize: 12, marginTop: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#0f3460" },
  infoLabel: { color: "#8899aa", fontSize: 14 },
  infoValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
});
