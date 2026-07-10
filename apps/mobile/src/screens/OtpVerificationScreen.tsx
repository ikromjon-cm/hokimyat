import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../hooks/useAuth";
import { useTheme, ThemeColors } from "../theme/ThemeProvider";
import ThemedButton from "../components/ThemedButton";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "OtpVerification">;
type RouteType = RouteProp<RootStackParamList, "OtpVerification">;

export default function OtpVerificationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { phone, devCode: initialDevCode } = route.params;
  const { verifyOtp, requestOtp, isLoading } = useAuth();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [demoCode, setDemoCode] = useState<string | undefined>(initialDevCode);
  const [timer, setTimer] = useState(300);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    if (demoCode && /^\d{6}$/.test(demoCode)) setCode(demoCode.split(""));
  }, [demoCode]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && text) handleVerify(newCode.join(""));
  };

  const handleVerify = async (otpCode?: string) => {
    const finalCode = otpCode || code.join("");
    if (finalCode.length !== 6) return;
    const result = await verifyOtp(phone, finalCode, { deviceId: "mobile-" + Date.now() });
    if (!result.success) Alert.alert("Xatolik", result.message || "Xatolik yuz berdi");
  };

  const handleResend = async () => {
    const result = await requestOtp(phone);
    if (result.success) {
      setTimer(300);
      setCode(["", "", "", "", "", ""]);
      if (result.devCode) {
        setDemoCode(result.devCode);
        Alert.alert("Yangi kod", "Yangi tasdiqlash kodi avtomatik to'ldirildi");
      } else {
        setDemoCode(undefined);
        inputRefs.current[0]?.focus();
        Alert.alert("Yuborildi", "Yangi kod SMS orqali yuborildi");
      }
    } else {
      Alert.alert("Xatolik", "Kodni qayta yuborib bo'lmadi");
    }
  };

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasdiqlash kodi</Text>
      <Text style={styles.subtitle}>
        {demoCode ? "Tasdiqlash kodi avtomatik to'ldirildi" : `${phone} raqamiga SMS orqali kod yuborildi`}
      </Text>

      {demoCode ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoLabel}>TASDIQLASH KODI</Text>
          <Text style={styles.demoCode}>{demoCode}</Text>
          <Text style={styles.demoHint}>«Tasdiqlash» tugmasini bosing</Text>
        </View>
      ) : null}

      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
            value={digit}
            onChangeText={(text) => handleCodeChange(text, index)}
            keyboardType="number-pad"
            maxLength={1}
            editable={!isLoading}
          />
        ))}
      </View>

      <ThemedButton title="Tasdiqlash" onPress={() => handleVerify()} loading={isLoading} disabled={code.join("").length !== 6} fullWidth />
      <ThemedButton
        title={timer > 0 ? `Kodni qayta yuborish (${minutes}:${seconds.toString().padStart(2, "0")})` : "Kodni qayta yuborish"}
        onPress={handleResend}
        disabled={timer > 0}
        variant="outline"
        fullWidth
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: c.textPrimary, textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: c.textSecondary, textAlign: "center", marginBottom: 24 },
  demoBanner: { backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.primary, paddingVertical: 16, paddingHorizontal: 20, alignItems: "center", marginBottom: 24 },
  demoLabel: { fontSize: 11, color: c.primary, fontWeight: "700", letterSpacing: 2 },
  demoCode: { fontSize: 32, color: c.textPrimary, fontWeight: "bold", letterSpacing: 8, marginTop: 4 },
  demoHint: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
  codeContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  codeInput: { width: 48, height: 56, backgroundColor: c.surfaceAlt, borderRadius: 12, textAlign: "center", fontSize: 24, color: c.textPrimary, fontWeight: "bold", borderWidth: 1, borderColor: c.border },
  codeInputFilled: { borderColor: c.primary, borderWidth: 2 },
});
