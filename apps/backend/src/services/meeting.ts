import { prisma } from "./prisma";
import { sendSMS } from "./sms";
import { sendPushNotification, sendBulkPushNotification } from "./notification";
import { createAuditLog } from "../middleware/audit";
import { AppError, ConflictError, NotFoundError } from "../middleware/errorHandler";
import { AuditAction, MeetingStatus, ParticipantStatus, NotificationType, NotificationChannel } from "@prisma/client";

interface CreateMeetingData {
  title: string;
  agenda?: string;
  description?: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  location?: string;
  latitude?: number;
  longitude?: number;
  isOnline?: boolean;
  meetingLink?: string;
  organizationId: string;
  departmentId?: string;
  createdById: string;
  isGlobal?: boolean;
  participantIds: string[];
  overseerIds?: string[];
}

export async function createMeeting(data: CreateMeetingData) {
  const meeting = await prisma.meeting.create({
    data: {
      title: data.title,
      agenda: data.agenda,
      description: data.description,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      isOnline: data.isOnline || false,
      meetingLink: data.meetingLink,
      organizationId: data.organizationId,
      departmentId: data.departmentId,
      createdById: data.createdById,
      isGlobal: data.isGlobal || false,
      participants: {
        create: data.participantIds.map((employeeId) => ({
          employeeId,
          status: ParticipantStatus.PENDING,
        })),
      },
      overseers: data.overseerIds
        ? {
            create: data.overseerIds.map((employeeId) => ({
              employeeId,
            })),
          }
        : undefined,
    },
    include: {
      participants: {
        include: {
          employee: {
            include: { user: { select: { id: true, phone: true, fullName: true } } },
          },
        },
      },
      overseers: {
        include: {
          employee: {
            include: { user: { select: { id: true, phone: true, fullName: true } } },
          },
        },
      },
      createdBy: {
        include: { user: { select: { fullName: true } } },
      },
    },
  });

  const notificationData = {
    type: "MEETING_CREATED" as NotificationType,
    channel: "BOTH" as NotificationChannel,
    title: "Yangi uchrashuv",
    body: `"${data.title}" uchrashuviga taklif qilindingiz`,
    data: { meetingId: meeting.id, date: data.date, startTime: data.startTime },
  };

  const notification = await prisma.notification.create({
    data: {
      type: notificationData.type,
      channel: notificationData.channel,
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data as any,
      status: "PENDING",
    },
  });

  for (const participant of meeting.participants) {
    const user = participant.employee.user;

    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        notificationId: notification.id,
        type: notificationData.type,
        channel: notificationData.channel,
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data as any,
      },
    });

    try {
      await sendSMS(user.phone, `UYCHI MAJLIS: "${data.title}" uchrashuviga taklif qilindingiz. Sana: ${new Date(data.date).toLocaleDateString("uz-UZ")}, Vaqt: ${new Date(data.startTime).toLocaleTimeString("uz-UZ")}`);
    } catch (err) {
      console.error(`[Meeting] SMS yuborishda xatolik ${user.phone}:`, err);
    }

    await sendPushNotification(user.id, {
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data as any,
    });
  }

  // TZ 3.2: notify each overseer (nazoratchi). They are not participants but
  // must be informed that a meeting was scheduled, with the participant count.
  for (const overseer of meeting.overseers) {
    const user = overseer.employee.user;
    const overseerBody = `${meeting.participants.length} kishi ishtirokida majlis rejalashtirildi: "${data.title}", ${new Date(data.date).toLocaleDateString("uz-UZ")} ${new Date(data.startTime).toLocaleTimeString("uz-UZ")}`;

    await prisma.notificationLog.create({
      data: {
        userId: user.id,
        notificationId: notification.id,
        type: notificationData.type,
        channel: notificationData.channel,
        title: "Majlis (nazoratchi)",
        body: overseerBody,
        data: notificationData.data as any,
      },
    });

    try {
      await sendSMS(user.phone, `UYCHI MAJLIS: ${overseerBody}`);
    } catch (err) {
      console.error(`[Meeting] Nazoratchiga SMS xatolik ${user.phone}:`, err);
    }

    await sendPushNotification(user.id, {
      title: "Majlis rejalashtirildi (nazoratchi)",
      body: overseerBody,
      data: notificationData.data as any,
    });
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { status: "SENT", sentAt: new Date() },
  });

  await createAuditLog({
    action: AuditAction.MEETING_CREATED,
    actorId: data.createdById,
    actorType: "EMPLOYEE",
    description: `"${data.title}" uchrashuvi yaratildi`,
    metadata: { meetingId: meeting.id, participantCount: data.participantIds.length },
    organizationId: data.organizationId,
  });

  return meeting;
}

export async function confirmParticipation(meetingId: string, employeeId: string) {
  const participant = await prisma.meetingParticipant.findUnique({
    where: { meetingId_employeeId: { meetingId, employeeId } },
  });

  if (!participant) {
    throw new NotFoundError("Ishtirokchi");
  }

  if (participant.status !== ParticipantStatus.PENDING) {
    throw new ConflictError("Ishtirok holati allaqachon o'zgartirilgan");
  }

  const updated = await prisma.meetingParticipant.update({
    where: { id: participant.id },
    data: { status: ParticipantStatus.CONFIRMED, confirmedAt: new Date() },
  });

  await createAuditLog({
    action: AuditAction.MEETING_CONFIRMED,
    actorId: employeeId,
    actorType: "EMPLOYEE",
    description: "Uchrashuvda qatnashish tasdiqlandi",
    metadata: { meetingId },
  });

  return updated;
}

export async function cancelMeeting(meetingId: string, userId: string) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      participants: { include: { employee: { include: { user: true } } } },
    },
  });

  if (!meeting) throw new NotFoundError("Uchrashuv");
  if (meeting.status === MeetingStatus.CANCELLED) {
    throw new ConflictError("Uchrashuv allaqachon bekor qilingan");
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: MeetingStatus.CANCELLED },
  });

  const participantUserIds = meeting.participants
    .filter((p) => p.employee.user)
    .map((p) => p.employee.user.id);

  await sendBulkPushNotification(participantUserIds, {
    title: "Uchrashuv bekor qilindi",
    body: `"${meeting.title}" uchrashuvi bekor qilindi`,
    data: { type: "MEETING_CANCELLED", meetingId },
  });

  await createAuditLog({
    action: AuditAction.MEETING_CANCELLED,
    actorId: userId,
    actorType: "USER",
    description: `"${meeting.title}" uchrashuvi bekor qilindi`,
    metadata: { meetingId },
    organizationId: meeting.organizationId,
  });
}

export async function getEmployeeMeetings(employeeId: string, status?: ParticipantStatus) {
  const where: any = { employeeId };
  if (status) where.status = status;

  const participations = await prisma.meetingParticipant.findMany({
    where,
    include: {
      meeting: {
        include: {
          createdBy: {
            include: { user: { select: { fullName: true } } },
          },
          overseers: {
            include: {
              employee: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { meeting: { startTime: "desc" } },
  });

  return participations.map((p) => ({
    ...p.meeting,
    participationStatus: p.status,
    confirmedAt: p.confirmedAt,
  }));
}

export async function getPendingMeetings(employeeId: string) {
  return getEmployeeMeetings(employeeId, ParticipantStatus.PENDING);
}
