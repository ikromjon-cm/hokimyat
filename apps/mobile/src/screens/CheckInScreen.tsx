import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Image, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as Network from "expo-network";
import NetInfo from "@react-native-community/netinfo";
import { useMutation } from "@tanstack/react-query";
import { api } from "../services/api";
import { addToQueue } from "../services/offlineQueue";
import { parseApiError } from "../services/errorHandler";
import { calculateDistance } from "../utils/haversine";
import { useOrganizationStore } from "../store/organizationStore";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CheckInScreen() {
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);
  const [, requestCameraPermission] = useCameraPermissions();
  const orgLocation = useOrganizationStore((s) => s.location);
  const geofenceRadius = useOrganizationStore((s) => s.geofenceRadius);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState(false);
  const [wifiSSID, setWifiSSID] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState<"permissions" | "location" | "photo" | "submit" | "complete">("permissions");

  const checkInMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post("/attendance/check-in", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 60000,
      });
      return response.data;
    },
    onSuccess: () => {
      setStep("complete");
      setTimeout(() => navigation.goBack(), 1500);
    },
    onError: (error: any) => {
      Alert.alert("Xatolik", parseApiError(error).message);
    },
  });

  const requestPermissions = useCallback(async () => {
    try {
      const cam = await requestCameraPermission();
      if (!cam.granted) {
        Alert.alert("Xatolik", "Kamera ruxsati talab qilinadi");
        return;
      }

      const loc = await Location.requestForegroundPermissionsAsync();
      if (!loc.granted) {
        Alert.alert("Xatolik", "Lokatsiya ruxsati talab qilinadi");
        return;
      }

      setStep("location");
      await getLocation();
    } catch (error: any) {
      Alert.alert("Xatolik", error.message);
    }
  }, []);

  const getLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(loc);

      if (loc.mocked) {
        Alert.alert(
          "Soxta lokatsiya aniqlandi",
          "Iltimos, soxta lokatsiyadan foydalanmang va real joylashuvingizni yoqing"
        );
        setStep("permissions");
        return;
      }

      const officeLat = orgLocation?.latitude || 41.311081;
      const officeLon = orgLocation?.longitude || 69.279737;
      const radius = geofenceRadius || 100;

      const dist = calculateDistance(
        loc.coords.latitude, loc.coords.longitude, officeLat, officeLon
      );
      setDistance(dist);

      const inside = dist <= radius;
      setIsInsideGeofence(inside);

      if (!inside) {
        Alert.alert(
          "Masofa cheklovi",
          `Siz ish joyidan ${Math.round(dist)} metr uzoqdasiz.\nIltimos, ish joyiga yaqinlashing.`
        );
        setStep("permissions");
        return;
      }

      // TZ Layer 3: read the connected Wi-Fi SSID (best effort) so the server
      // can match it against the office SSID and raise the confidence level.
      try {
        const net = await NetInfo.fetch();
        const ssid = net.type === "wifi" ? (net.details as any)?.ssid : null;
        setWifiSSID(ssid && ssid !== "<unknown ssid>" ? ssid : null);
      } catch {
        setWifiSSID(null);
      }

      setStep("photo");
    } catch (error: any) {
      Alert.alert("Xatolik", "Lokatsiyani aniqlab bo'lmadi: " + error.message);
      setStep("permissions");
    }
  };

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (picture?.uri) {
        setPhoto(picture.uri);
        setStep("submit");
      }
    } catch (error: any) {
      Alert.alert("Xatolik", "Suratga olishda xatolik: " + error.message);
    }
  }, []);

  const handleSubmit = async () => {
    if (!photo || !location) return;

    const isConnected = (await Network.getNetworkStateAsync()).isConnected ?? false;
    const queueData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      mockLocation: location.mocked,
      wifiSSID: wifiSSID || "",
      deviceInfo: JSON.stringify({
        platform: Platform.OS, mocked: location.mocked, timestamp: new Date().toISOString(),
      }),
    };

    if (!isConnected) {
      await addToQueue({ type: "CHECK_IN", data: queueData });
      setStep("complete");
      return;
    }

    const formData = new FormData();
    formData.append("latitude", String(queueData.latitude));
    formData.append("longitude", String(queueData.longitude));
    formData.append("mockLocation", String(queueData.mockLocation));
    formData.append("wifiSSID", queueData.wifiSSID);
    formData.append("deviceInfo", queueData.deviceInfo);

    const filename = `selfie_${Date.now()}.jpg`;
    formData.append("selfie", { uri: photo, type: "image/jpeg", name: filename } as any);

    checkInMutation.mutate(formData);
  };

  if (step === "permissions") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kirishni boshlash</Text>
        <Text style={styles.subtitle}>
          Kirishni qayd etish uchun kamera va lokatsiya ruxsatlari talab qilinadi
        </Text>
        <ThemedButton
          title="Ruxsatlarni yoqish"
          onPress={requestPermissions}
          fullWidth
        />
      </View>
    );
  }

  if (step === "location") {
    return <LoadingSpinner fullScreen message="Joylashuv tekshirilmoqda..." />;
  }

  if (step === "photo") {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>Selfi suratga oling</Text>
            <View style={styles.cameraFrame}>
              <View style={styles.cameraFrameCircle} />
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === "submit" && distance !== null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ma'lumotlarni tekshirish</Text>

        <ThemedCard>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Masofa</Text>
            <Text style={[styles.infoValue, !isInsideGeofence && styles.warning]}>
              {Math.round(distance)} m
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>WiFi SSID</Text>
            <Text style={styles.infoValue}>{wifiSSID || "Aniqlanmadi"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kenglik</Text>
            <Text style={styles.infoValue}>{location?.coords.latitude.toFixed(6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Uzunlik</Text>
            <Text style={styles.infoValue}>{location?.coords.longitude.toFixed(6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Soxta lokatsiya</Text>
            <Text style={[styles.infoValue, location?.mocked && styles.warning]}>
              {location?.mocked ? "Ha" : "Yo'q"}
            </Text>
          </View>
        </ThemedCard>

        {photo && <Image source={{ uri: photo }} style={styles.selfiePreview} />}

        <ThemedButton
          title="Kirishni tasdiqlash"
          onPress={handleSubmit}
          loading={checkInMutation.isPending}
          fullWidth
          variant="primary"
        />
      </View>
    );
  }

  if (step === "complete") {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.title}>Kirish qayd etildi</Text>
        <Text style={styles.subtitle}>Xush kelibsiz!</Text>
      </View>
    );
  }

  return <LoadingSpinner fullScreen message="Tekshirilmoqda..." />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", padding: 24 },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#8899aa", textAlign: "center", marginBottom: 24 },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1, justifyContent: "space-between", alignItems: "center",
    paddingVertical: 60, backgroundColor: "rgba(0,0,0,0.3)",
  },
  cameraTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  cameraFrame: {
    width: 250, height: 250, borderRadius: 125,
    borderWidth: 3, borderColor: "rgba(255,255,255,0.6)",
    justifyContent: "center", alignItems: "center",
  },
  cameraFrameCircle: {
    width: 240, height: 240, borderRadius: 120,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  captureButton: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 4, borderColor: "#fff",
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff" },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#0f3460",
  },
  infoLabel: { color: "#8899aa", fontSize: 14 },
  infoValue: { color: "#fff", fontSize: 14, fontWeight: "500" },
  warning: { color: "#e74c3c" },
  selfiePreview: {
    width: 120, height: 120, borderRadius: 60,
    marginBottom: 16, borderWidth: 2, borderColor: "#2ecc71",
  },
  successIcon: { fontSize: 72, color: "#2ecc71", marginBottom: 16 },
});
