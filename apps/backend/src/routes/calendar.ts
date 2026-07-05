import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { exportMeetingsCalendar, generateCalendar, generateMeetingEvent } from "../services/ical";
import { prisma } from "../services/prisma";

export const calendarRouter = Router();

calendarRouter.get("/export", authenticate, async (req, res, next) => {
  try {
    const ical = await exportMeetingsCalendar(req.user?.organizationId);
    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=meetings.ics");
    res.send(ical);
  } catch (error) {
    next(error);
  }
});

calendarRouter.get("/meeting/:meetingId", authenticate, async (req, res, next) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.meetingId },
      include: {
        participants: {
          include: { employee: { include: { user: { select: { fullName: true, phone: true } } } } },
        },
        createdBy: { include: { user: { select: { fullName: true } } } },
      },
    });

    if (!meeting) {
      res.status(404).json({ error: { message: "Uchrashuv topilmadi" } });
      return;
    }

    const event = generateMeetingEvent(meeting);
    const ical = generateCalendar([event]);

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=meeting-${meeting.id}.ics`);
    res.send(ical);
  } catch (error) {
    next(error);
  }
});
