import React, { useState } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import ThemedCard from "../../components/ThemedCard";
import ThemedButton from "../../components/ThemedButton";

export default function ReportsCenterScreen() {
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
          startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
        },
        responseType: "arraybuffer",
      });

      const base64 = arrayBufferToBase64(response.data);
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) throw new Error("Fayl saqlanmadi");

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

  const reportTypes = [
    { key: "excel" as const, title: "Excel hisobot", desc: ".xlsx formatida to'liq davomat", color: "#2ecc71" },
    { key: "pdf" as const, title: "PDF hisobot", desc: ".pdf formatida chop etish uchun", color: "#e74c3c" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hisobotlar markazi</Text>
        <Text style={styles.subtitle}>Davomat hisobotlarini yuklab oling</Text>
      </View>

      {reportTypes.map((type) => (
        <ThemedCard key={type.key} style={styles.reportCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{type.title}</Text>
            <Text style={styles.cardDesc}>{type.desc}</Text>
          </View>
          <ThemedButton
            title={isLoading === type.key ? "..." : "Yuklash"}
            onPress={() => downloadReport(type.key)}
            loading={isLoading === type.key}
            size="sm"
          />
        </ThemedCard>
      ))}

      <ThemedCard title="Filtrlar" style={{ margin: 16 }}>
        <Text style={styles.infoText}>• Tashkilot: {user?.organization?.name || "Barchasi"}</Text>
        <Text style={styles.infoText}>• Davr: So'nggi 1 oy</Text>
        <Text style={styles.infoText}>• Format: Excel / PDF</Text>
      </ThemedCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#8899aa", marginTop: 4 },
  reportCard: { flexDirection: "row", alignItems: "center", margin: 16, marginTop: 0 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cardDesc: { color: "#8899aa", fontSize: 12, marginTop: 2 },
  infoText: { color: "#8899aa", fontSize: 13, marginBottom: 4 },
});
