import React from "react";
import {
  View, Text, StyleSheet, FlatList, Alert, RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";

export default function SessionManagementScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.get("/sessions").then((r) => r.data),
  });

  const sessions = Array.isArray(data) ? data : [];

  const terminateMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const terminateAllMutation = useMutation({
    mutationFn: () => api.delete("/sessions/all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const handleTerminate = (sessionId: string) => {
    Alert.alert("Sessiyani tugatish", "Ushbu sessiyani tugatmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "Tugatish", style: "destructive",
        onPress: () => terminateMutation.mutate(sessionId),
      },
    ]);
  };

  const handleTerminateAll = () => {
    Alert.alert(
      "Barcha sessiyalarni tugatish",
      "Barcha faol sessiyalar tugatiladi. Qayta kirishingiz kerak bo'ladi.",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Barchasini tugatish", style: "destructive",
          onPress: () => terminateAllMutation.mutate(),
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("uz-UZ", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getDeviceIcon = (info: string | null) => {
    if (!info) return "📱";
    const lower = info.toLowerCase();
    if (lower.includes("iphone") || lower.includes("ios")) return "📱";
    if (lower.includes("android")) return "📱";
    if (lower.includes("chrome")) return "🌐";
    if (lower.includes("firefox")) return "🦊";
    if (lower.includes("safari")) return "🧭";
    if (lower.includes("postman") || lower.includes("curl")) return "🔧";
    return "💻";
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      {sessions.length > 1 && (
        <ThemedButton
          title="Barcha sessiyalarni tugatish"
          onPress={handleTerminateAll}
          variant="danger"
          fullWidth
          style={{ margin: 16 }}
          loading={terminateAllMutation.isPending}
        />
      )}

      <FlatList
        data={sessions}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }: { item: any }) => (
          <ThemedCard>
            <View style={styles.sessionHeader}>
              <Text style={styles.deviceIcon}>{getDeviceIcon(item.deviceInfo)}</Text>
              <View style={styles.sessionInfo}>
                <Text style={styles.deviceName}>
                  {item.deviceInfo || "Noma'lum qurilma"}
                </Text>
                {item.ipAddress && <Text style={styles.ipText}>{item.ipAddress}</Text>}
                {item.location && <Text style={styles.locationText}>{item.location}</Text>}
              </View>
              <ThemedButton
                title={terminateMutation.isPending ? "..." : "Tugatish"}
                onPress={() => handleTerminate(item.id)}
                variant="danger"
                size="sm"
                disabled={terminateMutation.isPending}
              />
            </View>
            <View style={styles.sessionFooter}>
              <Text style={styles.dateText}>Yaratilgan: {formatDate(item.createdAt)}</Text>
              <Text style={styles.dateText}>Oxirgi faollik: {formatDate(item.lastActivity)}</Text>
            </View>
          </ThemedCard>
        )}
        ListEmptyComponent={
          <EmptyState title="Faol sessiyalar yo'q" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  sessionHeader: { flexDirection: "row", alignItems: "center" },
  deviceIcon: { fontSize: 28, marginRight: 12 },
  sessionInfo: { flex: 1 },
  deviceName: { color: "#fff", fontSize: 15, fontWeight: "500" },
  ipText: { color: "#8899aa", fontSize: 13, marginTop: 2 },
  locationText: { color: "#1a73e8", fontSize: 12, marginTop: 2 },
  sessionFooter: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#0f3460" },
  dateText: { color: "#667788", fontSize: 12, marginBottom: 2 },
});
