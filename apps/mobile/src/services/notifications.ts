import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { api } from "./api";
import { useAuthStore } from "../store/authStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[PushNotification] Simulyatorda push qo'llab-quvvatlanmaydi");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("[PushNotification] Push ruxsati berilmagan");
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    const token = tokenData.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Bildirishnomalar",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a73e8",
        sound: "default",
      });
    }

    return token;
  } catch (error) {
    console.error("[PushNotification] Token olishda xatolik:", error);
    return null;
  }
}

export async function updatePushTokenOnServer(pushToken: string): Promise<void> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return;

    await api.patch("/users/profile", {
      pushToken,
      deviceInfo: JSON.stringify({
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version,
      }),
    });
  } catch (error) {
    console.error("[PushNotification] Tokenni yangilashda xatolik:", error);
  }
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseReceivedListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
