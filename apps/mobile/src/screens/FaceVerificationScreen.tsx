import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { api } from "../services/api";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";

type Step = "menu" | "upload" | "verify" | "result";

export default function FaceVerificationScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [, requestCameraPermission] = useCameraPermissions();

  const [step, setStep] = useState<Step>("menu");
  const [loading, setLoading] = useState(false);
  const [hasReference, setHasReference] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<{ verified: boolean; confidence: number; reason?: string } | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/face/status");
      setHasReference(res.data.hasReferencePhoto);
    } catch {
      Alert.alert("Xatolik", "Holatni tekshirib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const openCamera = async (mode: "upload" | "verify") => {
    const cam = await requestCameraPermission();
    if (!cam.granted) {
      Alert.alert("Xatolik", "Kamera ruxsati talab qilinadi");
      return;
    }
    setStep(mode);
    setPhoto(null);
    setResult(null);
  };

  const takePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (picture?.uri) setPhoto(picture.uri);
    } catch {
      Alert.alert("Xatolik", "Suratga olishda xatolik");
    }
  }, []);

  const handleUploadReference = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", { uri: photo, type: "image/jpeg", name: "reference.jpg" } as any);
      await api.post("/face/reference-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Alert.alert("Muvaffaqiyatli", "Malumot uchun rasm saqlandi");
      setStep("menu");
      setHasReference(true);
    } catch {
      Alert.alert("Xatolik", "Saqlab bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("selfie", { uri: photo, type: "image/jpeg", name: "selfie.jpg" } as any);
      const res = await api.post("/face/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setStep("result");
    } catch {
      Alert.alert("Xatolik", "Tekshirib bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  if (step === "upload" || step === "verify") {
    if (photo) {
      return (
        <View style={styles.container}>
          <Image source={{ uri: photo }} style={styles.preview} />
          <ThemedButton
            title={step === "upload" ? "Rasmni saqlash" : "Tekshirish"}
            onPress={step === "upload" ? handleUploadReference : handleVerify}
            loading={loading}
            fullWidth
          />
          <ThemedButton title="Qayta olish" onPress={() => setPhoto(null)} variant="outline" fullWidth style={{ marginTop: 12 }} />
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front">
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraTitle}>
              {step === "upload" ? "Malumot rasmini oling" : "Selfi oling"}
            </Text>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  if (step === "result" && result) {
    return (
      <View style={styles.container}>
        <Text style={result.verified ? styles.successIcon : styles.failIcon}>
          {result.verified ? "✓" : "✗"}
        </Text>
        <Text style={styles.title}>
          {result.verified ? "Yuz mos keldi" : "Yuz mos kelmadi"}
        </Text>
        <Text style={styles.confidence}>Moslik: {(result.confidence * 100).toFixed(1)}%</Text>
        {result.reason && <Text style={styles.reason}>{result.reason}</Text>}
        <ThemedButton title="Asosiy menyu" onPress={() => setStep("menu")} fullWidth />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yuzni tekshirish</Text>
      <Text style={styles.subtitle}>Yuzni tekshirish orqali davomatni mustahkamlash</Text>

      <ThemedCard onPress={() => { checkStatus(); openCamera("upload"); }}>
        <Text style={styles.menuIcon}>📸</Text>
        <Text style={styles.menuText}>Malumot rasmini yuklash</Text>
        <Text style={styles.menuDesc}>Bir marta yuklanadi, keyin tekshirish uchun ishlatiladi</Text>
      </ThemedCard>

      <ThemedCard
        onPress={() => openCamera("verify")}
        style={hasReference === false ? { opacity: 0.5 } : undefined}
      >
        <Text style={styles.menuIcon}>🔍</Text>
        <Text style={styles.menuText}>Selfi tekshirish</Text>
        <Text style={styles.menuDesc}>Yuzingizni malumot rasmi bilan solishtirish</Text>
      </ThemedCard>

      <ThemedButton
        title={loading ? "Tekshirilmoqda..." : hasReference === true ? "✓ Malumot rasmi bor" : hasReference === false ? "✗ Malumot rasmi yo'q" : "Holatni tekshirish"}
        onPress={checkStatus}
        loading={loading}
        variant="outline"
        fullWidth
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#8899aa", textAlign: "center", marginBottom: 32, lineHeight: 20 },
  menuIcon: { fontSize: 32, marginBottom: 8 },
  menuText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  menuDesc: { color: "#8899aa", fontSize: 13, marginTop: 4 },
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1, justifyContent: "flex-end", alignItems: "center",
    paddingBottom: 60, backgroundColor: "rgba(0,0,0,0.3)",
  },
  cameraTitle: { color: "#fff", fontSize: 18, fontWeight: "600", marginBottom: 40 },
  captureButton: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center", alignItems: "center", borderWidth: 4, borderColor: "#fff",
  },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff" },
  preview: { width: 250, height: 250, borderRadius: 16, marginBottom: 24 },
  successIcon: { fontSize: 72, color: "#2ecc71", marginBottom: 16 },
  failIcon: { fontSize: 72, color: "#e74c3c", marginBottom: 16 },
  confidence: { color: "#fff", fontSize: 18, marginBottom: 8 },
  reason: { color: "#e74c3c", fontSize: 14, textAlign: "center", marginBottom: 16 },
});
