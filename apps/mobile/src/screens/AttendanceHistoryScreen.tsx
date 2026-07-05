import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ThemedCard from "../components/ThemedCard";
import Badge from "../components/Badge";

export default function AttendanceHistoryScreen() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["attendanceHistory", page],
    queryFn: () => api.get(`/attendance/history?page=${page}&limit=20`).then((r) => r.data),
  });

  const records = data?.records || [];

  const renderItem = ({ item }: { item: any }) => (
    <ThemedCard>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>
          {new Date(item.date).toLocaleDateString("uz-UZ")}
        </Text>
        <Badge
          label={item.type === "CHECK_IN" ? "Kirish" : "Chiqish"}
          variant={item.type === "CHECK_IN" ? "success" : "warning"}
        />
      </View>
      <Text style={styles.recordTime}>
        {new Date(item.timestamp).toLocaleTimeString("uz-UZ", {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        })}
      </Text>
      <View style={styles.metaRow}>
        {item.confidence && (
          <Badge
            label={item.confidence === "HIGH" ? "Yuqori ishonchlilik" : item.confidence === "MEDIUM" ? "O'rtacha ishonchlilik" : "Rad etilgan"}
            variant={item.confidence === "HIGH" ? "success" : item.confidence === "MEDIUM" ? "warning" : "danger"}
            size="sm"
          />
        )}
        {item.distance && (
          <Text style={styles.distanceText}>Masofa: {Math.round(item.distance)} m</Text>
        )}
      </View>
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen message="Ma'lumotlar yuklanmoqda..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Ma'lumot topilmadi" />}
        onEndReached={() => {
          if (data?.page < data?.totalPages) setPage((p) => p + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  recordHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  recordDate: { color: "#fff", fontSize: 16, fontWeight: "600" },
  recordTime: { color: "#8899aa", fontSize: 14, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  distanceText: { color: "#8899aa", fontSize: 12 },
});
