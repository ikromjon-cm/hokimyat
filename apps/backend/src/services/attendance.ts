import { prisma } from "./prisma";
import { calculateDistance, isWithinGeofence, getConfidenceLevel } from "../utils/haversine";
import { saveSelfie } from "./storage";
import { createAuditLog } from "../middleware/audit";
import { AppError, ConflictError } from "../middleware/errorHandler";
import { AuditAction, ConfidenceLevel } from "@prisma/client";
import { sendPushNotification } from "./notification";

interface CheckInData {
  employeeId: string;
  organizationId: string;
  latitude: number;
  longitude: number;
  wifiSSID?: string;
  mockLocation: boolean;
  deviceInfo?: string;
  selfieBuffer?: Buffer;
  selfieMimeType?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface CheckOutData {
  employeeId: string;
  organizationId: string;
  latitude?: number;
  longitude?: number;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function processCheckIn(data: CheckInData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingCheckIn = await prisma.attendance.findFirst({
    where: {
      employeeId: data.employeeId,
      date: today,
      type: "CHECK_IN",
    },
  });

  if (existingCheckIn) {
    throw new ConflictError("Bugungi kirish allaqachon qayd etilgan");
  }

  const organization = await prisma.organization.findUnique({
    where: { id: data.organizationId },
    select: {
      latitude: true,
      longitude: true,
      geofenceRadius: true,
      wifiSSID: true,
    },
  });

  if (!organization?.latitude || !organization?.longitude) {
    throw new AppError("Tashkilot joylashuvi sozlanmagan", 400, "LOCATION_NOT_CONFIGURED");
  }

  let distance: number | null = null;
  let isInside: boolean = false;
  let wifiMatched: boolean = false;

  distance = calculateDistance(
    data.latitude,
    data.longitude,
    organization.latitude,
    organization.longitude
  );

  isInside = isWithinGeofence(
    data.latitude,
    data.longitude,
    organization.latitude,
    organization.longitude,
    organization.geofenceRadius || 100
  );

  if (data.wifiSSID && organization.wifiSSID) {
    wifiMatched = data.wifiSSID.toLowerCase() === organization.wifiSSID.toLowerCase();
  }

  const confidence = getConfidenceLevel(isInside, wifiMatched, data.mockLocation);

  if (data.mockLocation) {
    await createAuditLog({
      action: AuditAction.MOCK_LOCATION_ATTEMPT,
      actorId: data.employeeId,
      actorType: "EMPLOYEE",
      description: "Xodim soxta lokatsiyadan foydalanishga urindi",
      metadata: { latitude: data.latitude, longitude: data.longitude, deviceInfo: data.deviceInfo },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      organizationId: data.organizationId,
    });

    const admins = await prisma.user.findMany({
      where: {
        organizationId: data.organizationId,
        role: { name: { in: ["SUPER_ADMIN", "DEPARTMENT_HEAD"] } },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await sendPushNotification(admin.id, {
        title: "Soxta lokatsiya aniqlandi",
        body: "Xodim soxta lokatsiyadan foydalanishga urindi",
        data: { type: "SUSPICIOUS_ACTIVITY", employeeId: data.employeeId },
      });
    }
  }

  let selfiePath: string | null = null;
  let selfieHash: string | null = null;

  if (data.selfieBuffer) {
    const saved = await saveSelfie(data.employeeId, data.selfieBuffer, data.selfieMimeType || "image/jpeg");
    selfiePath = saved.filePath;
    selfieHash = saved.fileHash;
  }

  const attendance = await prisma.attendance.create({
    data: {
      employeeId: data.employeeId,
      organizationId: data.organizationId,
      date: today,
      type: "CHECK_IN",
      timestamp: new Date(),
      latitude: data.latitude,
      longitude: data.longitude,
      distance,
      confidence: confidence as ConfidenceLevel,
      wifiSSID: data.wifiSSID || null,
      wifiMatched,
      mockLocation: data.mockLocation,
      deviceInfo: data.deviceInfo,
      selfiePath,
      selfieHash,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });

  await createAuditLog({
    action: AuditAction.ATTENDANCE_CHECK_IN,
    actorId: data.employeeId,
    actorType: "EMPLOYEE",
    description: `Xodim kirdi (ishonchlilik: ${confidence})`,
    metadata: { attendanceId: attendance.id, confidence, distance, wifiMatched, mockLocation: data.mockLocation },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    organizationId: data.organizationId,
  });

  return { attendance, confidence, distance, isInside, wifiMatched };
}

export async function processCheckOut(data: CheckOutData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingCheckIn = await prisma.attendance.findFirst({
    where: {
      employeeId: data.employeeId,
      date: today,
      type: "CHECK_IN",
    },
  });

  if (!existingCheckIn) {
    throw new AppError("Bugun kirmagansiz. Avval kirishni qayd eting", 400, "NO_CHECK_IN");
  }

  const existingCheckOut = await prisma.attendance.findFirst({
    where: {
      employeeId: data.employeeId,
      date: today,
      type: "CHECK_OUT",
    },
  });

  if (existingCheckOut) {
    throw new ConflictError("Bugungi chiqish allaqachon qayd etilgan");
  }

  const attendance = await prisma.attendance.create({
    data: {
      employeeId: data.employeeId,
      organizationId: data.organizationId,
      date: today,
      type: "CHECK_OUT",
      timestamp: new Date(),
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      deviceInfo: data.deviceInfo,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });

  await createAuditLog({
    action: AuditAction.ATTENDANCE_CHECK_OUT,
    actorId: data.employeeId,
    actorType: "EMPLOYEE",
    description: "Xodim chiqdi",
    metadata: { attendanceId: attendance.id },
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    organizationId: data.organizationId,
  });

  return attendance;
}

export async function getTodayAttendance(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const records = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: today, lt: tomorrow },
    },
    orderBy: { timestamp: "asc" },
  });

  return records;
}

export async function getAttendanceHistory(
  employeeId: string,
  startDate: Date,
  endDate: Date,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.attendance.count({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAttendanceStats(employeeId: string, startDate: Date, endDate: Date) {
  const records = await prisma.attendance.findMany({
    where: {
      employeeId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const presentDays = new Set(records.filter((r) => r.type === "CHECK_IN").map((r) => r.date.toISOString().split("T")[0])).size;
  const lateDays = records.filter((r) => r.type === "CHECK_IN" && r.confidence === "MEDIUM").length;
  const absentDays = totalDays - presentDays;

  return {
    totalDays,
    presentDays,
    absentDays: Math.max(0, absentDays),
    lateDays,
    attendanceRate: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
  };
}

export async function getDepartmentAttendance(
  departmentId: string,
  date: Date
) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const employees = await prisma.employee.findMany({
    where: { departmentId, isActive: true },
    select: {
      id: true,
      employeeCode: true,
      position: true,
      user: { select: { id: true, fullName: true, phone: true } },
    },
  });

  const attendance = await prisma.attendance.findMany({
    where: {
      employee: { departmentId },
      date: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { timestamp: "asc" },
  });

  const attendanceMap = new Map<string, any>();
  attendance.forEach((record) => {
    if (!attendanceMap.has(record.employeeId)) {
      attendanceMap.set(record.employeeId, {});
    }
    const empAttendance = attendanceMap.get(record.employeeId);
    if (record.type === "CHECK_IN") {
      empAttendance.checkIn = record;
    } else if (record.type === "CHECK_OUT") {
      empAttendance.checkOut = record;
    }
  });

  return employees.map((emp) => ({
    employee: emp,
    attendance: attendanceMap.get(emp.id) || null,
  }));
}
