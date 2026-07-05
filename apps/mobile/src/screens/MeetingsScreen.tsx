import React from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { formatDate, formatTime } from "../utils/dateFormat";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MeetingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "DEPARTMENT_HEAD";

  const { data: meetings, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["myMeetings"],
    queryFn: () => api.get("/meetings/my").then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: (meetingId: string) => api.post(`/meetings/${meetingId}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myMeetings"] }),
  });

  const me = Array.isArray(meetings) ? meetings : [];

  if (isLoading) return <LoadingSpinner fullScreen message="Uchrashuvlar yuklanmoqda..." />;

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "success";
      case "PENDING": return "warning";
      case "DECLINED": return "danger";
      case "PRESENT": return "success";
      case "ABSENT": return "danger";
      default: return "info";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Kutilmoqda", CONFIRMED: "Tasdiqlangan", DECLINED: "Rad etilgan",
      PRESENT: "Qatnashdi", ABSENT: "Kelmadi",
    };
    return labels[status] || status;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mening uchrashuvlarim</Text>
        {isAdmin && (
          <ThemedButton
            title="+ Yangi"
            onPress={() => navigation.navigate("CreateMeeting")}
            size="sm"
          />
        )}
      </View>

      {me.length === 0 ? (
        <EmptyState
          title="Uchrashuvlar mavjud emas"
          message="Hozircha sizga uchrashuv takliflari kelmagan"
          actionLabel="Uchrashuv yaratish"
          onAction={isAdmin ? () => navigation.navigate("CreateMeeting") : undefined}
        />
      ) : (
        me.map((meeting: any) => (
          <ThemedCard
            key={meeting.id}
            onPress={() => navigation.navigate("MeetingDetail", { meetingId: meeting.id })}
            accentColor={
              meeting.participationStatus === "PENDING" ? "#ffd60a" :
              meeting.participationStatus === "CONFIRMED" ? "#52b788" : undefined
            }
          >
            <View style={styles.meetingHeader}>
              <Text style={styles.meetingTitle} numberOfLines={1}>{meeting.title}</Text>
              <Badge
                label={getStatusLabel(meeting.participationStatus)}
                variant={getBadgeVariant(meeting.participationStatus)}
              />
            </View>

            <Text style={styles.meetingDate}>
              {formatDate(meeting.startTime)} {formatTime(meeting.startTime)}
              {meeting.endTime ? ` - ${formatTime(meeting.endTime)}` : ""}
            </Text>

            {meeting.location && (
              <Text style={styles.meetingLocation}>📍 {meeting.location}</Text>
            )}

            {meeting.participationStatus === "PENDING" && (
              <ThemedButton
                title="Qatnashishni tasdiqlash"
                onPress={() => confirmMutation.mutate(meeting.id)}
                loading={confirmMutation.isPending}
                size="sm"
                style={{ marginTop: 8 }}
              />
            )}
          </ThemedCard>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, paddingTop: 60,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  meetingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  meetingTitle: { fontSize: 16, fontWeight: "600", color: "#fff", flex: 1, marginRight: 8 },
  meetingDate: { fontSize: 13, color: "#8899aa", marginBottom: 4 },
  meetingLocation: { fontSize: 13, color: "#5dade2" },
});
