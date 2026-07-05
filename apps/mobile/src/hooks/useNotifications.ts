import { useEffect } from "react";
import { registerForPushNotificationsAsync, updatePushTokenOnServer, addNotificationResponseReceivedListener } from "../services/notifications";
import { useAuthStore } from "../store/authStore";

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        updatePushTokenOnServer(token);
      }
    });
  }, [isAuthenticated]);
}
