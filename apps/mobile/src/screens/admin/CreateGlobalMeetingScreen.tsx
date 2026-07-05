import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import ThemedButton from "../../components/ThemedButton";
import ThemedCard from "../../components/ThemedCard";

export default function CreateGlobalMeetingScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000));
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api.get("/organizations").then((r) => r.data),
  });

  const { data: employees } = useQuery({
    queryKey: ["allEmployees"],
    queryFn: () => api.get("/admin/employees?limit=500").then((r) => r.data),
  });

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [selectedOverseerIds, setSelectedOverseerIds] = useState<string[]>([]);

  const orgList = Array.isArray(organizations) ? organizations : [];
  const empList = employees?.employees || [];

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/meetings", data);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert("Muvaffaqiyatli", "Global uchrashuv yaratildi", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert("Xatolik", error.response?.data?.error?.message || "Xatolik yuz berdi");
    },
  });

  const toggleParticipant = (empId: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const toggleOverseer = (empId: string) => {
    setSelectedOverseerIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleCreate = () => {
    if (!title.trim()) { Alert.alert("Xatolik", "Sarlavha kiritilishi shart"); return; }
    if (selectedParticipantIds.length === 0) { Alert.alert("Xatolik", "Kamida bitta ishtirokchi tanlanishi kerak"); return; }

    const startDateTime = new Date(date);
    startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const endDateTime = new Date(date);
    endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    createMutation.mutate({
      title: title.trim(), agenda: agenda.trim() || undefined,
      description: description.trim() || undefined,
      date: date.toISOString(), startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(), location: location.trim() || undefined,
      meetingLink: meetingLink.trim() || undefined, isOnline, isGlobal: true,
      organizationId: selectedOrgId || user?.organization?.id,
      departmentId: selectedDeptId || undefined,
      participantIds: selectedParticipantIds,
      overseerIds: selectedOverseerIds.length > 0 ? selectedOverseerIds : undefined,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Global uchrashuv yaratish</Text>
        <Text style={styles.subtitle}>Barcha tashkilotlar uchun</Text>
      </View>

      <ThemedCard>
        <Text style={styles.label}>Sarlavha *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Uchrashuv sarlavhasi" placeholderTextColor="#556677" />

        <Text style={styles.label}>Kun tartibi</Text>
        <TextInput style={[styles.input, styles.textArea]} value={agenda} onChangeText={setAgenda} multiline numberOfLines={4} placeholderTextColor="#556677" />

        <Text style={styles.label}>Tavsif</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={3} placeholderTextColor="#556677" />

        <Text style={styles.label}>Sana *</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: "#fff" }}>{date.toLocaleDateString("uz-UZ")}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d); }} />
        )}

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Boshlanish *</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowStartTimePicker(true)}>
              <Text style={{ color: "#fff" }}>
                {startTime.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker value={startTime} mode="time" onChange={(_, t) => { setShowStartTimePicker(false); if (t) setStartTime(t); }} />
            )}
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Tugash</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowEndTimePicker(true)}>
              <Text style={{ color: "#fff" }}>
                {endTime.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker value={endTime} mode="time" onChange={(_, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }} />
            )}
          </View>
        </View>

        <Text style={styles.label}>Tashkilot</Text>
        <View style={styles.pillContainer}>
          {orgList.map((org: any) => (
            <TouchableOpacity
              key={org.id}
              style={[styles.pill, selectedOrgId === org.id && styles.pillSelected]}
              onPress={() => setSelectedOrgId(org.id)}
            >
              <Text style={styles.pillText}>{org.shortName || org.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Joy / Online</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Joy" placeholderTextColor="#556677" />
          </View>
          <TouchableOpacity
            style={[styles.onlineToggle, isOnline && styles.onlineActive]}
            onPress={() => setIsOnline(!isOnline)}
          >
            <Text style={styles.onlineText}>Online</Text>
          </TouchableOpacity>
        </View>

        {isOnline && (
          <>
            <Text style={styles.label}>Havola</Text>
            <TextInput style={styles.input} value={meetingLink} onChangeText={setMeetingLink} placeholder="https://meet.google.com/..." placeholderTextColor="#556677" autoCapitalize="none" />
          </>
        )}

        <Text style={styles.label}>Ishtirokchilar * ({selectedParticipantIds.length})</Text>
        {empList.map((emp: any) => (
          <TouchableOpacity
            key={emp.id}
            style={[styles.checkItem, selectedParticipantIds.includes(emp.id) && styles.checkItemSelected]}
            onPress={() => toggleParticipant(emp.id)}
          >
            <Text style={styles.checkText}>{emp.user?.fullName || emp.employeeCode}</Text>
            <Text style={styles.checkMark}>{selectedParticipantIds.includes(emp.id) ? "✓" : ""}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Kuzatuvchilar ({selectedOverseerIds.length})</Text>
        {empList.map((emp: any) => (
          <TouchableOpacity
            key={`ov-${emp.id}`}
            style={[styles.checkItem, selectedOverseerIds.includes(emp.id) && styles.checkItemOverseer]}
            onPress={() => toggleOverseer(emp.id)}
          >
            <Text style={styles.checkText}>{emp.user?.fullName || emp.employeeCode}</Text>
            <Text style={styles.checkMark}>{selectedOverseerIds.includes(emp.id) ? "✓" : ""}</Text>
          </TouchableOpacity>
        ))}
      </ThemedCard>

      <ThemedButton
        title={createMutation.isPending ? "Yaratilmoqda..." : "Global uchrashuvni yaratish"}
        onPress={handleCreate}
        loading={createMutation.isPending}
        fullWidth
        style={{ margin: 16 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#8899aa", marginTop: 4 },
  label: { color: "#8899aa", fontSize: 14, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: "#16213e", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#0f3460" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", alignItems: "center" },
  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { backgroundColor: "#16213e", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#0f3460" },
  pillSelected: { borderColor: "#1a73e8", backgroundColor: "#1a73e822" },
  pillText: { color: "#fff", fontSize: 13 },
  onlineToggle: { backgroundColor: "#16213e", borderRadius: 10, padding: 14, marginLeft: 12, borderWidth: 1, borderColor: "#0f3460", minWidth: 80, alignItems: "center" },
  onlineActive: { borderColor: "#2ecc71", backgroundColor: "#2ecc7122" },
  onlineText: { color: "#fff", fontSize: 14 },
  checkItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#16213e", borderRadius: 8, padding: 12, marginBottom: 4, borderWidth: 1, borderColor: "#0f3460" },
  checkItemSelected: { borderColor: "#1a73e8", backgroundColor: "#1a73e822" },
  checkItemOverseer: { borderColor: "#f39c12", backgroundColor: "#f39c1222" },
  checkText: { color: "#fff", fontSize: 14 },
  checkMark: { color: "#1a73e8", fontSize: 16, fontWeight: "bold" },
});
