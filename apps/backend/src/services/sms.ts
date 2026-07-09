import axios, { AxiosInstance } from "axios";
import { config } from "../config";
import { cacheGet, cacheSet } from "./redis";

const CACHE_KEY = "eskiz:token";
const MAX_RETRIES = 3;

let eskizClient: AxiosInstance;

function getClient(): AxiosInstance {
  if (!eskizClient) {
    eskizClient = axios.create({
      baseURL: config.eskiz.apiUrl,
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
  }
  return eskizClient;
}

async function getToken(): Promise<string> {
  const cached = await cacheGet(CACHE_KEY);
  if (cached) return cached;

  const client = getClient();
  const response = await client.post("/auth/login", {
    email: config.eskiz.email,
    password: config.eskiz.password,
  });

  const token = response.data?.data?.token;
  if (!token) throw new Error("Eskiz token olishda xatolik");

  await cacheSet(CACHE_KEY, token, 3600);
  return token;
}

async function refreshToken(): Promise<string> {
  const client = getClient();
  const response = await client.post("/auth/refresh", {});
  const token = response.data?.data?.token;
  if (!token) throw new Error("Eskiz tokenni yangilashda xatolik");
  await cacheSet(CACHE_KEY, token, 3600);
  return token;
}

export async function sendSMS(phone: string, message: string): Promise<void> {
  // No SMS provider configured (demo/free mode): skip immediately instead of
  // retrying 3x with backoff (~14s), which would make bulk meeting creation
  // for many participants time out.
  if (!config.eskiz.email || !config.eskiz.password) {
    console.log(`[SMS] Not configured — skipped for ${phone}`);
    return;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = await getToken();
      const client = getClient();

      await client.post(
        "/message/sms/send",
        {
          mobile_phone: phone,
          message,
          from: "4546",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return;
    } catch (error: any) {
      lastError = error;

      if (error.response?.status === 401) {
        try {
          await refreshToken();
          continue;
        } catch {
          // continue to next retry
        }
      }

      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error("[SMS] Barcha urinishlar muvaffaqiyatsiz:", lastError);
  throw new Error(`SMS yuborishda xatolik: ${lastError?.message}`);
}
