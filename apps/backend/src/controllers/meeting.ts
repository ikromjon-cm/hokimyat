import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuditAction } from "@prisma/client";
import { prisma } from "../services/prisma";
import { createMeeting, confirmParticipation, cancelMeeting, getEmployeeMeetings, getPendingMeetings } from "../services/meeting";
import { NotFoundError, ForbiddenError, AppError } from "../middleware/errorHandler";
import { createAuditLog } from "../middleware/audit";
import { generateQRToken, generateQRBuffer, generateQRDataURL, verifyQRToken } from "../services/qrcode";

const createMeetingSchema = z.object({
  title: z.string().min(3, "Sarlavha kamida 3 ta belgidan iborat bo'lishi kerak"),
  agenda: z.string().optional(),
  description: z.string().optional(),
  date: z.string().transform((s) => new Date(s)),
  startTime: z.string().transform((s) => new Date(s)),
  endTime: z.string().transform((s) => new Date(s)).optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isOnline: z.boolean().default(false),
  meetingLink: z.string().url().optional(),
  departmentId: z.string().optional(),
  isGlobal: z.boolean().default(false),
  participantIds: z.array(z.string()).min(1, "Kamida 1 ishtirokchi tanlanishi kerak"),
  overseerIds: z.array(z.string()).optional(),
});

export async function createMeetingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.organizationId || !req.user?.employeeId) {
      throw new ForbiddenError("Profil to'ldirilmagan");
    }

    const data = createMeetingSchema.parse(req.body);

    if (data.isGlobal && req.user.role !== "SUPER_ADMIN") {
      throw new ForbiddenError("Global uchrashuv faqat Super Admin tomonidan yaratilishi mumkin");
    }

    const meeting = await createMeeting({
      ...data,
      organizationId: req.user.organizationId,
      createdById: req.user.employeeId,
    });

    await createAuditLog({
      action: AuditAction.MEETING_CREATED,
      actorId: req.user.userId,
      actorType: req.user.role,
      description: `Uchrashuv yaratildi: ${data.title}`,
      metadata: { meetingId: meeting.id, isOnline: data.isOnline, participantCount: data.participantIds.length },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: req.user.organizationId,
    });

    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
}

export async function confirmMeetingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const result = await confirmParticipation(req.params.id, req.user.employeeId);

    await createAuditLog({
      action: AuditAction.MEETING_CONFIRMED,
      actorId: req.user.userId,
      actorType: req.user.role,
      description: `Uchrashuv tasdiqlandi: ${req.params.id}`,
      metadata: { meetingId: req.params.id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: req.user.organizationId,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function cancelMeetingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ForbiddenError();

    await cancelMeeting(req.params.id, req.user.userId);

    await createAuditLog({
      action: AuditAction.MEETING_CANCELLED,
      actorId: req.user.userId,
      actorType: req.user.role,
      description: `Uchrashuv bekor qilindi: ${req.params.id}`,
      metadata: { meetingId: req.params.id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: req.user.organizationId,
    });

    res.json({ message: "Uchrashuv bekor qilindi" });
  } catch (error) {
    next(error);
  }
}

export async function getMyMeetingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const meetings = await getEmployeeMeetings(req.user.employeeId);
    res.json(meetings);
  } catch (error) {
    next(error);
  }
}

export async function getPendingMeetingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const meetings = await getPendingMeetings(req.user.employeeId);
    res.json(meetings);
  } catch (error) {
    next(error);
  }
}

export async function getMeetingByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: {
        participants: {
          include: {
            employee: {
              include: { user: { select: { id: true, fullName: true, phone: true } } },
            },
          },
        },
        overseers: {
          include: {
            employee: {
              include: { user: { select: { id: true, fullName: true } } },
            },
          },
        },
        createdBy: {
          include: { user: { select: { id: true, fullName: true } } },
        },
      },
    });

    if (!meeting) throw new NotFoundError("Uchrashuv");
    res.json(meeting);
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentMeetingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const meetings = await prisma.meeting.findMany({
      where: { departmentId: req.params.departmentId },
      include: {
        participants: { include: { employee: { include: { user: { select: { fullName: true } } } } } },
        createdBy: { include: { user: { select: { fullName: true } } } },
      },
      orderBy: { startTime: "desc" },
    });

    res.json(meetings);
  } catch (error) {
    next(error);
  }
}

export async function getMeetingQRHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!meeting) throw new NotFoundError("Uchrashuv");

    const token = generateQRToken(meeting.id);
    const format = req.query.format as string;

    if (format === "json") {
      const dataURL = await generateQRDataURL(token);
      res.json({ qrDataURL: dataURL, token, meetingId: meeting.id });
      return;
    }

    const buffer = await generateQRBuffer(token);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="meeting-${meeting.id}.png"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function scanQRHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const { token } = req.body as { token?: string };
    if (!token) throw new AppError("QR token talab qilinadi", 400);

    const payload = verifyQRToken(token);
    if (!payload) throw new AppError("Yaroqsiz yoki muddati o'tgan QR kod", 400);

    const meeting = await prisma.meeting.findUnique({
      where: { id: payload.meetingId },
      include: {
        participants: { where: { employeeId: req.user.employeeId } },
      },
    });

    if (!meeting) throw new NotFoundError("Uchrashuv");

    const existing = meeting.participants[0];
    if (existing && existing.isPresent) {
      throw new AppError("Siz allaqachon belgilangansiz", 409);
    }

    await prisma.meetingParticipant.upsert({
      where: { meetingId_employeeId: { meetingId: meeting.id, employeeId: req.user.employeeId } },
      create: {
        meetingId: meeting.id,
        employeeId: req.user.employeeId,
        isPresent: true,
        checkedInAt: new Date(),
        checkInMethod: "QR",
      },
      update: {
        isPresent: true,
        checkedInAt: new Date(),
        checkInMethod: "QR",
      },
    });

    await createAuditLog({
      action: AuditAction.MEETING_CONFIRMED,
      actorId: req.user.userId,
      actorType: req.user.role,
      description: `QR kod orqali uchrashuvda qatnashdi: ${meeting.title}`,
      metadata: { meetingId: meeting.id, checkInMethod: "QR" },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: req.user.organizationId,
    });

    res.json({ message: "Qatnashishingiz tasdiqlandi", meetingId: meeting.id });
  } catch (error) {
    next(error);
  }
}
