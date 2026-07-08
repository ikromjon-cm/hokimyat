export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  apiPrefix: process.env.API_PREFIX || "/api/v1",

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-in-production",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret-change-in-production",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  database: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/uychi_majlis",
  },

  eskiz: {
    email: process.env.ESKIZ_EMAIL || "",
    password: process.env.ESKIZ_PASSWORD || "",
    apiUrl: process.env.ESKIZ_API_URL || "https://notify.eskiz.uz/api/v1",
  },

  otp: {
    // Demo/free mode: when enabled, the OTP code is returned in the API response
    // instead of being sent via SMS (no paid SMS provider required).
    // Defaults ON when no Eskiz SMS credentials are configured.
    demoMode:
      process.env.OTP_DEMO_MODE === "true" ||
      (process.env.OTP_DEMO_MODE !== "false" &&
        !process.env.ESKIZ_EMAIL &&
        !process.env.ESKIZ_PASSWORD),
  },

  jobs: {
    // Background BullMQ workers (reminders, daily reports). Disabled by default
    // to keep free-tier Redis (Upstash) command usage low. Set JOBS_ENABLED=true
    // on a paid Redis to enable scheduled reminders.
    enabled: process.env.JOBS_ENABLED === "true",
  },

  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN || "",
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT || "9000", 10),
    accessKey: process.env.MINIO_ACCESS_KEY || "minio-admin",
    secretKey: process.env.MINIO_SECRET_KEY || "minio-password",
    bucket: process.env.MINIO_BUCKET || "uychi-majlis-selfies",
    useSSL: process.env.MINIO_USE_SSL === "true",
  },

  selfieEncryptionKey: process.env.SELFIE_ENCRYPTION_KEY || "default-key-32-chars-change-it!!",

  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  organization: {
    defaultGeofenceRadius: parseInt(process.env.DEFAULT_GEOFENCE_RADIUS || "100", 10),
    checkInWindowStart: process.env.CHECK_IN_WINDOW_START || "08:00",
    checkInWindowEnd: process.env.CHECK_IN_WINDOW_END || "10:00",
    checkOutWindowStart: process.env.CHECK_OUT_WINDOW_START || "17:00",
    checkOutWindowEnd: process.env.CHECK_OUT_WINDOW_END || "19:00",
  },
};
