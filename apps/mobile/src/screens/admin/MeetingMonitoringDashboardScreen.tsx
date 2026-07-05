import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import ThemedCard from "../../components/ThemedCard";
import Badge from "../../components/Badge";

export default function MeetingMonitoringDashboardScreen() {
  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: () => api.get("/admin/dashboard").then((r) => r.data),
  });

  const { data: meetings } = useQuery({
    queryKey: ["allMeetings"],
    queryFn: () => api.get("/meetings/my").then((r) => r.data),
  });

  const meetingList = Array.isArray(meetings) ? meetings : [];
  const activeMeetings = meetingList.filter((m: any) => m.status === "SCHEDULED" || m.status === "ONGOING");

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "info";
      case "ONGOING": return "success";
      case "COMPLETED": return "default";
      case "CANCELLED": return "danger";
      default: return "info";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: "Rejalashtirilgan", ONGOING: "Davom etmoqda",
      COMPLETED: "Yakunlangan", CANCELLED: "Bekor qilingan",
    };
    return labels[status] || status;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Uchrashuvlar monitoringi</Text>
      </View>

      <View style={styles.statsRow}>
        <ThemedCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.activeMeetings || 0}</Text>
          <Text style={styles.statLabel}>Faol uchrashuvlar</Text>
        </ThemedCard>
        <ThemedCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.pendingConfirmations || 0}</Text>
          <Text style={styles.statLabel}>Tasdiqlanmagan</Text>
        </ThemedCard>
      </View>

      {activeMeetings.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hozirgi faol uchrashuvlar</Text>
          {activeMeetings.map((meeting: any) => {
            const confirmedCount = meeting.participants?.filter((p: any) => p.status === "CONFIRMED").length || 0;
            const totalCount = meeting.participants?.length || 0;

            return (
              <ThemedCard key={meeting.id}>
                <View style={styles.meetingHeader}>
                  <Text style={styles.meetingTitle}>{meeting.title}</Text>
                  <Badge label={getStatusLabel(meeting.status)} variant={getBadgeVariant(meeting.status)} size="sm" />
                </View>
                <Text style={styles.meetingInfo}>
                  {new Date(meeting.startTime).toLocaleDateString("uz-UZ")}{" "}
                  {new Date(meeting.startTime).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Ishtirokchilar: {confirmedCount}/{totalCount} tasdiqlagan</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: totalCount > 0 ? `${(confirmedCount / totalCount) * 100}%` : "0%" }]} />
                  </View>
                </View>
              </ThemedCard>
            );
          })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Barcha uchrashuvlar</Text>
        {meetingList.map((meeting: any) => (
          <ThemedCard key={meeting.id}>
            <View style={styles.meetingHeader}>
              <Text style={styles.meetingTitle}>{meeting.title}</Text>
              <Badge label={getStatusLabel(meeting.status)} variant={getBadgeVariant(meeting.status)} size="sm" />
            </View>
            <Text style={styles.meetingInfo}>
              {new Date(meeting.startTime).toLocaleDateString("uz-UZ")}
            </Text>
          </ThemedCard>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center", padding: 20, marginBottom: 0 },
  statValue: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 12, color: "#8899aa", marginTop: 4 },
  section: { margin: 16, marginTop: 0 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 12 },
  meetingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  meetingTitle: { color: "#fff", fontSize: 15, fontWeight: "500", flex: 1, marginRight: 8 },
  meetingInfo: { color: "#8899aa", fontSize: 12 },
  progressSection: { marginTop: 8 },
  progressLabel: { color: "#8899aa", fontSize: 11, marginBottom: 4 },
  progressBar: { height: 4, backgroundColor: "#0f3460", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2ecc71", borderRadius: 2 },
});
