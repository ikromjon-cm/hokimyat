import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Modal, TextInput, TouchableOpacity,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FontAwesome5 } from "@expo/vector-icons";
import { api } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import EmptyState from "../../components/EmptyState";
import ThemedCard from "../../components/ThemedCard";
import ThemedButton from "../../components/ThemedButton";
import Badge from "../../components/Badge";

const EMPTY_FORM = { fullName: "", phone: "+998", position: "", employeeCode: "" };

export default function EmployeesRegistryScreen() {
  const qc = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [deptId, setDeptId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminEmployees"],
    queryFn: () => api.get("/admin/employees?limit=100").then((r) => r.data),
  });
  const employees = data?.employees || [];

  const { data: orgs } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/organizations").then((r) => r.data),
    enabled: modalVisible,
  });
  const { data: depts } = useQuery({
    queryKey: ["departments", orgId],
    queryFn: () => api.get(`/departments${orgId ? `?organizationId=${orgId}` : ""}`).then((r) => r.data),
    enabled: modalVisible && !!orgId,
  });

  const orgList: any[] = Array.isArray(orgs) ? orgs : orgs?.organizations || [];
  const deptList: any[] = Array.isArray(depts) ? depts : depts?.departments || [];

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/employees", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminEmployees"] });
      closeModal();
      Alert.alert("Muvaffaqiyatli", "Xodim qo'shildi. Endi u telefon raqami bilan tizimga kira oladi.");
    },
    onError: (e: any) => Alert.alert("Xatolik", e?.response?.data?.error?.message || "Xodim qo'shilmadi"),
  });

  const closeModal = () => {
    setModalVisible(false);
    setForm(EMPTY_FORM);
    setOrgId(null);
    setDeptId(null);
  };

  const handleSubmit = () => {
    if (!/^\+998\d{9}$/.test(form.phone)) return Alert.alert("Xatolik", "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");
    if (!form.fullName.trim()) return Alert.alert("Xatolik", "To'liq ismni kiriting");
    if (!orgId) return Alert.alert("Xatolik", "Tashkilotni tanlang");
    if (!deptId) return Alert.alert("Xatolik", "Bo'limni tanlang");
    createMutation.mutate({
      phone: form.phone,
      fullName: form.fullName.trim(),
      position: form.position.trim() || undefined,
      employeeCode: form.employeeCode.trim() || `EMP-${form.phone.slice(-4)}`,
      organizationId: orgId,
      departmentId: deptId,
    });
  };

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
        <Badge label={item.isActive ? "Faol" : "No faol"} variant={item.isActive ? "success" : "danger"} size="sm" />
      </View>
    </ThemedCard>
  );

  if (isLoading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xodimlar reestri</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <FontAwesome5 name="user-plus" size={13} color="#fff" />
          <Text style={styles.addBtnText}>Yangi xodim</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={employees}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={<EmptyState title="Xodimlar topilmadi. Birinchi xodimni qo'shing" />}
      />

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Yangi xodim qo'shish</Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FontAwesome5 name="times" size={18} color="#8899aa" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>To'liq ism *</Text>
              <TextInput style={styles.input} value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} placeholder="Familiya Ism" placeholderTextColor="#556677" />

              <Text style={styles.label}>Telefon raqam *</Text>
              <TextInput style={styles.input} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="+998901234567" placeholderTextColor="#556677" keyboardType="phone-pad" />

              <Text style={styles.label}>Lavozim</Text>
              <TextInput style={styles.input} value={form.position} onChangeText={(v) => setForm({ ...form, position: v })} placeholder="Mutaxassis" placeholderTextColor="#556677" />

              <Text style={styles.label}>Tabel raqami</Text>
              <TextInput style={styles.input} value={form.employeeCode} onChangeText={(v) => setForm({ ...form, employeeCode: v })} placeholder="Bo'sh qoldirsangiz avtomatik" placeholderTextColor="#556677" />

              <Text style={styles.label}>Tashkilot *</Text>
              <View style={styles.chips}>
                {orgList.map((o) => (
                  <TouchableOpacity key={o.id} style={[styles.chip, orgId === o.id && styles.chipActive]} onPress={() => { setOrgId(o.id); setDeptId(null); }}>
                    <Text style={[styles.chipText, orgId === o.id && styles.chipTextActive]}>{o.shortName || o.name}</Text>
                  </TouchableOpacity>
                ))}
                {orgList.length === 0 && <Text style={styles.hint}>Tashkilotlar yuklanmoqda...</Text>}
              </View>

              {orgId ? (
                <>
                  <Text style={styles.label}>Bo'lim *</Text>
                  <View style={styles.chips}>
                    {deptList.map((d) => (
                      <TouchableOpacity key={d.id} style={[styles.chip, deptId === d.id && styles.chipActive]} onPress={() => setDeptId(d.id)}>
                        <Text style={[styles.chipText, deptId === d.id && styles.chipTextActive]}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {deptList.length === 0 && <Text style={styles.hint}>Bu tashkilotda bo'lim yo'q — avval bo'lim qo'shing</Text>}
                  </View>
                </>
              ) : null}

              <ThemedButton
                title="Qo'shish"
                onPress={handleSubmit}
                loading={createMutation.isPending}
                fullWidth
                style={{ marginTop: 18, marginBottom: 8 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#1a73e8", paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10 },
  addBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "600" },
  employeeRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#0f3460", justifyContent: "center", alignItems: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  info: { flex: 1 },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  detail: { color: "#8899aa", fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#16213e", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, maxHeight: "88%" },
  modalHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { color: "#fff", fontSize: 19, fontWeight: "700" },
  label: { color: "#8899aa", fontSize: 13, marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: "#0f3460", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#fff" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#0f3460", borderRadius: 20, paddingVertical: 9, paddingHorizontal: 15, borderWidth: 1, borderColor: "#0f3460" },
  chipActive: { backgroundColor: "#1a73e8", borderColor: "#4d8bf0" },
  chipText: { color: "#b8c2d8", fontSize: 13.5, fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  hint: { color: "#556677", fontSize: 12.5, paddingVertical: 6 },
});
