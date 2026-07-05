import { sendSMS } from "../services/sms";

interface SmsRetryData {
  phone: string;
  message: string;
  attempt: number;
  maxAttempts: number;
}

export async function retryFailedSMS(data: SmsRetryData): Promise<void> {
  if (data.attempt >= data.maxAttempts) {
    console.error(`[SMS Retry] Max attempts reached for ${data.phone}`);
    return;
  }

  try {
    await sendSMS(data.phone, data.message);
    console.log(`[SMS Retry] Successfully sent to ${data.phone} on attempt ${data.attempt + 1}`);
  } catch (error) {
    console.error(`[SMS Retry] Failed attempt ${data.attempt + 1} for ${data.phone}:`, error);

    const { getSmsRetryQueue } = await import("./index");
    await getSmsRetryQueue().add(
      "retry-sms",
      {
        ...data,
        attempt: data.attempt + 1,
      },
      {
        delay: Math.pow(2, data.attempt) * 1000,
        attempts: data.maxAttempts - data.attempt - 1,
      }
    );
  }
}
