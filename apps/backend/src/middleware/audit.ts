import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../services/prisma";
import { getRedis } from "../services/redis";
import { AuditAction } from "@prisma/client";

async function getLastAuditHash(): Promise<string | null> {
  const lastAudit = await prisma.auditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { currentHash: true },
  });
  return lastAudit?.currentHash || null;
}

function calculateHash(previousHash: string | null, data: string): string {
  const hashInput = previousHash ? `${previousHash}:${data}` : data;
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

export async function createAuditLog(params: {
  action: AuditAction;
  actorId?: string;
  actorType?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId?: string;
}): Promise<void> {
  try {
    const previousHash = await getLastAuditHash();
    const data = JSON.stringify({
      action: params.action,
      actorId: params.actorId,
      timestamp: new Date().toISOString(),
      ...params.metadata,
    });
    const currentHash = calculateHash(previousHash, data);

    await prisma.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId,
        actorType: params.actorType,
        description: params.description,
        metadata: params.metadata as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        previousHash,
        currentHash,
        organizationId: params.organizationId,
      },
    });
  } catch (error) {
    console.error("[AuditLog] Failed to create audit log:", error);
  }
}

export function auditMiddleware(action: AuditAction, descriptionFn?: (req: Request) => string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const originalJson = _res.json.bind(_res);
    _res.json = function (body: any) {
      if (_res.statusCode < 400) {
        const description = descriptionFn ? descriptionFn(req) : `${action} amali bajarildi`;
        createAuditLog({
          action,
          actorId: req.user?.userId,
          actorType: req.user?.role,
          description,
          metadata: { method: req.method, path: req.path, statusCode: _res.statusCode },
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
          organizationId: req.user?.organizationId,
        }).catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
}

export async function verifyAuditChain(): Promise<{ valid: boolean; brokenLinks: number[] }> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, previousHash: true, currentHash: true, action: true, actorId: true, metadata: true, createdAt: true },
  });

  let brokenLinks: number[] = [];
  let expectedPreviousHash: string | null = null;

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];

    if (log.previousHash !== expectedPreviousHash) {
      brokenLinks.push(i);
    }

    const data = JSON.stringify({
      action: log.action,
      actorId: log.actorId,
      timestamp: log.createdAt.toISOString(),
      ...(log.metadata as Record<string, unknown> || {}),
    });
    const expectedHash = calculateHash(log.previousHash, data);

    if (log.currentHash !== expectedHash) {
      brokenLinks.push(i);
    }

    expectedPreviousHash = log.currentHash;
  }

  return { valid: brokenLinks.length === 0, brokenLinks };
}
