import React, { useState } from "react";
import {
  View, Text, StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { captureError } from "../services/sentry";
import ThemedCard from "../components/ThemedCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/Badge";

interface DocumentType {
  id: string; title: string; icon: string; endpoint: string;
  params?: Record<string, string>; adminOnly?: boolean;
}

const DOCUMENTS: DocumentType[] = [
  { id: "my-attendance", title: "Davomat ma'lohnomasi", icon: "📋", endpoint: "/documents/attendance-certificate/:employeeId" },
  { id: "meeting-minutes", title: "Majlis bayoni", icon: "📝", endpoint: "/documents/meeting-minutes/:meetingId" },
  { id: "order", title: "Buyruq yaratish", icon: "📜", endpoint: "/documents/order", adminOnly: true },
];

export default function DocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthStore();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (doc: DocumentType) => {
    if (doc.adminOnly && user?.role !== "SUPER_ADMIN") return;

    setDownloading(doc.id);
    try {
      let url = doc.endpoint;

      if (doc.id === "my-attendance") {
        const res = await api.get("/users/profile");
        const employeeId = res.data?.employeeId;
        if (!employeeId) return;
        url = `/documents/attendance-certificate/${employeeId}`;
      } else if (doc.id === "meeting-minutes") {
        setDownloading(null);
        return;
      } else if (doc.id === "order") {
        navigation.navigate("CreateOrder");
        setDownloading(null);
        return;
      }

      const response = await api.get(url, { responseType: "arraybuffer" });
      const fileName = `${doc.id}_${Date.now()}.pdf`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      const base64 = arrayBufferToBase64(response.data);
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
      }
    } catch (err: any) {
      captureError(err, { context: "document_download" });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View style={styles.container}>
      {DOCUMENTS.map((doc) => (
        <ThemedCard key={doc.id} onPress={() => handleDownload(doc)} disabled={downloading === doc.id}>
          <View style={styles.docRow}>
            <Text style={styles.docIcon}>{doc.icon}</Text>
            <View style={styles.docInfo}>
              <Text style={styles.docTitle}>{doc.title}</Text>
              <Badge
                label={doc.adminOnly ? "Admin" : "Barcha xodimlar"}
                variant={doc.adminOnly ? "info" : "default"}
                size="sm"
              />
            </View>
            {downloading === doc.id ? (
              <LoadingSpinner size="small" />
            ) : (
              <Text style={styles.downloadIcon}>↓</Text>
            )}
          </View>
        </ThemedCard>
      ))}
    </View>
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 16 },
  docRow: { flexDirection: "row", alignItems: "center" },
  docIcon: { fontSize: 32, marginRight: 16 },
  docInfo: { flex: 1 },
  docTitle: { color: "#fff", fontSize: 16, fontWeight: "500", marginBottom: 4 },
  downloadIcon: { color: "#1a73e8", fontSize: 24 },
});
