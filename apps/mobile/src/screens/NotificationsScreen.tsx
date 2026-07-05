import React from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";
import { timeAgo } from "../utils/dateFormat";

export default function NotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/notifications?page=1&limit=50").then((r) => r.data),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post("/notifications/mark-all-read"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "MEETING_REMINDER": return "info";
      case "MEETING_CREATED": return "success";
      case "MEETING_CANCELLED": return "danger";
      case "ATTENDANCE_REMINDER": return "warning";
      case "SUSPICIOUS_ACTIVITY": return "danger";
      case "SYSTEM_ALERT": return "warning";
      default: return "default";
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <ThemedCard
      onPress={() => { if (!item.isRead) markReadMutation.mutate(item.id); }}
      accentColor={!item.isRead ? "#1a73e8" : undefined}
      style={!item.isRead ? { backgroundColor: "#1a2744" } : undefined}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
          {item.title}
        </Text>
        <Badge label={item.type?.replace("_", " ") || "Bildirishnoma"} variant={getBadgeVariant(item.type)} size="sm" />
      </View>
      {item.body && <Text style={styles.notificationBody}>{item.body}</Text>}
      <Text style={styles.notificationTime}>{timeAgo(item.createdAt)}</Text>
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen message="Bildirishnomalar yuklanmoqda..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Bildirishnomalar</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} ta o'qilmagan</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <ThemedButton
            title="Hammasini o'qish"
            onPress={() => markAllReadMutation.mutate()}
            variant="ghost"
            size="sm"
          />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
        ListEmptyComponent={
          <EmptyState
            title="Bildirishnomalar yo'q"
            message="Sizga hech qanday bildirishnoma kelmagan"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, paddingTop: 60, paddingBottom: 8,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 13, color: "#8899aa", marginTop: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  notificationTitle: { fontSize: 15, fontWeight: "600", color: "#fff", flex: 1, marginRight: 8 },
  unreadText: { color: "#5dade2" },
  notificationBody: { fontSize: 13, color: "#8899aa", marginBottom: 8 },
  notificationTime: { fontSize: 11, color: "#556677" },
});
