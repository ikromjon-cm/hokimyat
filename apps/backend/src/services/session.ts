import { prisma } from "./prisma";
import crypto from "crypto";

export async function createSession(userId: string, info: {
  ipAddress?: string;
  deviceInfo?: string;
  userAgent?: string;
  location?: string;
}): Promise<string> {
  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token,
      ipAddress: info.ipAddress,
      deviceInfo: info.deviceInfo,
      userAgent: info.userAgent,
      location: info.location,
      expiresAt,
    },
  });

  return token;
}

export async function validateSession(token: string): Promise<string | null> {
  const session = await prisma.session.findUnique({
    where: { token, isActive: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.update({
      where: { id: session.id },
      data: { isActive: false },
    });
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastActivity: new Date() },
  });

  return session.userId;
}

export async function listSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, isActive: true },
    orderBy: { lastActivity: "desc" },
    select: {
      id: true,
      ipAddress: true,
      deviceInfo: true,
      location: true,
      lastActivity: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export async function terminateSession(sessionId: string, userId: string): Promise<boolean> {
  const result = await prisma.session.updateMany({
    where: { id: sessionId, userId },
    data: { isActive: false },
  });
  return result.count > 0;
}

export async function terminateAllSessions(userId: string, exceptToken?: string): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      isActive: true,
      ...(exceptToken ? { token: { not: exceptToken } } : {}),
    },
    data: { isActive: false },
  });
  return result.count;
}

export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.updateMany({
    where: { expiresAt: { lt: new Date() }, isActive: true },
    data: { isActive: false },
  });
  return result.count;
}
