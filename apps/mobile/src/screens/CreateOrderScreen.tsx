import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useToast } from "../hooks/useToast";
import { api } from "../services/api";
import ThemedButton from "../components/ThemedButton";

let DateTimePicker: any;
try {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} catch {
  DateTimePicker = null;
}

interface Assignee { name: string; task: string; }

export default function CreateOrderScreen() {
  const toast = useToast();
  const [orderNumber] = useState(`B-${Date.now().toString(36).toUpperCase()}`);
  const [title, setTitle] = useState("");
  const [preamble, setPreamble] = useState("");
  const [content, setContent] = useState("");
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [effectiveDate, setEffectiveDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState("");
  const [newAssigneeTask, setNewAssigneeTask] = useState("");

  const addAssignee = () => {
    if (!newAssigneeName.trim() || !newAssigneeTask.trim()) {
      toast.warning("Ism va topshiriqni kiriting");
      return;
    }
    setAssignees([...assignees, { name: newAssigneeName.trim(), task: newAssigneeTask.trim() }]);
    setNewAssigneeName("");
    setNewAssigneeTask("");
  };

  const removeAssignee = (index: number) => {
    setAssignees(assignees.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.warning("Sarlavha va matn talab qilinadi");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/documents/order", {
        orderNumber: orderNumber.trim(),
        title: title.trim(), preamble: preamble.trim(), content: content.trim(),
        assignees, effectiveDate: effectiveDate.toISOString(),
      }, { responseType: "arraybuffer" });

      const fileName = `buyruq_${orderNumber}_${Date.now()}.pdf`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      let binary = "";
      const bytes = new Uint8Array(response.data);
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      await FileSystem.writeAsStringAsync(filePath, btoa(binary), {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(filePath);
      toast.success("Buyruq yaratildi");
    } catch {
      toast.error("Yaratib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Buyruq raqami</Text>
      <TextInput style={styles.input} value={orderNumber} editable={false} />

      <Text style={styles.label}>Sarlavha</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Xodimni tayinlash to'g'risida" placeholderTextColor="#555" />

      <Text style={styles.label}>Preambula</Text>
      <TextInput style={[styles.input, styles.multiline]} value={preamble} onChangeText={setPreamble} multiline numberOfLines={3} placeholderTextColor="#555" />

      <Text style={styles.label}>Buyruq matni</Text>
      <TextInput style={[styles.input, styles.multiline]} value={content} onChangeText={setContent} multiline numberOfLines={6} placeholder="Buyruqning asosiy qismi..." placeholderTextColor="#555" />

      <Text style={styles.label}>Kuchga kirish sanasi</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={{ color: "#fff" }}>{effectiveDate.toLocaleDateString("uz-UZ")}</Text>
      </TouchableOpacity>
      {showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={effectiveDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_: any, date?: Date) => { setShowDatePicker(false); if (date) setEffectiveDate(date); }}
        />
      )}

      <Text style={styles.label}>Ijrochilar</Text>
      {assignees.map((a, i) => (
        <View key={i} style={styles.assigneeRow}>
          <View style={styles.assigneeInfo}>
            <Text style={styles.assigneeName}>{a.name}</Text>
            <Text style={styles.assigneeTask}>{a.task}</Text>
          </View>
          <TouchableOpacity onPress={() => removeAssignee(i)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.addAssigneeRow}>
        <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} value={newAssigneeName} onChangeText={setNewAssigneeName} placeholder="Ism" placeholderTextColor="#555" />
        <TextInput style={[styles.input, { flex: 2 }]} value={newAssigneeTask} onChangeText={setNewAssigneeTask} placeholder="Topshiriq" placeholderTextColor="#555" />
        <ThemedButton title="+" onPress={addAssignee} size="sm" style={{ width: 44, marginLeft: 8 }} />
      </View>

      <ThemedButton title="Buyruqni yaratish" onPress={handleSubmit} loading={loading} fullWidth style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: { padding: 16, paddingBottom: 40 },
  label: { color: "#8899aa", fontSize: 13, fontWeight: "600", marginBottom: 6, marginTop: 16, textTransform: "uppercase", letterSpacing: 1 },
  input: { backgroundColor: "#16213e", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "#0f3460" },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  assigneeRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#16213e",
    borderRadius: 10, padding: 12, marginBottom: 8,
  },
  assigneeInfo: { flex: 1 },
  assigneeName: { color: "#fff", fontSize: 14, fontWeight: "500" },
  assigneeTask: { color: "#8899aa", fontSize: 13, marginTop: 2 },
  removeText: { color: "#e74c3c", fontSize: 18, marginLeft: 12 },
  addAssigneeRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
});
