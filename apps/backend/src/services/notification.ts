import axios from "axios";
import { prisma } from "./prisma";
import { config } from "../config";
import { NotificationType, NotificationChannel } from "@prisma/client";

interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  priority?: "default" | "normal" | "high";
}

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  try {
    const devices = await prisma.device.findMany({
      where: { userId, isActive: true, pushToken: { not: null } },
    });

    for (const device of devices) {
      if (!device.pushToken) continue;

      const pushPayload: PushPayload = {
        to: device.pushToken,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: "default",
        priority: "high",
      };

      const notification = await prisma.notification.create({
        data: {
          type: (payload.data?.type as NotificationType) || NotificationType.SYSTEM_ALERT,
          channel: NotificationChannel.PUSH,
          title: payload.title,
          body: payload.body,
          data: payload.data as any,
          status: "PENDING",
        },
      });

      await prisma.notificationLog.create({
        data: {
          userId,
          notificationId: notification.id,
          type: notification.type,
          channel: NotificationChannel.PUSH,
          title: payload.title,
          body: payload.body,
          data: payload.data as any,
        },
      });

      try {
        const response = await axios.post(
          "https://exp.host/--/api/v2/push/send",
          pushPayload,
          {
            headers: {
              Accept: "application/json",
              "Accept-encoding": "gzip, deflate",
              "Content-Type": "application/json",
              ...(config.expo.accessToken
                ? { Authorization: `Bearer ${config.expo.accessToken}` }
                : {}),
            },
          }
        );

        const result = response.data;

        if (result?.data?.status === "error") {
          if (result.data.details?.error === "DeviceNotRegistered") {
            await prisma.device.update({
              where: { id: device.id },
              data: { isActive: false },
            });
          }

          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: "FAILED", error: result.data.message || "Unknown error" },
          });
        } else {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { status: "SENT", sentAt: new Date() },
          });
        }
      } catch (err: any) {
        console.error(`[PushNotification] Failed to send to device ${device.id}:`, err.message);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: "FAILED", error: err.message },
        });
      }
    }
  } catch (error) {
    console.error("[PushNotification] Error:", error);
  }
}

export async function sendBulkPushNotification(
  userIds: string[],
  payload: { title: string; body: string; data?: Record<string, unknown> }
): Promise<void> {
  const promises = userIds.map((userId) => sendPushNotification(userId, payload));
  await Promise.allSettled(promises);
}
