import React from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuthStore();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      logout();
    },
  });

  const handleLogout = () => {
    Alert.alert("Chiqish", "Tizimdan chiqishni xohlaysizmi?", [
      { text: "Bekor qilish", style: "cancel" },
      { text: "Chiqish", style: "destructive", onPress: () => logoutMutation.mutate() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.fullName || "U")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.fullName || "Foydalanuvchi"}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === "SUPER_ADMIN" ? "Super Admin" :
             user?.role === "DEPARTMENT_HEAD" ? "Bo'lim boshlig'i" : "Xodim"}
          </Text>
        </View>
      </View>

      {user?.organization && (
        <ThemedCard style={{ marginHorizontal: 16 }}>
          <Text style={styles.infoLabel}>Tashkilot</Text>
          <Text style={styles.infoValue}>{user.organization.name}</Text>
          {user.department && (
            <>
              <Text style={styles.infoLabel}>Bo'lim</Text>
              <Text style={styles.infoValue}>{user.department.name}</Text>
            </>
          )}
        </ThemedCard>
      )}

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("AttendanceHistory")}>
          <Text style={styles.menuText}>Davomat tarixi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Statistics")}>
          <Text style={styles.menuText}>Statistika</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Notifications")}>
          <Text style={styles.menuText}>Bildirishnomalar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Conversations")}>
          <Text style={styles.menuText}>Xabarlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("EmployeeDirectory")}>
          <Text style={styles.menuText}>Xodimlar katalogi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Documents")}>
          <Text style={styles.menuText}>Hujjatlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("FaceVerification")}>
          <Text style={styles.menuText}>Yuz tekshirish</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("QRScanner")}>
          <Text style={styles.menuText}>QR skanerlash</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Settings")}>
          <Text style={styles.menuText}>Sozlamalar</Text>
        </TouchableOpacity>

        {user?.role === "SUPER_ADMIN" && (
          <>
            <Text style={styles.menuHeader}>Administrator</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("EmployeesRegistry")}>
              <Text style={styles.menuText}>Xodimlar reestri</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("OrganizationsManagement")}>
              <Text style={styles.menuText}>Tashkilotlar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ReportsCenter")}>
              <Text style={styles.menuText}>Hisobot markazi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("MeetingMonitoringDashboard")}>
              <Text style={styles.menuText}>Uchrashuvlar monitoringi</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("OrganizationSettings")}>
              <Text style={styles.menuText}>Tashkilot sozlamalari</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("AuditLogs")}>
              <Text style={styles.menuText}>Audit jurnali</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("SuspiciousActivities")}>
              <Text style={[styles.menuText, { color: "#e74c3c" }]}>Shubhali faoliyatlar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("SystemSettings")}>
              <Text style={styles.menuText}>Tizim sozlamalari</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <ThemedButton
        title="Chiqish"
        onPress={handleLogout}
        variant="danger"
        fullWidth
        style={{ marginHorizontal: 16, marginBottom: 16 }}
        loading={logoutMutation.isPending}
      />

      <Text style={styles.version}>UYCHI MAJLIS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  avatarSection: { alignItems: "center", paddingTop: 60, paddingBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#e94560", justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  userName: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  userPhone: { fontSize: 14, color: "#8899aa", marginTop: 4 },
  roleBadge: {
    backgroundColor: "#1a73e833", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
  },
  roleText: { color: "#1a73e8", fontSize: 12, fontWeight: "500" },
  infoLabel: { color: "#8899aa", fontSize: 12, marginBottom: 2, marginTop: 8 },
  infoValue: { color: "#fff", fontSize: 16 },
  menuSection: { margin: 16, gap: 8 },
  menuItem: {
    backgroundColor: "#16213e", borderRadius: 12,
    padding: 16,
  },
  menuHeader: { color: "#8899aa", fontSize: 13, fontWeight: "600", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  menuText: { color: "#fff", fontSize: 16 },
  version: { textAlign: "center", color: "#556677", fontSize: 12, marginBottom: 32 },
});
