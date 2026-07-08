import sharp from "sharp";
import crypto from "crypto";
import { prisma } from "./prisma";

const SIMILARITY_THRESHOLD = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD || "0.75");

interface FaceVerificationResult {
  verified: boolean;
  confidence: number;
  reason?: string;
}

function averageHash(buffer: Buffer): string {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return hash;
}

export async function computeImageHash(imageBuffer: Buffer): Promise<string> {
  const resized = await sharp(imageBuffer)
    .resize(64, 64, { fit: "cover" })
    .grayscale()
    .raw()
    .toBuffer();

  const pixels = Array.from(resized);
  const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  const hash = pixels.map((p) => (p > avg ? "1" : "0")).join("");

  return Buffer.from(hash, "binary").toString("hex");
}

export function hammingDistance(hash1: string, hash2: string): number {
  const buf1 = Buffer.from(hash1, "hex");
  const buf2 = Buffer.from(hash2, "hex");
  let distance = 0;

  for (let i = 0; i < buf1.length && i < buf2.length; i++) {
    const xor = buf1[i] ^ buf2[i];
    distance += (xor & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1) +
                ((xor >> 4) & 1) + ((xor >> 5) & 1) + ((xor >> 6) & 1) + ((xor >> 7) & 1);
  }

  return distance;
}

export async function verifyFace(
  selfieBuffer: Buffer,
  referenceBuffer: Buffer
): Promise<FaceVerificationResult> {
  try {
    const selfieHash = await computeImageHash(selfieBuffer);
    const referenceHash = await computeImageHash(referenceBuffer);

    const maxDistance = selfieHash.length * 4;
    const actualDistance = hammingDistance(selfieHash, referenceHash);
    const similarity = 1 - (actualDistance / maxDistance);

    return {
      verified: similarity >= SIMILARITY_THRESHOLD,
      confidence: Math.round(similarity * 1000) / 1000,
      reason: similarity >= SIMILARITY_THRESHOLD
        ? undefined
        : `Yuz mosligi yetarli emas (${(similarity * 100).toFixed(1)}%)`,
    };
  } catch (error: any) {
    return {
      verified: false,
      confidence: 0,
      reason: `Yuzni tekshirib bo'lmadi: ${error.message}`,
    };
  }
}

export async function storeReferencePhoto(employeeId: string, photoBuffer: Buffer): Promise<void> {
  const hash = await computeImageHash(photoBuffer);
  const encrypted = await encryptPhoto(photoBuffer);

  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      referencePhotoHash: hash,
      referencePhoto: encrypted.toString("base64"),
    },
  });
}

export async function getReferencePhoto(employeeId: string): Promise<Buffer | null> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { referencePhoto: true },
  });

  if (!employee?.referencePhoto) return null;

  const encrypted = Buffer.from(employee.referencePhoto, "base64");
  return decryptPhoto(encrypted);
}

function getEncryptionKey(): Buffer {
  const raw = process.env.SELFIE_ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  // Backward compatible: a 64-char hex string is used directly as the 32-byte key.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  // Otherwise derive a stable 32-byte key from any secret via SHA-256,
  // so auto-generated secrets of any length/charset work out of the box.
  return crypto.createHash("sha256").update(raw).digest();
}

function encryptPhoto(buffer: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function decryptPhoto(buffer: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = buffer.subarray(0, 16);
  const authTag = buffer.subarray(16, 32);
  const encrypted = buffer.subarray(32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
