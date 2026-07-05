export interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
}

const REQUIRED_ENV: EnvCheck[] = [
  { key: "DATABASE_URL", required: true, description: "PostgreSQL ulanish stringi" },
  { key: "REDIS_URL", required: true, description: "Redis ulanish stringi" },
  { key: "JWT_ACCESS_SECRET", required: true, description: "JWT access token maxfiy kaliti (32+ belgi)" },
  { key: "JWT_REFRESH_SECRET", required: true, description: "JWT refresh token maxfiy kaliti (32+ belgi)" },
  { key: "SELFIE_ENCRYPTION_KEY", required: true, description: "Rasmlarni shifrlash kaliti (32 belgi)" },
];

const OPTIONAL_ENV: EnvCheck[] = [
  { key: "ESKIZ_EMAIL", required: false, description: "Eskiz.uz SMS xizmati emaili" },
  { key: "ESKIZ_PASSWORD", required: false, description: "Eskiz.uz SMS xizmati paroli" },
  { key: "SMTP_HOST", required: false, description: "Email yuborish uchun SMTP server" },
  { key: "EXPO_ACCESS_TOKEN", required: false, description: "Expo push bildirishnomalar tokeni" },
  { key: "SENTRY_DSN", required: false, description: "Sentry xatolik kuzatuv DSN" },
];

export function validateEnvironment(): { valid: boolean; warnings: string[]; errors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const env of REQUIRED_ENV) {
    const val = process.env[env.key];
    if (!val || val.startsWith("your-")) {
      errors.push(`${env.key} - ${env.description}`);
    }
  }

  for (const env of OPTIONAL_ENV) {
    if (!process.env[env.key]) {
      warnings.push(`${env.key} - ${env.description} (o'rnatilmagan)`);
    }
  }

  if (process.env.NODE_ENV === "production") {
    const jwtAccess = process.env.JWT_ACCESS_SECRET || "";
    const jwtRefresh = process.env.JWT_REFRESH_SECRET || "";
    if (jwtAccess.length < 32) errors.push("JWT_ACCESS_SECRET kamida 32 belgidan iborat bo'lishi kerak");
    if (jwtRefresh.length < 32) errors.push("JWT_REFRESH_SECRET kamida 32 belgidan iborat bo'lishi kerak");
    if ((process.env.SELFIE_ENCRYPTION_KEY || "").length < 16) {
      errors.push("SELFIE_ENCRYPTION_KEY kamida 16 belgi bo'lishi kerak");
    }
  }

  return { valid: errors.length === 0, warnings, errors };
}

export function printEnvStatus(): void {
  const { errors, warnings } = validateEnvironment();
  console.log("\n========================================");
  console.log("  MUHIT O'ZGARUVCHILARINI TEKSHIRISH");
  console.log("========================================");

  if (errors.length === 0 && warnings.length === 0) {
    console.log("  Barcha muhit o'zgaruvchilari to'g'ri");
  } else {
    if (errors.length > 0) {
      console.log(`\n  [XATOLIK] ${errors.length} ta majburiy o'zgaruvchi topilmadi:`);
      errors.forEach((e) => console.log(`    - ${e}`));
    }
    if (warnings.length > 0) {
      console.log(`\n  [OGOHLANTIRISH] ${warnings.length} ta ixtiyoriy o'zgaruvchi topilmadi:`);
      warnings.forEach((w) => console.log(`    - ${w}`));
    }
  }
  console.log("========================================\n");
}
