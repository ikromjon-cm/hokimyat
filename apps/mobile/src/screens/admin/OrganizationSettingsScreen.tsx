import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, Switch, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import ThemedCard from "../../components/ThemedCard";
import ThemedButton from "../../components/ThemedButton";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function OrganizationSettingsScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: org, isLoading } = useQuery({
    queryKey: ["organization", user?.organization?.id],
    queryFn: () => api.get(`/organizations/${user?.organization?.id}`).then((r) => r.data),
    enabled: !!user?.organization?.id,
  });

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [geofenceRadius, setGeofenceRadius] = useState("");
  const [wifiSSID, setWifiSSID] = useState("");
  const [allowSelfie, setAllowSelfie] = useState(true);
  const [requireWiFi, setRequireWiFi] = useState(false);

  useEffect(() => {
    if (org) {
      setLatitude(String(org.latitude || ""));
      setLongitude(String(org.longitude || ""));
      setGeofenceRadius(String(org.geofenceRadius || "100"));
      setWifiSSID(org.wifiSSID || "");
      if (org.settings) {
        setAllowSelfie(org.settings.allowSelfieCapture ?? true);
        setRequireWiFi(org.settings.requireWiFiMatch ?? false);
      }
    }
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/organizations/${user?.organization?.id}`, {
        latitude: parseFloat(latitude) || null, longitude: parseFloat(longitude) || null,
        geofenceRadius: parseInt(geofenceRadius) || 100, wifiSSID: wifiSSID || null,
      });
      await api.put(`/organizations/${user?.organization?.id}/settings`, {
        allowSelfieCapture: allowSelfie, requireWiFiMatch: requireWiFi,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      Alert.alert("Muvaffaqiyatli", "Sozlamalar saqlandi");
    },
    onError: (error: any) => {
      Alert.alert("Xatolik", error.response?.data?.error?.message || "Xatolik yuz berdi");
    },
  });

  if (isLoading) return <LoadingSpinner fullScreen message="Yuklanmoqda..." />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{org?.name || "Tashkilot"}</Text>
        <Text style={styles.subtitle}>Tashkilot sozlamalari</Text>
      </View>

      <ThemedCard title="Geofence sozlamalari">
        <Text style={styles.label}>Kenglik (latitude)</Text>
        <TextInput style={styles.input} value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="41.311081" placeholderTextColor="#556677" />

        <Text style={styles.label}>Uzunlik (longitude)</Text>
        <TextInput style={styles.input} value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="69.279737" placeholderTextColor="#556677" />

        <Text style={styles.label}>Geofence radiusi (metr)</Text>
        <TextInput style={styles.input} value={geofenceRadius} onChangeText={setGeofenceRadius} keyboardType="number-pad" placeholder="100" placeholderTextColor="#556677" />

        <Text style={styles.label}>Ofis WiFi SSID</Text>
        <TextInput style={styles.input} value={wifiSSID} onChangeText={setWifiSSID} placeholder="UM_OFFICE" placeholderTextColor="#556677" autoCapitalize="characters" />
      </ThemedCard>

      <ThemedCard title="Davomat sozlamalari">
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Selfi suratga olish</Text>
          <Switch value={allowSelfie} onValueChange={setAllowSelfie} trackColor={{ false: "#0f3460", true: "#1a73e8" }} thumbColor={allowSelfie ? "#fff" : "#556677"} />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>WiFi mosligini talab qilish</Text>
          <Switch value={requireWiFi} onValueChange={setRequireWiFi} trackColor={{ false: "#0f3460", true: "#1a73e8" }} thumbColor={requireWiFi ? "#fff" : "#556677"} />
        </View>
      </ThemedCard>

      <ThemedButton title={updateMutation.isPending ? "Saqlanmoqda..." : "Sozlamalarni saqlash"} onPress={() => updateMutation.mutate()} loading={updateMutation.isPending} fullWidth style={{ margin: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  subtitle: { fontSize: 14, color: "#8899aa", marginTop: 4 },
  label: { color: "#8899aa", fontSize: 13, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#0f3460", borderRadius: 10, padding: 14, color: "#fff", fontSize: 15 },
  switchRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#0f3460",
  },
  switchLabel: { color: "#fff", fontSize: 15, flex: 1 },
});
