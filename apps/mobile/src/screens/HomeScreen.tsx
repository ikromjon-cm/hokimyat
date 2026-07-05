import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenName = keyof RootStackParamList;

interface QuickAction {
  label: string;
  screen: ScreenName;
  adminOnly: boolean;
}

interface AdminAction {
  label: string;
  screen: ScreenName;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Davomat tarixi", screen: "AttendanceHistory", adminOnly: false },
  { label: "Statistika", screen: "Statistics", adminOnly: false },
  { label: "Xabarlar", screen: "Conversations", adminOnly: false },
  { label: "Hujjatlar", screen: "Documents", adminOnly: false },
  { label: "Xodimlar", screen: "EmployeeDirectory", adminOnly: false },
];

const ADMIN_ACTIONS: AdminAction[] = [
  { label: "Bo'lim davomati", screen: "DepartmentAttendance" },
  { label: "Hisobotlar", screen: "DepartmentReports" },
  { label: "Xodimlar reestri", screen: "EmployeesRegistry" },
  { label: "Audit jurnali", screen: "AuditLogs" },
  { label: "Shubhali faoliyat", screen: "SuspiciousActivities" },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "DEPARTMENT_HEAD";

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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Assalomu alaykum</Text>
        <Text style={styles.userName}>{user?.fullName || "Foydalanuvchi"}</Text>
      </View>

      {!hasCheckedIn ? (
        <ThemedButton
          title="Keldim"
          onPress={() => navigation.navigate("CheckIn")}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.checkIn}
        />
      ) : !hasCheckedOut ? (
        <ThemedButton
          title="Ketdim"
          onPress={() => navigation.navigate("CheckOut")}
          variant="secondary"
          size="lg"
          fullWidth
          style={styles.checkOut}
        />
      ) : (
        <ThemedCard style={styles.completedCard}>
          <Text style={styles.completedText}>Bugungi davomat to'liq qayd etildi</Text>
        </ThemedCard>
      )}

      <View style={styles.statsGrid}>
        <ThemedCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.presentDays || 0}</Text>
          <Text style={styles.statLabel}>Kelgan kunlar</Text>
        </ThemedCard>
        <ThemedCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.lateDays || 0}</Text>
          <Text style={styles.statLabel}>Kech qolish</Text>
        </ThemedCard>
        <ThemedCard style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.attendanceRate || 0}%</Text>
          <Text style={styles.statLabel}>Davomat foizi</Text>
        </ThemedCard>
      </View>

      <View style={styles.section}>
        {QUICK_ACTIONS.map((action) => (
          <ThemedButton
            key={action.screen}
            title={action.label}
            onPress={() => navigation.navigate(action.screen as any)}
            variant="secondary"
            fullWidth
            style={{ marginBottom: 8 }}
          />
        ))}
        {isAdmin && (
          <>
            <Text style={styles.adminTitle}>Administrator paneli</Text>
            {ADMIN_ACTIONS.map((action) => (
              <ThemedButton
                key={action.screen}
                title={action.label}
                onPress={() => navigation.navigate(action.screen as any)}
                variant="outline"
                fullWidth
                style={{ marginBottom: 8 }}
              />
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 16, color: "#8899aa" },
  userName: { fontSize: 28, fontWeight: "bold", color: "#fff", marginTop: 4 },
  checkIn: { marginHorizontal: 24, marginBottom: 24, backgroundColor: "#2ecc71" },
  checkOut: { marginHorizontal: 24, marginBottom: 24, backgroundColor: "#f39c12" },
  completedCard: { marginHorizontal: 24, marginBottom: 24, alignItems: "center", padding: 24 },
  completedText: { color: "#2ecc71", fontSize: 16 },
  statsGrid: { flexDirection: "row", paddingHorizontal: 24, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center", padding: 16, marginHorizontal: 4, marginBottom: 0 },
  statValue: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 12, color: "#8899aa", marginTop: 4 },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  adminTitle: {
    color: "#1a73e8", fontSize: 14, fontWeight: "600", textTransform: "uppercase",
    letterSpacing: 1, marginTop: 16, marginBottom: 12,
  },
});
