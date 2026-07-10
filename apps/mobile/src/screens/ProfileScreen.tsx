import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FontAwesome5 } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { useT } from "../utils/i18n";
import { useTheme, ThemeColors } from "../theme/ThemeProvider";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MENU = [
  { labelKey: "home.attendance_history", screen: "AttendanceHistory", icon: "history" },
  { labelKey: "home.statistics", screen: "Statistics", icon: "chart-bar" },
  { labelKey: "profile.notifications", screen: "Notifications", icon: "bell" },
  { labelKey: "home.messages", screen: "Conversations", icon: "comments" },
  { labelKey: "home.documents", screen: "Documents", icon: "file-alt" },
  { labelKey: "profile.face", screen: "FaceVerification", icon: "user-shield" },
  { labelKey: "profile.settings", screen: "Settings", icon: "cog" },
] as const;

const ADMIN_MENU = [
  { labelKey: "home.employees_registry", screen: "EmployeesRegistry", icon: "id-card" },
  { labelKey: "profile.orgs", screen: "OrganizationsManagement", icon: "building" },
  { labelKey: "profile.report_center", screen: "ReportsCenter", icon: "chart-line" },
  { labelKey: "profile.org_settings", screen: "OrganizationSettings", icon: "sliders-h" },
  { labelKey: "home.audit", screen: "AuditLogs", icon: "shield-alt" },
  { labelKey: "profile.system_settings", screen: "SystemSettings", icon: "server" },
] as const;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const tr = useT();
  const { user, logout, updateUser } = useAuthStore();
  const [editVisible, setEditVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");

  const logoutMutation = useMutation({
    mutationFn: async () => { await api.post("/auth/logout"); },
    onSettled: () => logout(),
  });

  const saveMutation = useMutation({
    mutationFn: async (name: string) => api.patch("/users/profile", { fullName: name }).then((r) => r.data),
    onSuccess: async (_data, name) => {
      await updateUser({ fullName: name });
      setEditVisible(false);
      Alert.alert(tr("common.success"), tr("profile.saved"));
    },
    onError: (e: any) => Alert.alert(tr("common.error"), e?.response?.data?.error?.message || "?"),
  });

  const handleLogout = () => {
    Alert.alert(tr("profile.logout"), tr("profile.logout_confirm"), [
      { text: tr("common.cancel"), style: "cancel" },
      { text: tr("profile.logout"), style: "destructive", onPress: () => logoutMutation.mutate() },
    ]);
  };

  const roleLabel = user?.role === "SUPER_ADMIN" ? tr("profile.role_super") : user?.role === "DEPARTMENT_HEAD" ? tr("profile.role_head") : tr("profile.role_employee");

  const renderMenu = (items: readonly { labelKey: string; screen: string; icon: string }[]) =>
    items.map((m) => (
      <TouchableOpacity key={m.screen} style={styles.menuItem} onPress={() => navigation.navigate(m.screen as any)} activeOpacity={0.7}>
        <FontAwesome5 name={m.icon} size={15} color={colors.primary} style={{ width: 26 }} />
        <Text style={styles.menuText}>{tr(m.labelKey)}</Text>
        <FontAwesome5 name="chevron-right" size={12} color={colors.textMuted} />
      </TouchableOpacity>
    ));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.fullName || "U")[0].toUpperCase()}</Text></View>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{user?.fullName || "Foydalanuvchi"}</Text>
          <TouchableOpacity onPress={() => { setFullName(user?.fullName || ""); setEditVisible(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FontAwesome5 name="pen" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>{roleLabel}</Text></View>
      </View>

      {user?.organization && (
        <ThemedCard>
          <Text style={styles.infoLabel}>{tr("profile.organization")}</Text>
          <Text style={styles.infoValue}>{user.organization.name}</Text>
          {user.department && (<><Text style={styles.infoLabel}>{tr("profile.department")}</Text><Text style={styles.infoValue}>{user.department.name}</Text></>)}
        </ThemedCard>
      )}

      <View style={styles.menuSection}>
        {renderMenu(MENU)}
        {user?.role === "SUPER_ADMIN" && (
          <>
            <Text style={styles.menuHeader}>{tr("profile.admin")}</Text>
            {renderMenu(ADMIN_MENU)}
          </>
        )}
      </View>

      <ThemedButton title={tr("profile.logout")} onPress={handleLogout} variant="danger" fullWidth style={{ marginHorizontal: 16, marginBottom: 16 }} loading={logoutMutation.isPending} />
      <Text style={styles.version}>UYCHI MAJLIS v1.0.0</Text>

      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{tr("profile.edit_title")}</Text>
            <Text style={styles.infoLabel}>{tr("profile.full_name")}</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Familiya Ism" placeholderTextColor={colors.textMuted} autoFocus />
            <Text style={styles.infoLabel}>{tr("profile.phone_readonly")}</Text>
            <Text style={[styles.input, styles.inputDisabled]}>{user?.phone}</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <ThemedButton title={tr("common.cancel")} onPress={() => setEditVisible(false)} variant="secondary" style={{ flex: 1 }} />
              <View style={{ flex: 1 }}>
                <ThemedButton title={tr("common.save")} onPress={() => fullName.trim() ? saveMutation.mutate(fullName.trim()) : Alert.alert(tr("common.error"), tr("profile.full_name"))} loading={saveMutation.isPending} fullWidth />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg },
  avatarSection: { alignItems: "center", paddingTop: 56, paddingBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "bold", color: c.onPrimary },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  userName: { fontSize: 22, fontWeight: "bold", color: c.textPrimary },
  userPhone: { fontSize: 14, color: c.textSecondary, marginTop: 4 },
  roleBadge: { backgroundColor: c.primarySoft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4, marginTop: 8 },
  roleText: { color: c.primary, fontSize: 12, fontWeight: "600" },
  infoLabel: { color: c.textSecondary, fontSize: 12, marginBottom: 2, marginTop: 8 },
  infoValue: { color: c.textPrimary, fontSize: 16 },
  menuSection: { margin: 16, gap: 8 },
  menuItem: { backgroundColor: c.surface, borderRadius: 12, padding: 15, flexDirection: "row", alignItems: "center", gap: 6 },
  menuHeader: { color: c.textSecondary, fontSize: 13, fontWeight: "600", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  menuText: { color: c.textPrimary, fontSize: 15.5, flex: 1 },
  version: { textAlign: "center", color: c.textMuted, fontSize: 12, marginBottom: 32 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: c.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 32 },
  modalTitle: { color: c.textPrimary, fontSize: 19, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: c.surfaceAlt, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.textPrimary, marginTop: 4 },
  inputDisabled: { color: c.textMuted },
});
