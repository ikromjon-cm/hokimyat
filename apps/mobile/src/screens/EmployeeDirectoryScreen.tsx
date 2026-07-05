import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "../navigation/types";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import ThemedButton from "../components/ThemedButton";
import Badge from "../components/Badge";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EmployeeDirectoryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["employees", search],
    queryFn: () => api.get("/admin/employees", { params: search ? { search } : {} }).then((r) => r.data),
  });

  const employees = Array.isArray(data) ? data : data?.employees || [];

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const getBadgeVariant = (position: string) => {
    if (!position) return "default";
    const p = position.toLowerCase();
    if (p.includes("boshliq") || p.includes("rahbar") || p.includes("director")) return "info";
    if (p.includes("katta")) return "warning";
    return "default";
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Ism yoki telefon raqam..."
          placeholderTextColor="#667788"
          returnKeyType="search"
        />
        <ThemedButton
          title="Qidirish"
          onPress={() => refetch()}
          size="sm"
          style={{ marginLeft: 8 }}
        />
      </View>

      <FlatList
        data={employees}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.employeeCard}
            onPress={() => navigation.navigate("ChatMessages", {
              employeeId: item.id,
              fullName: item.user?.fullName || item.fullName,
            })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.user?.fullName || item.fullName)}</Text>
            </View>
            <View style={styles.employeeInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.user?.fullName || item.fullName}</Text>
                {item.position && <Badge label={item.position} variant={getBadgeVariant(item.position)} size="sm" />}
              </View>
              <Text style={styles.department}>{item.department?.name || "Bo'limsiz"}</Text>
              <Text style={styles.phone}>{item.user?.phone}</Text>
            </View>
            <Text style={styles.chatIcon}>💬</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState title="Xodimlar topilmadi" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  searchContainer: {
    flexDirection: "row", padding: 12, backgroundColor: "#16213e",
    borderBottomWidth: 1, borderBottomColor: "#0f3460", alignItems: "center",
  },
  searchInput: {
    flex: 1, backgroundColor: "#1a1a2e", borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, color: "#fff", fontSize: 15,
  },
  employeeCard: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderBottomWidth: 1, borderBottomColor: "#0f3460",
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#e94560", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  employeeInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  name: { color: "#fff", fontSize: 16, fontWeight: "500", flex: 1 },
  department: { color: "#1a73e8", fontSize: 12, marginTop: 1 },
  phone: { color: "#8899aa", fontSize: 12 },
  chatIcon: { fontSize: 20 },
});
