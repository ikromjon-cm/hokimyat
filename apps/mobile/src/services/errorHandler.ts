import { AxiosError } from "axios";
import { captureError } from "./sentry";

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export function parseApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return {
        code: "NETWORK_ERROR",
        message: "Tarmoq aloqasi yo'q. Internetga ulanganingizni tekshiring.",
      };
    }

    const data = error.response.data as any;
    if (data?.error) {
      return {
        code: data.error.code || "UNKNOWN",
        message: data.error.message || "Server xatoligi",
        details: data.error.details,
      };
    }

    const statusMessages: Record<number, string> = {
      400: "Noto'g'ri so'rov",
      401: "Avtorizatsiyadan o'tmagan",
      403: "Ruxsat yo'q",
      404: "Ma'lumot topilmadi",
      409: "Ma'lumotlar ziddiyati",
      422: "Ma'lumotlar noto'g'ri",
      429: "Ko'p so'rov yuborildi",
      500: "Server xatoligi",
      503: "Xizmat vaqtincha mavjud emas",
    };

    return {
      code: `HTTP_${error.response.status}`,
      message: statusMessages[error.response.status] || "Noma'lum xatolik",
    };
  }

  if (error instanceof Error) {
    captureError(error);
    return { code: "INTERNAL", message: error.message || "Kutilmagan xatolik" };
  }

  return { code: "UNKNOWN", message: "Noma'lum xatolik yuz berdi" };
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError && !error.response) return true;
  return false;
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError && error.response?.status === 401) return true;
  return false;
}

export class RetryError extends Error {
  constructor(public readonly attempts: number) {
    super(`So'rov ${attempts} marta urinishdan keyin muvaffaqiyatsiz tugadi`);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isNetworkError(error) || attempt === maxAttempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
  throw new RetryError(maxAttempts);
}
