import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { api } from "../services/api";
import { useTheme, ThemeColors } from "../theme/ThemeProvider";
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
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user, updatePreferences } = useAuthStore();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>((user?.languagePreference as Language) || "uz");
  const [selectedTheme, setSelectedTheme] = useState<Theme>((user?.themePreference as Theme) || "system");
  const [saving, setSaving] = useState(false);

  const save = async (lang: Language, theme: Theme) => {
    setSaving(true);
    try {
      await updatePreferences({ languagePreference: lang, themePreference: theme });
      api.put("/users/preferences", { languagePreference: lang, themePreference: theme }).catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const onLanguage = (lang: Language) => { setSelectedLanguage(lang); save(lang, selectedTheme); };
  const onTheme = (theme: Theme) => { setSelectedTheme(theme); save(selectedLanguage, theme); };

  return (
    <ScrollView style={styles.container}>
      <ThemedCard title="Til sozlamalari">
        {LANGUAGES.map((lang) => (
          <TouchableOpacity key={lang.code} style={[styles.option, selectedLanguage === lang.code && styles.optionSelected]} onPress={() => onLanguage(lang.code)} disabled={saving}>
            <View>
              <Text style={[styles.optionLabel, selectedLanguage === lang.code && styles.optionLabelSelected]}>{lang.label}</Text>
              <Text style={styles.optionSub}>{lang.native}</Text>
            </View>
            {selectedLanguage === lang.code && <Badge label="Faol" variant="success" size="sm" />}
          </TouchableOpacity>
        ))}
      </ThemedCard>

      <ThemedCard title="Mavzu sozlamalari">
        {THEMES.map((theme) => (
          <TouchableOpacity key={theme.code} style={[styles.option, selectedTheme === theme.code && styles.optionSelected]} onPress={() => onTheme(theme.code)} disabled={saving}>
            <Text style={[styles.optionLabel, selectedTheme === theme.code && styles.optionLabelSelected]}>{theme.label}</Text>
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.bg, padding: 16, paddingTop: 60 },
  option: { backgroundColor: c.surfaceAlt, borderRadius: 10, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, borderWidth: 1, borderColor: "transparent" },
  optionSelected: { borderColor: c.success },
  optionLabel: { color: c.textPrimary, fontSize: 16 },
  optionLabelSelected: { color: c.success, fontWeight: "600" },
  optionSub: { color: c.textSecondary, fontSize: 13, marginTop: 2 },
  optionValue: { color: c.textSecondary, fontSize: 14 },
  arrow: { color: c.textSecondary, fontSize: 18 },
});
