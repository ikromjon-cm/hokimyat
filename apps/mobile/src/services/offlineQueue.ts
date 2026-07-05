import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { api } from "./api";

const QUEUE_KEY = "attendance_queue";

interface QueuedAttendance {
  id: string;
  type: "CHECK_IN" | "CHECK_OUT";
  data: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

export async function addToQueue(attendance: Omit<QueuedAttendance, "id" | "timestamp" | "retryCount">): Promise<void> {
  try {
    const queue = await getQueue();
    const item: QueuedAttendance = {
      ...attendance,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    queue.push(item);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Navbatga qo'shildi: ${attendance.type}`);
  } catch (error) {
    console.error("[OfflineQueue] Saqlashda xatolik:", error);
  }
}

export async function getQueue(): Promise<QueuedAttendance[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function processQueue(): Promise<void> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) return;

    const queue = await getQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineQueue] ${queue.length} ta yozuv sinxronlanmoqda...`);

    const remaining: QueuedAttendance[] = [];

    for (const item of queue) {
      try {
        const endpoint = item.type === "CHECK_IN" ? "/attendance/check-in" : "/attendance/check-out";
        await api.post(endpoint, item.data);
        console.log(`[OfflineQueue] Sinxronlandi: ${item.id}`);
      } catch (error: any) {
        if (item.retryCount < 3) {
          item.retryCount++;
          remaining.push(item);
          console.log(`[OfflineQueue] Qayta urinish: ${item.id} (${item.retryCount}/3)`);
        } else {
          console.error(`[OfflineQueue] Bekor qilindi: ${item.id} - 3 marta muvaffaqiyatsiz`);
        }
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch (error) {
    console.error("[OfflineQueue] Sinxronlashda xatolik:", error);
  }
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
