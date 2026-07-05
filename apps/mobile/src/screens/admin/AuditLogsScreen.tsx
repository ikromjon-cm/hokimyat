import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ThemedCard from "../../components/ThemedCard";
import Badge from "../../components/Badge";

const actionLabels: Record<string, string> = {
  LOGIN: "Tizimga kirish", LOGOUT: "Tizimdan chiqish",
  ATTENDANCE_CHECK_IN: "Kirish qaydi", ATTENDANCE_CHECK_OUT: "Chiqish qaydi",
  MOCK_LOCATION_ATTEMPT: "Soxta lokatsiya",
  MEETING_CREATED: "Uchrashuv yaratildi", MEETING_CANCELLED: "Uchrashuv bekor qilindi",
  MEETING_CONFIRMED: "Uchrashuv tasdiqlandi",
  EMPLOYEE_CREATED: "Xodim yaratildi", EMPLOYEE_UPDATED: "Xodim yangilandi",
  EMPLOYEE_DELETED: "Xodim o'chirildi",
  ORGANIZATION_CREATED: "Tashkilot yaratildi", ORGANIZATION_UPDATED: "Tashkilot yangilandi",
  SETTINGS_UPDATED: "Sozlamalar yangilandi",
  OTP_REQUESTED: "OTP so'raldi", OTP_VERIFIED: "OTP tasdiqlandi", OTP_FAILED: "OTP xatolik",
};

const getBadgeVariant = (action: string) => {
  if (action === "MOCK_LOCATION_ATTEMPT" || action === "OTP_FAILED") return "danger";
  if (action?.startsWith("MEETING")) return "warning";
  if (action?.startsWith("EMPLOYEE") || action?.startsWith("ORGANIZATION")) return "info";
  if (action?.startsWith("LOGIN") || action?.startsWith("LOGOUT")) return "success";
  return "default";
};

export default function AuditLogsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: () => api.get("/audit?limit=50").then((r) => r.data),
  });

  const logs = data?.logs || [];

  const renderItem = ({ item }: { item: any }) => (
    <ThemedCard>
      <View style={styles.cardHeader}>
        <Badge label={actionLabels[item.action] || item.action} variant={getBadgeVariant(item.action)} size="sm" />
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.meta}>IP: {item.ipAddress || "Noma'lum"}</Text>
        <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString("uz-UZ")}</Text>
      </View>
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Audit loglari topilmadi" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  time: { color: "#556677", fontSize: 11 },
  description: { color: "#ccc", fontSize: 14, marginBottom: 8 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between" },
  meta: { color: "#556677", fontSize: 11 },
});
