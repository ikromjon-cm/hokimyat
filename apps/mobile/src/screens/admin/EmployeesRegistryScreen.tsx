import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ThemedCard from "../../components/ThemedCard";
import Badge from "../../components/Badge";

export default function EmployeesRegistryScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["adminEmployees"],
    queryFn: () => api.get("/admin/employees?limit=100").then((r) => r.data),
  });

  const employees = data?.employees || [];

  const renderItem = ({ item }: { item: any }) => (
    <ThemedCard>
      <View style={styles.employeeRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.user?.fullName || "?")[0].toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.user?.fullName || "Noma'lum"}</Text>
          <Text style={styles.detail}>{item.employeeCode} | {item.position || "-"}</Text>
          <Text style={styles.detail}>{item.user?.phone}</Text>
        </View>
        <Badge
          label={item.isActive ? "Faol" : "No faol"}
          variant={item.isActive ? "success" : "danger"}
          size="sm"
        />
      </View>
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={employees}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<EmptyState title="Xodimlar topilmadi" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  employeeRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: "#0f3460",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  detail: { color: "#8899aa", fontSize: 12, marginTop: 2 },
});
