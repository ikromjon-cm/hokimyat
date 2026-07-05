import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RootStackParamList } from "../navigation/types";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";
import Badge from "../components/Badge";

type RouteType = RouteProp<RootStackParamList, "MeetingDetail">;

const STATUS_MAP: Record<string, { label: string; variant: "info" | "success" | "warning" | "danger" }> = {
  SCHEDULED: { label: "Rejalashtirilgan", variant: "info" },
  ONGOING: { label: "Davom etmoqda", variant: "success" },
  COMPLETED: { label: "Yakunlangan", variant: "warning" },
  CANCELLED: { label: "Bekor qilingan", variant: "danger" },
};

export default function MeetingDetailScreen() {
  const route = useRoute<RouteType>();
  const queryClient = useQueryClient();
  const { meetingId } = route.params;

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting", meetingId],
    queryFn: () => api.get(`/meetings/${meetingId}`).then((r) => r.data),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["myMeetings"] });
    },
  });

  if (isLoading || !meeting) {
    return <LoadingSpinner fullScreen message="Uchrashuv ma'lumotlari yuklanmoqda..." />;
  }

  const statusInfo = STATUS_MAP[meeting.status] || { label: meeting.status, variant: "info" as const };

  return (
    <ScrollView style={styles.container}>
      <ThemedCard>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>{meeting.title}</Text>
          <Badge label={statusInfo.label} variant={statusInfo.variant} />
        </View>
      </ThemedCard>

      <ThemedCard title="Ma'lumotlar">
        <View style={styles.infoRow}>
          <Text style={styles.label}>Sana</Text>
          <Text style={styles.value}>{new Date(meeting.date).toLocaleDateString("uz-UZ")}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Boshlanish</Text>
          <Text style={styles.value}>
            {new Date(meeting.startTime).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {meeting.endTime && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Tugash</Text>
            <Text style={styles.value}>
              {new Date(meeting.endTime).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        )}
        {meeting.location && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Joy</Text>
            <Text style={styles.value}>{meeting.location}</Text>
          </View>
        )}
      </ThemedCard>

      {meeting.agenda && (
        <ThemedCard title="Kun tartibi">
          <Text style={styles.agendaText}>{meeting.agenda}</Text>
        </ThemedCard>
      )}

      {meeting.participants && (
        <ThemedCard title={`Ishtirokchilar (${meeting.participants.length})`}>
          {meeting.participants.map((p: any) => (
            <View key={p.id} style={styles.participantRow}>
              <Text style={styles.participantName}>
                {p.employee?.user?.fullName || "Noma'lum"}
              </Text>
              <Badge
                label={p.status === "CONFIRMED" ? "Tasdiqlangan" : p.status === "DECLINED" ? "Rad etilgan" : "Kutilmoqda"}
                variant={p.status === "CONFIRMED" ? "success" : p.status === "DECLINED" ? "danger" : "warning"}
                size="sm"
              />
            </View>
          ))}
        </ThemedCard>
      )}

      {meeting.overseers?.length > 0 && (
        <ThemedCard title="Kuzatuvchilar">
          {meeting.overseers.map((o: any) => (
            <View key={o.id} style={styles.participantRow}>
              <Text style={styles.participantName}>
                {o.employee?.user?.fullName || "Noma'lum"}
              </Text>
            </View>
          ))}
        </ThemedCard>
      )}

      {meeting.participationStatus === "PENDING" && (
        <ThemedButton
          title="Qatnashishni tasdiqlash"
          onPress={() => confirmMutation.mutate()}
          loading={confirmMutation.isPending}
          fullWidth
          style={{ margin: 16 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", flex: 1, marginRight: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#0f3460" },
  label: { color: "#8899aa", fontSize: 14 },
  value: { color: "#fff", fontSize: 14 },
  agendaText: { color: "#ccc", fontSize: 14, lineHeight: 22 },
  participantRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#0f3460" },
  participantName: { color: "#fff", fontSize: 14, flex: 1 },
});
