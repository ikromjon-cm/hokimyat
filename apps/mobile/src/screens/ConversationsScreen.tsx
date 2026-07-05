import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "../navigation/types";
import { api } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ConversationsScreen() {
  const navigation = useNavigation<NavigationProp>();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get("/messages/conversations").then((r) => r.data),
  });

  const conversations = Array.isArray(data) ? data : [];

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item: any) => item.employeeId}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => navigation.navigate("ChatMessages", { employeeId: item.employeeId, fullName: item.fullName })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.fullName)}</Text>
            </View>
            <View style={styles.conversationInfo}>
              <View style={styles.topRow}>
                <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
                {item.unreadCount > 0 && (
                  <Badge label={String(item.unreadCount)} variant="danger" size="sm" />
                )}
              </View>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage || "Hali xabar yo'q"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            title="Suhbatlar yo'q"
            message="Xodimlar bilan suhbatni boshlang"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  conversationItem: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderBottomWidth: 1, borderBottomColor: "#0f3460",
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#e94560", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  conversationInfo: { flex: 1 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  name: { color: "#fff", fontSize: 16, fontWeight: "500", flex: 1, marginRight: 8 },
  lastMessage: { color: "#8899aa", fontSize: 13 },
});
