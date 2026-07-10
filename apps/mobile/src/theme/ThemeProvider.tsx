import React, { createContext, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { useAuthStore } from "../store/authStore";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  danger: string;
  warning: string;
  tabBar: string;
}

export const darkColors: ThemeColors = {
  bg: "#1a1a2e",
  surface: "#16213e",
  surfaceAlt: "#0f3460",
  border: "#243b6b",
  textPrimary: "#ffffff",
  textSecondary: "#8899aa",
  textMuted: "#556677",
  primary: "#4d8bf0",
  primarySoft: "#1e2a4d",
  onPrimary: "#ffffff",
  success: "#2ecc71",
  danger: "#e74c3c",
  warning: "#ffd166",
  tabBar: "#16213e",
};

export const lightColors: ThemeColors = {
  bg: "#f3f5fb",
  surface: "#ffffff",
  surfaceAlt: "#eef2fa",
  border: "#e1e6f0",
  textPrimary: "#141a2e",
  textSecondary: "#5b6478",
  textMuted: "#98a1b5",
  primary: "#1a73e8",
  primarySoft: "#e7f0fd",
  onPrimary: "#ffffff",
  success: "#12934e",
  danger: "#e11d48",
  warning: "#d97706",
  tabBar: "#ffffff",
};

type Scheme = "light" | "dark";

interface ThemeCtx {
  colors: ThemeColors;
  scheme: Scheme;
}

const ThemeContext = createContext<ThemeCtx>({ colors: darkColors, scheme: "dark" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const pref = useAuthStore((s) => s.user?.themePreference) || "system";

  const scheme: Scheme = pref === "light" ? "light" : pref === "dark" ? "dark" : system === "light" ? "light" : "dark";
  const value = useMemo<ThemeCtx>(
    () => ({ colors: scheme === "light" ? lightColors : darkColors, scheme }),
    [scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
