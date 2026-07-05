import crypto from "crypto";
import { prisma } from "./prisma";

const KEY_PREFIX_LENGTH = 8;
const KEY_SECRET_LENGTH = 48;

export function generateApiKey(): { prefix: string; secret: string; fullKey: string; hash: string } {
  const prefix = crypto.randomBytes(KEY_PREFIX_LENGTH).toString("hex");
  const secret = crypto.randomBytes(KEY_SECRET_LENGTH).toString("hex");
  const fullKey = `um_${prefix}_${secret}`;
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");

  return { prefix, secret, fullKey, hash };
}

export async function createApiKey(
  userId: string,
  name: string,
  options?: {
    organizationId?: string;
    permissions?: string[];
    allowedIps?: string[];
    rateLimitPerMinute?: number;
    expiresAt?: Date;
  }
) {
  const { prefix, hash, fullKey } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      name,
      keyHash: hash,
      keyPrefix: prefix,
      userId,
      organizationId: options?.organizationId,
      permissions: options?.permissions || [],
      allowedIps: options?.allowedIps || [],
      rateLimitPerMinute: options?.rateLimitPerMinute || 60,
      expiresAt: options?.expiresAt,
    },
  });

  return { prefix, fullKey, name };
}

export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  userId?: string;
  organizationId?: string;
  permissions?: string[];
}> {
  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash, isActive: true },
    include: { user: { select: { id: true, status: true } } },
  });

  if (!apiKey) return { valid: false };
  if (apiKey.user.status !== "ACTIVE") return { valid: false };
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return { valid: false };
  if (!apiKey.isActive) return { valid: false };

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    userId: apiKey.userId,
    organizationId: apiKey.organizationId || undefined,
    permissions: apiKey.permissions as string[],
  };
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      rateLimitPerMinute: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: { id: keyId, userId },
    data: { isActive: false },
  });
  return result.count > 0;
}

export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
  const result = await prisma.apiKey.deleteMany({
    where: { id: keyId, userId },
  });
  return result.count > 0;
}
