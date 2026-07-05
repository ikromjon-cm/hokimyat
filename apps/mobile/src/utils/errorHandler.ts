import { Alert } from "react-native";

interface ApiError {
  response?: {
    data?: {
      error?: {
        message?: string;
        code?: string;
        errors?: Record<string, string[]>;
      };
    };
    status?: number;
  };
  message?: string;
}

export function getErrorMessage(error: unknown, fallback = "Xatolik yuz berdi"): string {
  if (typeof error === "string") return error;

  const apiErr = error as ApiError;
  if (apiErr.response?.data?.error?.message) {
    return apiErr.response.data.error.message;
  }

  if (apiErr.message) {
    const msg = apiErr.message;
    if (msg.includes("Network Error") || msg.includes("network")) {
      return "Internet aloqasi yo'q";
    }
    if (msg.includes("timeout")) {
      return "So'rov vaqti tugadi";
    }
    if (msg.includes("401")) {
      return "Avtorizatsiyadan o'tmagan";
    }
    if (msg.includes("403")) {
      return "Ruxsat etilmagan";
    }
    if (msg.includes("429")) {
      return "Ko'p so'rov yuborildi. Iltimos, birozdan so'ng urinib ko'ring";
    }
    if (msg.includes("500")) {
      return "Serverda xatolik yuz berdi";
    }
    return msg;
  }

  return fallback;
}

export function showErrorAlert(error: unknown, title = "Xatolik"): void {
  Alert.alert(title, getErrorMessage(error));
}

export function mapValidationErrors(errors: Record<string, string[]> | undefined): string[] {
  if (!errors) return [];
  return Object.entries(errors).flatMap(([field, msgs]) =>
    msgs.map((msg) => `${field}: ${msg}`)
  );
}
