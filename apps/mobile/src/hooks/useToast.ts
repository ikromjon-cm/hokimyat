import { useCallback } from "react";
import { Alert, Platform, ToastAndroid } from "react-native";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export function useToast() {
  const show = useCallback(({ title, message, type = "info" }: ToastOptions) => {
    if (Platform.OS === "android") {
      const durations: Record<ToastType, number> = {
        success: ToastAndroid.SHORT,
        error: ToastAndroid.LONG,
        warning: ToastAndroid.LONG,
        info: ToastAndroid.SHORT,
      };
      ToastAndroid.showWithGravity(message, durations[type], ToastAndroid.BOTTOM);
    } else {
      const titles: Record<ToastType, string> = {
        success: "Muvaffaqiyatli",
        error: "Xatolik",
        warning: "Ogohlantirish",
        info: "Ma'lumot",
      };
      Alert.alert(title || titles[type], message);
    }
  }, []);

  const success = useCallback((message: string, title?: string) => {
    show({ title, message, type: "success" });
  }, [show]);

  const error = useCallback((message: string, title?: string) => {
    show({ title, message, type: "error" });
  }, [show]);

  const warning = useCallback((message: string, title?: string) => {
    show({ title, message, type: "warning" });
  }, [show]);

  const info = useCallback((message: string, title?: string) => {
    show({ title, message, type: "info" });
  }, [show]);

  return { show, success, error, warning, info };
}
