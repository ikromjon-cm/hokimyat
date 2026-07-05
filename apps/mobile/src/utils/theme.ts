export const colors = {
  background: "#1a1a2e",
  surface: "#16213e",
  surfaceLight: "#0f3460",
  primary: "#1a73e8",
  danger: "#e74c3c",
  success: "#52b788",
  warning: "#ffd60a",
  info: "#5dade2",
  textPrimary: "#fff",
  textSecondary: "#8899aa",
  textMuted: "#556677",
  border: "#0f3460",
  inputBg: "#0f3460",
  tabBarBg: "#1a1a2e",
  tabBarBorder: "#0f3460",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "bold" as const, color: colors.textPrimary },
  h2: { fontSize: 22, fontWeight: "bold" as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.textPrimary },
  body: { fontSize: 15, color: colors.textPrimary },
  caption: { fontSize: 13, color: colors.textSecondary },
  small: { fontSize: 11, color: colors.textMuted },
} as const;

export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
} as const;
