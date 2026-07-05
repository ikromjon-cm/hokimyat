import { Request, Response, NextFunction } from "express";
import { AuditAction } from "@prisma/client";
import { processCheckIn, processCheckOut, getTodayAttendance, getAttendanceHistory, getAttendanceStats, getDepartmentAttendance } from "../services/attendance";
import { ForbiddenError } from "../middleware/errorHandler";
import { createAuditLog } from "../middleware/audit";

export async function checkInHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId || !req.user?.organizationId) {
      throw new ForbiddenError("Xodim profili to'ldirilmagan");
    }

    const data = req.body as { latitude: number; longitude: number; wifiSSID?: string; mockLocation: boolean; deviceInfo?: string };
    const selfieFile = req.file;

    const result = await processCheckIn({
      employeeId: req.user.employeeId,
      organizationId: req.user.organizationId,
      latitude: data.latitude,
      longitude: data.longitude,
      wifiSSID: data.wifiSSID,
      mockLocation: data.mockLocation,
      deviceInfo: data.deviceInfo,
      selfieBuffer: selfieFile?.buffer,
      selfieMimeType: selfieFile?.mimetype,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    await createAuditLog({
      action: AuditAction.ATTENDANCE_CHECK_IN,
      actorId: req.user.userId,
      actorType: req.user.role,
      description: "Ish kuni boshlandi (check-in)",
      metadata: { mockLocation: data.mockLocation, hasSelfie: !!selfieFile },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: req.user.organizationId,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function checkOutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId || !req.user?.organizationId) {
      throw new ForbiddenError("Xodim profili to'ldirilmagan");
    }

    const data = req.body as { latitude?: number; longitude?: number; deviceInfo?: string };

    const result = await processCheckOut({
      employeeId: req.user.employeeId,
      organizationId: req.user.organizationId,
      latitude: data.latitude,
      longitude: data.longitude,
      deviceInfo: data.deviceInfo,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    await createAuditLog({
      action: AuditAction.ATTENDANCE_CHECK_OUT,
      actorId: req.user.userId,
      actorType: req.user.role,
      description: "Ish kuni tugadi (check-out)",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: req.user.organizationId,
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getTodayHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const records = await getTodayAttendance(req.user.employeeId);
    res.json(records);
  } catch (error) {
    next(error);
  }
}

export async function getHistoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const result = await getAttendanceHistory(req.user.employeeId, startDate, endDate, page, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getStatsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const stats = await getAttendanceStats(req.user.employeeId, startDate, endDate);
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentAttendanceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const departmentId = req.params.departmentId;
    const date = req.query.date ? new Date(req.query.date as string) : new Date();

    const result = await getDepartmentAttendance(departmentId, date);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
