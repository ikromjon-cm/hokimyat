import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import ThemedCard from "../components/ThemedCard";
import ThemedButton from "../components/ThemedButton";

export default function DepartmentReportsScreen() {
  const user = useAuthStore((s) => s.user);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const downloadReport = async (format: "excel" | "pdf") => {
    setIsLoading(format);
    try {
      const ext = format === "excel" ? "xlsx" : "pdf";
      const fileUri = FileSystem.documentDirectory + `davomat_${Date.now()}.${ext}`;

      const response = await api.get(`/reports/${format}`, {
        params: {
          organizationId: user?.organization?.id,
          departmentId: user?.department?.id,
          startDate: new Date(new Date().setDate(1)).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
        },
        responseType: "arraybuffer",
      });

      const base64 = arrayBufferToBase64(response.data);
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === "excel"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "application/pdf",
          dialogTitle: "Hisobot",
        });
      } else {
        Alert.alert("Yuklandi", `Hisobot saqlandi: ${fileUri.split("/").pop()}`);
      }
    } catch (error: any) {
      Alert.alert("Xatolik", error.message || "Hisobotni yuklab bo'lmadi");
    } finally {
      setIsLoading(null);
    }
  };

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hisobotlar</Text>
        <Text style={styles.subtitle}>Davomat hisobotlarini yuklab olish</Text>
      </View>

      <ThemedCard title="Excel formatida">
        <Text style={styles.cardDesc}>.xlsx formatida to'liq davomat ma'lumotlari</Text>
        <ThemedButton
          title={isLoading === "excel" ? "Yuklanmoqda..." : "Yuklab olish"}
          onPress={() => downloadReport("excel")}
          loading={isLoading === "excel"}
          fullWidth
          variant="primary"
        />
      </ThemedCard>

      <ThemedCard title="PDF formatida">
        <Text style={styles.cardDesc}>.pdf formatida hisobot (chop etish uchun)</Text>
        <ThemedButton
          title={isLoading === "pdf" ? "Yuklanmoqda..." : "Yuklab olish"}
          onPress={() => downloadReport("pdf")}
          loading={isLoading === "pdf"}
          fullWidth
          variant="danger"
        />
      </ThemedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#8899aa", marginTop: 4 },
  cardDesc: { fontSize: 13, color: "#8899aa", marginBottom: 12 },
});
