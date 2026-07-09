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
      // TZ: repeat reminders go only to participants who have NOT confirmed yet.
      participants: {
        where: { status: "PENDING" },
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
        include: {
          employee: {
            include: { user: true },
          },
        },
      },
      overseers: {
        include: {
          employee: {
            include: { user: true },
          },
        },
      },
    },
  });

  for (const meeting of imminentMeetings) {
    const minutesUntilStart = Math.round(
      (meeting.startTime.getTime() - now.getTime()) / 60000
    );
    const total = meeting.participants.length;
    const confirmed = meeting.participants.filter((p) => p.status === "CONFIRMED").length;

    // Urgent reminders to participants who still haven't confirmed (push + SMS).
    const pending = meeting.participants.filter((p) => p.status === "PENDING");
    for (const participant of pending) {
      const user = participant.employee.user;
      const message = `Shoshilinch! "${meeting.title}" uchrashuviga ${minutesUntilStart} daqiqa qoldi. Iltimos, tasdiqlang!`;

      await sendPushNotification(user.id, {
        title: "⚠️ Uchrashuv tez orada",
        body: message,
        data: { type: "MEETING_REMINDER", meetingId: meeting.id },
      });

      try {
        await sendSMS(user.phone, `UYCHI MAJLIS: ${message}`);
      } catch (err) {
        console.error(`[Reminder] SMS failed for ${user.phone}:`, err);
      }
    }

    // TZ 3.2: ~30 min before start, notify overseers with the confirmation count.
    if (minutesUntilStart >= 25 && minutesUntilStart <= 35) {
      for (const overseer of meeting.overseers) {
        const user = overseer.employee.user;
        const message = `Eslatma: "${meeting.title}" majlisi ${minutesUntilStart} daqiqadan so'ng boshlanadi. Tasdiqlaganlar: ${confirmed}/${total}`;

        await sendPushNotification(user.id, {
          title: "Majlis eslatmasi (nazoratchi)",
          body: message,
          data: { type: "MEETING_REMINDER", meetingId: meeting.id },
        });

        try {
          await sendSMS(user.phone, `UYCHI MAJLIS: ${message}`);
        } catch (err) {
          console.error(`[Reminder] Overseer SMS failed for ${user.phone}:`, err);
        }
      }
    }
  }
}
