import React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { useTheme, ThemeColors } from "../theme/ThemeProvider";
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
  { label: "Davomat tarixi", screen: "AttendanceHistory", icon: "history" },
  { label: "Statistika", screen: "Statistics", icon: "chart-bar" },
  { label: "Xabarlar", screen: "Conversations", icon: "comments" },
  { label: "Hujjatlar", screen: "Documents", icon: "file-alt" },
  { label: "Xodimlar", screen: "EmployeeDirectory", icon: "users" },
];

const ADMIN_ACTIONS: ActionItem[] = [
  { label: "Bo'lim davomati", screen: "DepartmentAttendance", icon: "user-check" },
  { label: "Hisobotlar", screen: "DepartmentReports", icon: "chart-line" },
  { label: "Xodimlar reestri", screen: "EmployeesRegistry", icon: "id-card" },
  { label: "Audit jurnali", screen: "AuditLogs", icon: "shield-alt" },
  { label: "Shubhali faoliyat", screen: "SuspiciousActivities", icon: "exclamation-triangle" },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
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
        <TouchableOpacity key={action.screen} style={styles.gridCard} activeOpacity={0.7} onPress={() => navigation.navigate(action.screen as any)}>
          <FontAwesome5 name={action.icon} size={22} color={colors.primary} style={styles.gridIcon} />
          <Text style={styles.gridLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 28, paddingHorizontal: 16 }} refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Assalomu alaykum</Text>
          <Text style={styles.userName} numberOfLines={1}>{user?.fullName || "Foydalanuvchi"}</Text>
          {user?.organization?.name ? <Text style={styles.orgName} numberOfLines={1}>{user.organization.name}</Text> : null}
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
      </View>

      {!hasCheckedIn ? (
        <ThemedButton title="Keldim" onPress={() => navigation.navigate("CheckIn")} variant="primary" size="lg" style={styles.checkIn} />
      ) : !hasCheckedOut ? (
        <ThemedButton title="Ketdim" onPress={() => navigation.navigate("CheckOut")} variant="secondary" size="lg" style={styles.checkOut} />
      ) : (
        <View style={[styles.completedCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.completedIcon}>✓</Text>
          <Text style={styles.completedText}>Bugungi davomat to'liq qayd etildi</Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <ThemedCard style={styles.statCard}><Text style={styles.statValue}>{stats?.presentDays ?? 0}</Text><Text style={styles.statLabel}>Kelgan kunlar</Text></ThemedCard>
        <ThemedCard style={styles.statCard}><Text style={[styles.statValue, { color: colors.warning }]}>{stats?.lateDays ?? 0}</Text><Text style={styles.statLabel}>Kech qolish</Text></ThemedCard>
        <ThemedCard style={styles.statCard}><Text style={[styles.statValue, { color: colors.success }]}>{stats?.attendanceRate ?? 0}%</Text><Text style={styles.statLabel}>Davomat foizi</Text></ThemedCard>
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 56, paddingBottom: 20 },
  greeting: { fontSize: 14, color: c.textSecondary },
  userName: { fontSize: 26, fontWeight: "bold", color: c.textPrimary, marginTop: 2 },
  orgName: { fontSize: 13, color: c.textMuted, marginTop: 3 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.primary, alignItems: "center", justifyContent: "center", marginLeft: 12 },
  avatarText: { color: c.onPrimary, fontSize: 22, fontWeight: "700" },
  checkIn: { alignSelf: "stretch", marginBottom: 20, backgroundColor: "#2ecc71" },
  checkOut: { alignSelf: "stretch", marginBottom: 20, backgroundColor: "#f39c12" },
  completedCard: { borderRadius: 12, marginBottom: 20, alignItems: "center", padding: 22 },
  completedIcon: { fontSize: 34, color: "#2ecc71", marginBottom: 6 },
  completedText: { color: "#2ecc71", fontSize: 15, fontWeight: "500" },
  statsGrid: { flexDirection: "row", marginBottom: 26, gap: 10 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 18, marginBottom: 0, marginHorizontal: 0 },
  statValue: { fontSize: 24, fontWeight: "bold", color: c.textPrimary },
  statLabel: { fontSize: 11.5, color: c.textSecondary, marginTop: 5, textAlign: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: c.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  gridCard: { width: "47%", flexGrow: 1, backgroundColor: c.surface, borderRadius: 16, paddingVertical: 22, paddingHorizontal: 12, alignItems: "center", borderWidth: 1, borderColor: c.border },
  gridIcon: { marginBottom: 12 },
  gridLabel: { color: c.textPrimary, fontSize: 13.5, fontWeight: "600", textAlign: "center" },
});
