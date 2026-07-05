import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { api } from "../services/api";
import { captureError } from "../services/sentry";
import ThemedButton from "../components/ThemedButton";
import LoadingSpinner from "../components/LoadingSpinner";

export default function QRScannerScreen() {
  const navigation = useNavigation();
  const [, requestCameraPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { initCamera(); }, []);

  const initCamera = async () => {
    const { granted } = await requestCameraPermission();
    setHasPermission(granted);
    if (!granted) {
      Alert.alert("Xatolik", "Kamera ruxsati talab qilinadi", [
        { text: "Orqaga", onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (!scanning || processing) return;
    setScanning(false);
    setProcessing(true);

    try {
      let token = data;
      if (data.startsWith("http")) {
        const url = new URL(data);
        token = url.searchParams.get("token") || data;
      }

      await api.post("/meetings/scan-qr", { token });
      Alert.alert("Muvaffaqiyatli", "Qatnashishingiz tasdiqlandi");
      setTimeout(() => navigation.goBack(), 1500);
    } catch (err: any) {
      captureError(err, { context: "qr_scan" });
      Alert.alert("Xatolik", err.response?.data?.error?.message || "QR kod yaroqsiz", [
        { text: "Qayta skanerlash", onPress: () => { setScanning(true); setProcessing(false); } },
        { text: "Bekor qilish", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setProcessing(false);
    }
  }, [scanning, processing]);

  if (hasPermission === null) {
    return <LoadingSpinner fullScreen message="Kamera ruxsati so'ralmoqda..." />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.title}>Kamera ruxsati yo'q</Text>
        <Text style={styles.text}>QR kodni skanerlash uchun kamera ruxsati talab qilinadi</Text>
        <ThemedButton title="Orqaga" onPress={() => navigation.goBack()} fullWidth />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      >
        <View style={styles.overlay}>
          <View style={styles.frame}>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <Text style={styles.hint}>QR kodni ramka ichiga joylashtiring</Text>

          {processing && (
            <View style={styles.processingOverlay}>
              <LoadingSpinner message="Tekshirilmoqda..." />
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  frame: { width: 250, height: 250, position: "relative" },
  cornerTL: {
    position: "absolute", top: 0, left: 0, width: 40, height: 40,
    borderTopWidth: 4, borderLeftWidth: 4, borderColor: "#2ecc71",
  },
  cornerTR: {
    position: "absolute", top: 0, right: 0, width: 40, height: 40,
    borderTopWidth: 4, borderRightWidth: 4, borderColor: "#2ecc71",
  },
  cornerBL: {
    position: "absolute", bottom: 0, left: 0, width: 40, height: 40,
    borderBottomWidth: 4, borderLeftWidth: 4, borderColor: "#2ecc71",
  },
  cornerBR: {
    position: "absolute", bottom: 0, right: 0, width: 40, height: 40,
    borderBottomWidth: 4, borderRightWidth: 4, borderColor: "#2ecc71",
  },
  hint: { color: "#fff", fontSize: 14, marginTop: 32, textAlign: "center" },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", alignItems: "center",
  },
  cancelButton: { position: "absolute", bottom: 60, padding: 16 },
  cancelText: { color: "#fff", fontSize: 16 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  text: { color: "#8899aa", fontSize: 14, marginBottom: 24, textAlign: "center", paddingHorizontal: 24 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
});
