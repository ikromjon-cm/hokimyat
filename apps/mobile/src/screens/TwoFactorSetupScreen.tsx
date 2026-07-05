import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, ScrollView, Alert,
} from "react-native";
import { api } from "../services/api";
import ThemedButton from "../components/ThemedButton";

type Step = "initial" | "show_secret" | "verify" | "done";

export default function TwoFactorSetupScreen() {
  const [step, setStep] = useState<Step>("initial");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { checkStatus(); }, []);

  const checkStatus = async () => {
    try {
      const res = await api.get("/two-factor/status");
      setEnabled(res.data.enabled);
      if (res.data.enabled) setStep("done");
    } catch {}
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const res = await api.post("/two-factor/enable");
      setSecret(res.data.secret);
      setBackupCodes(res.data.backupCodes || []);
      setStep("show_secret");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (token.length !== 6) return;
    setVerifying(true);
    try {
      await api.post("/two-factor/verify", { token });
      setStep("done");
      setEnabled(true);
    } catch {
      Alert.alert("Xatolik", "Yaroqsiz kod");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = () => {
    Alert.alert("2FA o'chirish", "Haqiqatan ham ikki bosqichli autentifikatsiyani o'chirmoqchimisiz?", [
      { text: "Bekor qilish", style: "cancel" },
      {
        text: "O'chirish", style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await api.post("/two-factor/disable", { token: backupCodes[0] || "" });
            setEnabled(false);
            setStep("initial");
          } catch {
            // silent
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  if (step === "done") {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.title}>2FA yoqilgan</Text>
        <Text style={styles.subtitle}>Ikki bosqichli autentifikatsiya faol</Text>
        <ThemedButton title="2FA o'chirish" onPress={handleDisable} variant="danger" loading={loading} fullWidth />
      </View>
    );
  }

  if (step === "show_secret") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Maxfiy kalit</Text>
        <Text style={styles.subtitle}>Ushbu kalitni Google Authenticator yoki Authy ilovasiga qo'shing</Text>

        <View style={styles.secretBox}>
          <Text style={styles.secretText}>{secret}</Text>
        </View>

        <Text style={styles.stepTitle}>Zaxira kodlari</Text>
        <Text style={styles.subtitle}>Ushbu kodlarni xavfsiz joyda saqlang. Har bir kod faqat bir marta ishlatiladi.</Text>

        <View style={styles.codesContainer}>
          {backupCodes.map((code, i) => (
            <View key={i} style={styles.codeBox}>
              <Text style={styles.codeText}>{code}</Text>
            </View>
          ))}
        </View>

        <ThemedButton title="Davom etish" onPress={() => setStep("verify")} fullWidth />
      </ScrollView>
    );
  }

  if (step === "verify") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Kodni tasdiqlash</Text>
        <Text style={styles.subtitle}>Authenticator ilovasidagi 6 xonali kodni kiriting</Text>

        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor="#555"
        />

        <ThemedButton
          title={verifying ? "Tekshirilmoqda..." : "Tasdiqlash"}
          onPress={handleVerify}
          loading={verifying}
          disabled={token.length !== 6}
          fullWidth
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ikki bosqichli autentifikatsiya</Text>
      <Text style={styles.subtitle}>
        2FA yoqilganda, tizimga kirish uchun telefon raqam va OTP koddan tashqari,
        authenticator ilovasidagi kod ham talab qilinadi.
      </Text>

      <ThemedButton title="2FA yoqish" onPress={handleEnable} loading={loading} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", justifyContent: "center", alignItems: "center", padding: 24 },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 8, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#8899aa", textAlign: "center", marginBottom: 24, lineHeight: 20 },
  stepTitle: { fontSize: 16, fontWeight: "600", color: "#fff", marginTop: 20, marginBottom: 8 },
  secretBox: { backgroundColor: "#0f3460", borderRadius: 12, padding: 20, width: "100%", marginBottom: 16 },
  secretText: { fontSize: 14, color: "#2ecc71", fontFamily: "monospace", textAlign: "center", letterSpacing: 2 },
  codesContainer: { width: "100%", marginBottom: 20 },
  codeBox: { backgroundColor: "#16213e", borderRadius: 8, padding: 12, marginBottom: 6 },
  codeText: { fontSize: 14, color: "#fff", fontFamily: "monospace", textAlign: "center", letterSpacing: 3 },
  input: {
    backgroundColor: "#16213e", borderRadius: 12, padding: 16, fontSize: 24,
    color: "#fff", textAlign: "center", fontWeight: "bold", letterSpacing: 8,
    width: "100%", marginBottom: 16,
  },
  successIcon: { fontSize: 72, color: "#2ecc71", marginBottom: 16 },
});
