import { prisma } from "../services/prisma";
import { sendPushNotification } from "../services/notification";
import { sendSMS } from "../services/sms";
import { addHours, addMinutes, isBefore } from "date-fns";

export async function sendMeetingReminders(): Promise<void> {
  const now = new Date();
  const reminderWindowStart = addHours(now, 1);
  const reminderWindowEnd = addHours(now, 2);

  const upcomingMeetings = await prisma.meeting.findMany({
    where: {
      status: "SCHEDULED",
      startTime: {
        gte: reminderWindowStart,
        lte: reminderWindowEnd,
      },
    },
    include: {
      participants: {
        where: { status: { not: "DECLINED" } },
        include: {
          employee: {
            include: { user: true },
          },
        },
      },
    },
  });

  for (const meeting of upcomingMeetings) {
    for (const participant of meeting.participants) {
      const user = participant.employee.user;

      const message = `Eslatma: "${meeting.title}" uchrashuvi ${new Date(meeting.startTime).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })} da boshlanadi.`;

      await sendPushNotification(user.id, {
        title: "Uchrashuv eslatmasi",
        body: message,
        data: { type: "MEETING_REMINDER", meetingId: meeting.id },
      });

      try {
        await sendSMS(user.phone, `UYCHI MAJLIS: ${message}`);
      } catch (err) {
        console.error(`[Reminder] SMS failed for ${user.phone}:`, err);
      }
    }
  }
}

export async function sendHighFrequencyReminders(): Promise<void> {
  const now = new Date();
  const oneHourFromNow = addHours(now, 1);

  const imminentMeetings = await prisma.meeting.findMany({
    where: {
      status: "SCHEDULED",
      startTime: {
        gte: now,
        lte: oneHourFromNow,
      },
    },
    include: {
      participants: {
        where: { status: { notIn: ["DECLINED", "CONFIRMED"] } },
        include: {
          employee: {
            include: { user: true },
          },
        },
      },
    },
  });

  for (const meeting of imminentMeetings) {
    for (const participant of meeting.participants) {
      const user = participant.employee.user;
      const minutesUntilStart = Math.round(
        (meeting.startTime.getTime() - now.getTime()) / 60000
      );

      const message = `Shoshilinch! "${meeting.title}" uchrashuviga ${minutesUntilStart} daqiqa qoldi. Iltimos, tasdiqlang!`;

      await sendPushNotification(user.id, {
        title: "⚠️ Uchrashuv tez orada",
        body: message,
        data: { type: "MEETING_REMINDER", meetingId: meeting.id },
      });
    }
  }
}
