import crypto from "crypto";
import { prisma } from "./prisma";
import { sendSMS } from "./sms";
import { AppError } from "../middleware/errorHandler";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MINUTES = 15;

function generateOTP(): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function requestOTP(phone: string): Promise<void> {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  if (normalizedPhone.length < 10) {
    throw new AppError("Telefon raqam formati noto'g'ri", 400, "INVALID_PHONE");
  }

  const recentBlocked = await prisma.otpCode.findFirst({
    where: {
      phone: normalizedPhone,
      isBlocked: true,
      blockedUntil: { gt: new Date() },
    },
  });

  if (recentBlocked) {
    const remainingMs = recentBlocked.blockedUntil!.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    throw new AppError(
      `Ko'p urinishlar. ${remainingMinutes} daqiqadan keyin urinib ko'ring.`,
      429,
      "TOO_MANY_ATTEMPTS"
    );
  }

  const otp = generateOTP();
  const codeHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.updateMany({
    where: { phone: normalizedPhone, isUsed: false },
    data: { isUsed: true },
  });

  await prisma.otpCode.create({
    data: {
      phone: normalizedPhone,
      codeHash,
      expiresAt,
      maxAttempts: MAX_ATTEMPTS,
    },
  });

  try {
    await sendSMS(normalizedPhone, `UYCHI MAJLIS: Sizning tasdiqlash kodingiz: ${otp}. Kod ${OTP_EXPIRY_MINUTES} daqiqa amal qiladi.`);
  } catch (error) {
    console.error("[OTP] SMS yuborishda xatolik:", error);
  }
}

export async function verifyOTP(phone: string, code: string): Promise<boolean> {
  const normalizedPhone = phone.replace(/[^0-9]/g, "");
  const codeHash = hashOTP(code);

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      phone: normalizedPhone,
      isUsed: false,
      isBlocked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw new AppError("Kod yaroqsiz yoki muddati tugagan", 400, "INVALID_OTP");
  }

  if (otpRecord.codeHash !== codeHash) {
    const newAttempts = otpRecord.attempts + 1;
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: newAttempts },
    });

    if (newAttempts >= MAX_ATTEMPTS) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: {
          isBlocked: true,
          blockedUntil: new Date(Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000),
        },
      });
      throw new AppError(
        `Ko'p urinishlar. ${BLOCK_DURATION_MINUTES} daqiqadan keyin urinib ko'ring.`,
        429,
        "TOO_MANY_ATTEMPTS"
      );
    }

    throw new AppError("Noto'g'ri kod", 400, "INVALID_OTP");
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  return true;
}
