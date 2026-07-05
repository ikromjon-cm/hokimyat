import { prisma } from "../services/prisma";
import { sendPushNotification } from "../services/notification";

export async function generateDailyReport(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, name: true },
  });

  for (const org of organizations) {
    try {
      const totalEmployees = await prisma.employee.count({
        where: { organizationId: org.id, isActive: true, deletedAt: null },
      });

      const checkedIn = await prisma.attendance.count({
        where: {
          organizationId: org.id,
          date: { gte: today, lt: tomorrow },
          type: "CHECK_IN",
        },
      });

      const highConfidence = await prisma.attendance.count({
        where: {
          organizationId: org.id,
          date: { gte: today, lt: tomorrow },
          type: "CHECK_IN",
          confidence: "HIGH",
        },
      });

      const mediumConfidence = await prisma.attendance.count({
        where: {
          organizationId: org.id,
          date: { gte: today, lt: tomorrow },
          type: "CHECK_IN",
          confidence: "MEDIUM",
        },
      });

      const rejectedAttempts = await prisma.auditLog.count({
        where: {
          organizationId: org.id,
          action: "MOCK_LOCATION_ATTEMPT",
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      const admins = await prisma.user.findMany({
        where: {
          organizationId: org.id,
          role: { name: { in: ["SUPER_ADMIN", "DEPARTMENT_HEAD"] } },
          status: "ACTIVE",
        },
        select: { id: true },
      });

      const reportMessage = `📊 ${org.name} - Kunlik hisobot (${today.toLocaleDateString("uz-UZ")}):\nJami xodimlar: ${totalEmployees}\nKelganlar: ${checkedIn}\nYuqori ishonchlilik: ${highConfidence}\nO'rtacha ishonchlilik: ${mediumConfidence}\nShubhali urinishlar: ${rejectedAttempts}`;

      for (const admin of admins) {
        await sendPushNotification(admin.id, {
          title: `📊 Kunlik hisobot - ${org.name}`,
          body: reportMessage,
          data: { type: "DAILY_REPORT", organizationId: org.id, date: today.toISOString() },
        });
      }
    } catch (error) {
      console.error(`[DailyReport] Error for org ${org.id}:`, error);
    }
  }
}
