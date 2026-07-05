import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";

export default function CreateMeetingScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);

  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000));
  const [location, setLocation] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

  const { data: employees } = useQuery({
    queryKey: ["employees", user?.organization?.id],
    queryFn: () => api.get(`/admin/employees?organizationId=${user?.organization?.id}&limit=100`).then((r) => r.data),
    enabled: !!user?.organization?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/meetings", data);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert("Muvaffaqiyatli", "Uchrashuv yaratildi", [
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
      participantIds: selectedParticipantIds,
    });
  };

  const empList = employees?.employees || [];

  return (
    <ScrollView style={styles.container}>
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

        <Text style={styles.label}>Boshlanish vaqti *</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowStartTimePicker(true)}>
          <Text style={{ color: "#fff" }}>{startTime.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</Text>
        </TouchableOpacity>
        {showStartTimePicker && (
          <DateTimePicker value={startTime} mode="time" onChange={(_, t) => { setShowStartTimePicker(false); if (t) setStartTime(t); }} />
        )}

        <Text style={styles.label}>Tugash vaqti</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowEndTimePicker(true)}>
          <Text style={{ color: "#fff" }}>{endTime.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}</Text>
        </TouchableOpacity>
        {showEndTimePicker && (
          <DateTimePicker value={endTime} mode="time" onChange={(_, t) => { setShowEndTimePicker(false); if (t) setEndTime(t); }} />
        )}

        <Text style={styles.label}>Joy</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Majlislar xonasi 201" placeholderTextColor="#556677" />

        <Text style={styles.label}>Ishtirokchilar * ({selectedParticipantIds.length})</Text>
        {empList.map((emp: any) => (
          <TouchableOpacity
            key={emp.id}
            style={[styles.participantItem, selectedParticipantIds.includes(emp.id) && styles.participantSelected]}
            onPress={() => toggleParticipant(emp.id)}
          >
            <Text style={styles.participantName}>{emp.user?.fullName || emp.employeeCode}</Text>
            <Text style={styles.participantCheck}>{selectedParticipantIds.includes(emp.id) ? "✓" : ""}</Text>
          </TouchableOpacity>
        ))}
      </ThemedCard>

      <ThemedButton
        title={createMutation.isPending ? "Yaratilmoqda..." : "Uchrashuvni yaratish"}
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
  label: { color: "#8899aa", fontSize: 14, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: "#16213e", borderRadius: 10, padding: 14, color: "#fff",
    fontSize: 15, borderWidth: 1, borderColor: "#0f3460",
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  participantItem: {
    flexDirection: "row", justifyContent: "space-between", backgroundColor: "#16213e",
    borderRadius: 8, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: "#0f3460",
  },
  participantSelected: { borderColor: "#1a73e8", backgroundColor: "#1a73e822" },
  participantName: { color: "#fff", fontSize: 14 },
  participantCheck: { color: "#1a73e8", fontSize: 16, fontWeight: "bold" },
});
