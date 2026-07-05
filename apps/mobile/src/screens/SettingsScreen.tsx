import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import ThemedCard from "../components/ThemedCard";
import Badge from "../components/Badge";

type Language = "uz" | "ru" | "en";
type Theme = "system" | "light" | "dark";
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "uz", label: "O'zbek", native: "O'zbek tili" },
  { code: "ru", label: "Русский", native: "Русский язык" },
  { code: "en", label: "English", native: "English" },
];

const THEMES: { code: Theme; label: string }[] = [
  { code: "system", label: "Tizim bilan" },
  { code: "light", label: "Yorug'" },
  { code: "dark", label: "Qorong'i" },
];

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, updatePreferences } = useAuthStore();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    (user?.languagePreference as Language) || "uz"
  );
  const [selectedTheme, setSelectedTheme] = useState<Theme>(
    (user?.themePreference as Theme) || "system"
  );
  const [saving, setSaving] = useState(false);

  const handleSaveLanguage = async (lang: Language) => {
    setSaving(true);
    try {
      await api.put("/users/preferences", { languagePreference: lang, themePreference: selectedTheme });
      updatePreferences({ languagePreference: lang, themePreference: selectedTheme });
      setSelectedLanguage(lang);
    } catch {} finally { setSaving(false); }
  };

  const handleSaveTheme = async (theme: Theme) => {
    setSaving(true);
    try {
      await api.put("/users/preferences", { languagePreference: selectedLanguage, themePreference: theme });
      updatePreferences({ languagePreference: selectedLanguage, themePreference: theme });
      setSelectedTheme(theme);
    } catch {} finally { setSaving(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedCard title="Til sozlamalari">
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles.option, selectedLanguage === lang.code && styles.optionSelected]}
            onPress={() => handleSaveLanguage(lang.code)}
            disabled={saving}
          >
            <View>
              <Text style={[styles.optionLabel, selectedLanguage === lang.code && styles.optionLabelSelected]}>
                {lang.label}
              </Text>
              <Text style={styles.optionSub}>{lang.native}</Text>
            </View>
            {selectedLanguage === lang.code && <Badge label="Faol" variant="success" size="sm" />}
          </TouchableOpacity>
        ))}
      </ThemedCard>

      <ThemedCard title="Mavzu sozlamalari">
        {THEMES.map((theme) => (
          <TouchableOpacity
            key={theme.code}
            style={[styles.option, selectedTheme === theme.code && styles.optionSelected]}
            onPress={() => handleSaveTheme(theme.code)}
            disabled={saving}
          >
            <Text style={[styles.optionLabel, selectedTheme === theme.code && styles.optionLabelSelected]}>
              {theme.label}
            </Text>
            {selectedTheme === theme.code && <Badge label="Faol" variant="success" size="sm" />}
          </TouchableOpacity>
        ))}
      </ThemedCard>

      <ThemedCard title="Xavfsizlik">
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("TwoFactorSetup")}>
          <Text style={styles.optionLabel}>Ikki bosqichli autentifikatsiya</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("SessionManagement")}>
          <Text style={styles.optionLabel}>Faol sessiyalar</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </ThemedCard>

      <ThemedCard title="Ilova haqida">
        <View style={styles.option}>
          <Text style={styles.optionLabel}>Versiya</Text>
          <Text style={styles.optionValue}>1.0.0 (1)</Text>
        </View>
      </ThemedCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e", padding: 16, paddingTop: 60 },
  option: {
    backgroundColor: "#0f3460", borderRadius: 10, padding: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
  },
  optionSelected: { borderColor: "#2ecc71", borderWidth: 1 },
  optionLabel: { color: "#fff", fontSize: 16 },
  optionLabelSelected: { color: "#2ecc71" },
  optionSub: { color: "#8899aa", fontSize: 13, marginTop: 2 },
  optionValue: { color: "#8899aa", fontSize: 14 },
  arrow: { color: "#8899aa", fontSize: 18 },
});
