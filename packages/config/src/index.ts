export const config = {
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api/v1",
    timeout: 30000,
  },
  app: {
    name: "UYCHI MAJLIS",
    version: "1.0.0",
    geofenceRadius: 100,
  },
  storage: {
    tokenKey: "access_token",
    refreshTokenKey: "refresh_token",
    userDataKey: "user_data",
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
  },
  colors: {
    primary: "#1a73e8",
    secondary: "#e94560",
    success: "#2ecc71",
    warning: "#f39c12",
    danger: "#e74c3c",
    background: "#1a1a2e",
    surface: "#16213e",
    surfaceLight: "#0f3460",
    text: "#ffffff",
    textSecondary: "#8899aa",
    textMuted: "#556677",
  },
};
