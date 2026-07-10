import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { z } from "zod";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../hooks/useAuth";
import { useTheme, ThemeColors } from "../theme/ThemeProvider";
import ThemedButton from "../components/ThemedButton";
import ThemedCard from "../components/ThemedCard";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

const phoneSchema = z.string().regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [phone, setPhone] = useState("+998");
  const { requestOtp, isLoading } = useAuth();

  const handleRequestOtp = async () => {
    try {
      phoneSchema.parse(phone);
    } catch {
      Alert.alert("Xatolik", "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");
      return;
    }
    const result = await requestOtp(phone);
    if (result.success) {
      navigation.navigate("OtpVerification", { phone, devCode: result.devCode });
    } else {
      Alert.alert("Xatolik", result.message || "Xatolik yuz berdi");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.header}>
        <Text style={styles.logo}>UYCHI MAJLIS</Text>
        <Text style={styles.subtitle}>Hukumat ichki tizimi</Text>
      </View>

      <ThemedCard>
        <Text style={styles.label}>Telefon raqam</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+998901234567"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          autoFocus
          editable={!isLoading}
        />
        <ThemedButton title="Kodni olish" onPress={handleRequestOtp} loading={isLoading} fullWidth />
      </ThemedCard>

      <Text style={styles.footer}>Tizimga kirish orqali siz foydalanish shartlariga rozilik bildirasiz</Text>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 48 },
  logo: { fontSize: 32, fontWeight: "bold", color: c.textPrimary, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: c.textSecondary, marginTop: 8 },
  label: { fontSize: 14, color: c.textSecondary, marginBottom: 8 },
  input: { backgroundColor: c.surfaceAlt, borderRadius: 12, padding: 16, fontSize: 18, color: c.textPrimary, marginBottom: 16, textAlign: "center" },
  footer: { color: c.textMuted, fontSize: 12, textAlign: "center", marginTop: 32 },
});
