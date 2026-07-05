import crypto from "crypto";
import { prisma } from "./prisma";

const TOTP_ISSUER = "UYCHI MAJLIS";

export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

export async function enableTOTP(userId: string) {
  const secret = crypto.randomBytes(20).toString("hex");
  const backupCodes = generateBackupCodes();

  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: secret,
      totpEnabled: false,
      totpBackupCodes: backupCodes,
    },
  });

  return {
    secret,
    backupCodes,
    issuer: TOTP_ISSUER,
  };
}

export async function verifyTOTP(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true, totpBackupCodes: true },
  });

  if (!user?.totpSecret) return false;

  if (user.totpBackupCodes && Array.isArray(user.totpBackupCodes)) {
    const codeIndex = (user.totpBackupCodes as string[]).indexOf(token);
    if (codeIndex !== -1) {
      const newCodes = [...(user.totpBackupCodes as string[])];
      newCodes.splice(codeIndex, 1);
      await prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: newCodes },
      });
      return true;
    }
  }

  const timeWindow = Math.floor(Date.now() / 30000);
  for (let offset = -1; offset <= 1; offset++) {
    const expected = generateTOTPToken(user.totpSecret, timeWindow + offset);
    if (expected === token) return true;
  }

  return false;
}

export async function confirmTOTPEnable(userId: string, token: string): Promise<boolean> {
  const valid = await verifyTOTP(userId, token);
  if (valid) {
    await prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true },
    });
    return true;
  }
  return false;
}

export async function disableTOTP(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: null,
      totpEnabled: false,
      totpBackupCodes: [],
    },
  });
}

export async function isTOTPEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpEnabled: true },
  });
  return user?.totpEnabled || false;
}

function generateTOTPToken(secret: string, counter: number): string {
  const counterBuf = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counterBuf[i] = counter & 0xff;
    counter >>>= 8;
  }

  const hmac = crypto.createHmac("sha1", Buffer.from(secret, "hex"));
  hmac.update(counterBuf);
  const hash = hmac.digest();
  const offset = hash[hash.length - 1] & 0xf;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  const token = binary % 1000000;
  return token.toString().padStart(6, "0");
}
