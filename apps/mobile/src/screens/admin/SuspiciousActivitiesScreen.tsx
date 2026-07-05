import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ThemedCard from "../../components/ThemedCard";

export default function SuspiciousActivitiesScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["suspiciousActivities"],
    queryFn: () => api.get("/admin/suspicious-activities?limit=50").then((r) => r.data),
  });

  const activities = data?.activities || [];

  const renderItem = ({ item }: { item: any }) => (
    <ThemedCard>
      <View style={styles.cardHeader}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>Soxta lokatsiya urinishi</Text>
          <Text style={styles.cardDesc}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.metaText}>
          {new Date(item.createdAt).toLocaleDateString("uz-UZ")}{" "}
          {new Date(item.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
        </Text>
        {item.ipAddress && <Text style={styles.metaText}>IP: {item.ipAddress}</Text>}
      </View>
      {item.metadata && (
        <View style={styles.metadataBox}>
          <Text style={styles.metadataText}>
            {item.metadata.latitude?.toFixed(4)}, {item.metadata.longitude?.toFixed(4)}
          </Text>
        </View>
      )}
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shubhali faoliyatlar</Text>
        <Text style={styles.count}>{activities.length} ta</Text>
      </View>
      <FlatList
        data={activities}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Shubhali faoliyatlar topilmadi" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  count: { color: "#e74c3c", fontSize: 16, fontWeight: "600" },
  cardHeader: { flexDirection: "row", marginBottom: 8 },
  warningIcon: { fontSize: 20, marginRight: 10 },
  cardInfo: { flex: 1 },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cardDesc: { color: "#8899aa", fontSize: 12, marginTop: 2 },
  cardMeta: { flexDirection: "row", justifyContent: "space-between" },
  metaText: { color: "#556677", fontSize: 11 },
  metadataBox: { backgroundColor: "#0f3460", borderRadius: 6, padding: 8, marginTop: 8 },
  metadataText: { color: "#8899aa", fontSize: 12 },
});
