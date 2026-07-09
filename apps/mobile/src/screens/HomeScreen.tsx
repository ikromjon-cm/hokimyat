import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenName = keyof RootStackParamList;

interface ActionItem {
  label: string;
  screen: ScreenName;
  icon: string;
}

const QUICK_ACTIONS: ActionItem[] = [
  { label: "Davomat tarixi", screen: "AttendanceHistory", icon: "🕐" },
  { label: "Statistika", screen: "Statistics", icon: "📊" },
  { label: "Xabarlar", screen: "Conversations", icon: "💬" },
  { label: "Hujjatlar", screen: "Documents", icon: "📄" },
  { label: "Xodimlar", screen: "EmployeeDirectory", icon: "👥" },
];

const ADMIN_ACTIONS: ActionItem[] = [
  { label: "Bo'lim davomati", screen: "DepartmentAttendance", icon: "🏢" },
  { label: "Hisobotlar", screen: "DepartmentReports", icon: "📈" },
  { label: "Xodimlar reestri", screen: "EmployeesRegistry", icon: "🗂️" },
  { label: "Audit jurnali", screen: "AuditLogs", icon: "🛡️" },
  { label: "Shubhali faoliyat", screen: "SuspiciousActivities", icon: "⚠️" },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "DEPARTMENT_HEAD";
  const initial = (user?.fullName || "F").trim().charAt(0).toUpperCase();

  const { data: todayAttendance, refetch, isRefetching } = useQuery({
    queryKey: ["todayAttendance"],
    queryFn: () => api.get("/attendance/today").then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ["attendanceStats"],
    queryFn: () => api.get("/attendance/stats").then((r) => r.data),
  });

  const hasCheckedIn = Array.isArray(todayAttendance) && todayAttendance.some((a: any) => a.type === "CHECK_IN");
  const hasCheckedOut = Array.isArray(todayAttendance) && todayAttendance.some((a: any) => a.type === "CHECK_OUT");

  const renderGrid = (items: ActionItem[]) => (
    <View style={styles.grid}>
      {items.map((action) => (
        <TouchableOpacity
          key={action.screen}
          style={styles.gridCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(action.screen as any)}
        >
          <Text style={styles.gridIcon}>{action.icon}</Text>
          <Text style={styles.gridLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4d8bf0" />}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Assalomu alaykum 👋</Text>
          <Text style={styles.userName} numberOfLines={1}>{user?.fullName || "Foydalanuvchi"}</Text>
          {user?.organization?.name ? (
            <Text style={styles.orgName} numberOfLines={1}>{user.organization.name}</Text>
          ) : null}
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      {!hasCheckedIn ? (
        <ThemedButton title="Keldim" onPress={() => navigation.navigate("CheckIn")} variant="primary" size="lg" fullWidth style={styles.checkIn} />
      ) : !hasCheckedOut ? (
        <ThemedButton title="Ketdim" onPress={() => navigation.navigate("CheckOut")} variant="secondary" size="lg" fullWidth style={styles.checkOut} />
      ) : (
        <ThemedCard style={styles.completedCard}>
          <Text style={styles.completedIcon}>✓</Text>
          <Text style={styles.completedText}>Bugungi davomat to'liq qayd etildi</Text>
        </ThemedCard>
      )}

      <View style={styles.statsGrid}>
        <ThemedCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.presentDays ?? 0}</Text>
          <Text style={styles.statLabel}>Kelgan kunlar</Text>
        </ThemedCard>
        <ThemedCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#ffd166" }]}>{stats?.lateDays ?? 0}</Text>
          <Text style={styles.statLabel}>Kech qolish</Text>
        </ThemedCard>
        <ThemedCard style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#52b788" }]}>{stats?.attendanceRate ?? 0}%</Text>
          <Text style={styles.statLabel}>Davomat foizi</Text>
        </ThemedCard>
      </View>

      <Text style={styles.sectionLabel}>Tezkor havolalar</Text>
      {renderGrid(QUICK_ACTIONS)}

      {isAdmin && (
        <>
          <Text style={styles.sectionLabel}>Administrator paneli</Text>
          {renderGrid(ADMIN_ACTIONS)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  greeting: { fontSize: 14, color: "#8899aa" },
  userName: { fontSize: 26, fontWeight: "bold", color: "#fff", marginTop: 2 },
  orgName: { fontSize: 13, color: "#6b7a99", marginTop: 3 },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: "#1a73e8",
    alignItems: "center", justifyContent: "center", marginLeft: 12,
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  checkIn: { marginHorizontal: 20, marginBottom: 20, backgroundColor: "#2ecc71" },
  checkOut: { marginHorizontal: 20, marginBottom: 20, backgroundColor: "#f39c12" },
  completedCard: { marginHorizontal: 20, marginBottom: 20, alignItems: "center", padding: 22 },
  completedIcon: { fontSize: 34, color: "#2ecc71", marginBottom: 6 },
  completedText: { color: "#2ecc71", fontSize: 15, fontWeight: "500" },
  statsGrid: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 26, gap: 8 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 18, marginBottom: 0 },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 11.5, color: "#8899aa", marginTop: 5, textAlign: "center" },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#6b7a99", letterSpacing: 1,
    textTransform: "uppercase", marginLeft: 20, marginBottom: 12, marginTop: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, gap: 12, marginBottom: 14 },
  gridCard: {
    width: "47%", flexGrow: 1, backgroundColor: "#16213e", borderRadius: 16,
    paddingVertical: 22, paddingHorizontal: 12, alignItems: "center",
    borderWidth: 1, borderColor: "#0f3460",
  },
  gridIcon: { fontSize: 28, marginBottom: 10 },
  gridLabel: { color: "#e6ebf5", fontSize: 13.5, fontWeight: "600", textAlign: "center" },
});
