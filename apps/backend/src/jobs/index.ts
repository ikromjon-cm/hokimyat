import { Queue, Worker, QueueEvents } from "bullmq";
import { getRedis } from "../services/redis";

function getRedisConnection(): import("bullmq").ConnectionOptions {
  const redis = getRedis();
  if (!redis) throw new Error("Redis not initialized");
  return redis as unknown as import("bullmq").ConnectionOptions;
}

function createQueue(name: string): Queue {
  return new Queue(name, { connection: getRedisConnection() });
}

let _meetingReminderQueue: Queue | null = null;
let _dailyReportQueue: Queue | null = null;
let _smsRetryQueue: Queue | null = null;
let _overdueConfirmationsQueue: Queue | null = null;

export function getMeetingReminderQueue(): Queue {
  if (!_meetingReminderQueue) _meetingReminderQueue = createQueue("meeting-reminders");
  return _meetingReminderQueue;
}

export function getDailyReportQueue(): Queue {
  if (!_dailyReportQueue) _dailyReportQueue = createQueue("daily-reports");
  return _dailyReportQueue;
}

export function getSmsRetryQueue(): Queue {
  if (!_smsRetryQueue) _smsRetryQueue = createQueue("sms-retries");
  return _smsRetryQueue;
}

export function getOverdueConfirmationsQueue(): Queue {
  if (!_overdueConfirmationsQueue) _overdueConfirmationsQueue = createQueue("overdue-confirmations");
  return _overdueConfirmationsQueue;
}



export async function scheduleMeetingReminders(): Promise<void> {
  const job = await getMeetingReminderQueue().add(
    "send-meeting-reminders",
    {},
    {
      repeat: {
        pattern: "*/30 * * * *",
      },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    }
  );
  console.log("[Jobs] Meeting reminders scheduled:", job.id);
}

export async function scheduleIncreasedFrequencyReminders(): Promise<void> {
  const job = await getMeetingReminderQueue().add(
    "send-high-frequency-reminders",
    {},
    {
      repeat: {
        pattern: "*/10 * * * *",
      },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    }
  );
  console.log("[Jobs] High-frequency reminders scheduled:", job.id);
}

export async function scheduleDailyReport(): Promise<void> {
  const job = await getDailyReportQueue().add(
    "generate-daily-report",
    {},
    {
      repeat: {
        pattern: "0 18 * * *",
      },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 86400 },
    }
  );
  console.log("[Jobs] Daily report scheduled:", job.id);
}

export async function scheduleOverdueConfirmations(): Promise<void> {
  const job = await getOverdueConfirmationsQueue().add(
    "check-overdue-confirmations",
    {},
    {
      repeat: {
        pattern: "0 */6 * * *",
      },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 86400 },
    }
  );
  console.log("[Jobs] Overdue confirmations check scheduled:", job.id);
}

export async function initializeQueueProcessors(): Promise<void> {
  const connection = getRedisConnection();

  new Worker(
    "meeting-reminders",
    async (job) => {
      if (job.name === "send-meeting-reminders") {
        const { sendMeetingReminders } = await import("./meetingReminders");
        await sendMeetingReminders();
      } else if (job.name === "send-high-frequency-reminders") {
        const { sendHighFrequencyReminders } = await import("./meetingReminders");
        await sendHighFrequencyReminders();
      }
    },
    { connection }
  );

  new Worker(
    "daily-reports",
    async () => {
      const { generateDailyReport } = await import("./dailyReport");
      await generateDailyReport();
    },
    { connection }
  );

  new Worker(
    "sms-retries",
    async (job) => {
      const { retryFailedSMS } = await import("./smsRetry");
      await retryFailedSMS(job.data);
    },
    { connection }
  );

  new Worker(
    "overdue-confirmations",
    async () => {
      const { checkOverdueConfirmations } = await import("./overdueConfirmations");
      await checkOverdueConfirmations();
    },
    { connection }
  );

  await scheduleMeetingReminders();
  await scheduleIncreasedFrequencyReminders();
  await scheduleDailyReport();
  await scheduleOverdueConfirmations();

  console.log("[Jobs] All queue processors initialized");
}
