import { prisma } from "../services/prisma";
import { sendPushNotification } from "../services/notification";
import { sendSMS } from "../services/sms";

export async function checkOverdueConfirmations(): Promise<void> {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  const overdueParticipants = await prisma.meetingParticipant.findMany({
    where: {
      status: "PENDING",
      meeting: {
        status: "SCHEDULED",
        startTime: { gte: now },
      },
      createdAt: { lte: sixHoursAgo },
    },
    include: {
      meeting: { select: { id: true, title: true, startTime: true } },
      employee: { include: { user: { select: { id: true, phone: true } } } },
    },
  });

  for (const participant of overdueParticipants) {
    const user = participant.employee.user;
    const message = `Eslatma: "${participant.meeting.title}" uchrashuviga hali javob bermadingiz. Iltimos, "Qatnashaman" tugmasini bosing.`;

    await sendPushNotification(user.id, {
      title: "Uchrashuvni tasdiqlang",
      body: message,
      data: { type: "MEETING_REMINDER", meetingId: participant.meeting.id },
    });

    try {
      await sendSMS(
        user.phone,
        `UYCHI MAJLIS: ${message}`
      );
    } catch (err) {
      console.error(`[OverdueConfirmations] SMS failed for ${user.phone}:`, err);
    }
  }
}
