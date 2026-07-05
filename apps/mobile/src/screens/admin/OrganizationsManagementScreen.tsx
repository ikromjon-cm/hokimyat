import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ThemedCard from "../../components/ThemedCard";
import Badge from "../../components/Badge";

export default function OrganizationsManagementScreen() {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/organizations").then((r) => r.data),
  });

  const orgs = Array.isArray(organizations) ? organizations : [];

  const renderItem = ({ item }: { item: any }) => (
    <ThemedCard>
      <View style={styles.cardHeader}>
        <View style={styles.orgIcon}>
          <Text style={styles.orgIconText}>{(item.name || "O")[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orgName}>{item.name}</Text>
          {item.shortName && <Text style={styles.orgShort}>{item.shortName}</Text>}
        </View>
        <Badge label={item.isActive ? "Faol" : "No faol"} variant={item.isActive ? "success" : "danger"} size="sm" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item._count?.users || 0}</Text>
          <Text style={styles.statLabel}>Xodimlar</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item._count?.departments || 0}</Text>
          <Text style={styles.statLabel}>Bo'limlar</Text>
        </View>
      </View>

      {item.address && <Text style={styles.address}>{item.address}</Text>}
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={orgs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Tashkilotlar topilmadi" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  orgIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#1a73e8",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  orgIconText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  orgName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  orgShort: { color: "#8899aa", fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "600" },
  statLabel: { color: "#8899aa", fontSize: 12 },
  address: { color: "#556677", fontSize: 12 },
});
