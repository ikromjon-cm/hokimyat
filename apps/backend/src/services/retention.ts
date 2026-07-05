import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

interface RetentionStats {
  deletedAttendance: number;
  deletedAuditLogs: number;
  archivedAuditLogs: number;
  deletedNotifications: number;
  deletedSessions: number;
}

export async function applyRetentionPolicy(organizationId?: string): Promise<RetentionStats> {
  const stats: RetentionStats = {
    deletedAttendance: 0,
    deletedAuditLogs: 0,
    archivedAuditLogs: 0,
    deletedNotifications: 0,
    deletedSessions: 0,
  };

  const configs = await prisma.dataRetentionConfig.findMany({
    where: {
      ...(organizationId ? { organizationId } : {}),
      isEnabled: true,
    },
  });

  for (const config of configs) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);

    switch (config.entityType) {
      case "ATTENDANCE": {
        const deleted = await prisma.attendance.deleteMany({
          where: {
            ...(organizationId ? { employee: { organizationId } } : {}),
            createdAt: { lt: cutoffDate },
          },
        });
        stats.deletedAttendance += deleted.count;
        break;
      }

      case "AUDIT_LOG": {
        const logs = await prisma.auditLog.findMany({
          where: {
            ...(organizationId ? { organizationId } : {}),
            createdAt: { lt: cutoffDate },
          },
          take: 1000,
        });

        if (logs.length > 0) {
          await prisma.$executeRaw`
            INSERT INTO "audit_logs_archive"
            SELECT * FROM "audit_logs"
            WHERE "id" IN (${Prisma.join(logs.map((l) => l.id))})
          `;

          await prisma.auditLog.deleteMany({
            where: { id: { in: logs.map((l) => l.id) } },
          });

          stats.archivedAuditLogs += logs.length;
        }
        break;
      }

      case "NOTIFICATION": {
        const deleted = await prisma.notificationLog.deleteMany({
          where: {
            createdAt: { lt: cutoffDate },
          },
        });
        stats.deletedNotifications += deleted.count;
        break;
      }

      case "SESSION": {
        const deleted = await prisma.session.deleteMany({
          where: {
            expiresAt: { lt: cutoffDate },
            isActive: false,
          },
        });
        stats.deletedSessions += deleted.count;
        break;
      }
    }
  }

  return stats;
}

export async function updateRetentionConfig(
  organizationId: string,
  entityType: string,
  retentionDays: number,
  action: string = "DELETE"
) {
  return prisma.dataRetentionConfig.upsert({
    where: { organizationId_entityType: { organizationId, entityType } },
    create: { organizationId, entityType, retentionDays, action },
    update: { retentionDays, action },
  });
}

export async function getRetentionConfigs(organizationId: string) {
  return prisma.dataRetentionConfig.findMany({
    where: { organizationId },
  });
}
