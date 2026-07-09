import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/prisma";
import { createAuditLog } from "../middleware/audit";
import { AppError } from "../middleware/errorHandler";
import { AuditAction, Employee } from "@prisma/client";

export async function createEmployeeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, fullName, position, organizationId, departmentId, dateOfBirth, hireDate, address } = req.body;

    if (!phone || !fullName || !organizationId || !departmentId) {
      throw new AppError("Telefon, ism, tashkilot va bo'lim majburiy", 400, "MISSING_FIELDS");
    }
    // Employee code is required + unique; auto-generate a stable one if omitted.
    const employeeCode = req.body.employeeCode || `EMP-${String(phone).replace(/\D/g, "").slice(-6)}`;

    const user = await prisma.user.create({
      data: {
        phone,
        fullName,
        organization: organizationId ? { connect: { id: organizationId } } : undefined,
        department: departmentId ? { connect: { id: departmentId } } : undefined,
        role: {
          connectOrCreate: {
            where: { name: "EMPLOYEE" },
            create: { name: "EMPLOYEE", description: "Xodim", isSystem: true },
          },
        },
        employee: {
          create: {
            employeeCode,
            position,
            organization: { connect: { id: organizationId } },
            department: { connect: { id: departmentId } },
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            hireDate: hireDate ? new Date(hireDate) : new Date(),
            address,
          },
        },
      },
      include: { employee: true, role: true },
    });

    await createAuditLog({
      action: AuditAction.EMPLOYEE_CREATED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: `Xodim yaratildi: ${fullName} (${employeeCode})`,
      metadata: { userId: user.id, employeeId: user.employee?.id },
      organizationId,
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function getEmployeesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const organizationId = req.query.organizationId as string;
    const departmentId = req.query.departmentId as string;
    const search = req.query.search as string;
    const isActive = req.query.isActive as string;

    const where: any = { deletedAt: null };
    if (organizationId) where.organizationId = organizationId;
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { employeeCode: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { user: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, phone: true, status: true, avatarUrl: true } },
          organization: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({ employees, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeeByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: {
        // Never expose refreshToken/totpSecret/backup codes via the admin view.
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            status: true,
            avatarUrl: true,
            totpEnabled: true,
            lastLoginAt: true,
            createdAt: true,
            role: { select: { name: true, description: true } },
            devices: {
              where: { isActive: true },
              select: { id: true, deviceName: true, platform: true, osVersion: true, lastUsedAt: true },
            },
          },
        },
        organization: true,
        department: true,
      },
    });
    if (!employee) {
      return res.status(404).json({ error: { message: "Xodim topilmadi" } });
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, position, departmentId, isActive, address, emergencyContact, emergencyPhone, dateOfBirth } = req.body;

    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        position,
        departmentId,
        isActive,
        address,
        emergencyContact,
        emergencyPhone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        user: fullName ? { update: { fullName } } : undefined,
      },
      include: { user: { select: { fullName: true, phone: true } } },
    });

    await createAuditLog({
      action: AuditAction.EMPLOYEE_UPDATED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: `Xodim yangilandi: ${employee.employeeCode}`,
      metadata: { employeeId: employee.id },
    });

    res.json(employee);
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployeeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!employee) return res.status(404).json({ error: { message: "Xodim topilmadi" } });

    await prisma.employee.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await prisma.user.update({
      where: { id: employee.userId },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });

    await createAuditLog({
      action: AuditAction.EMPLOYEE_DELETED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: `Xodim o'chirildi: ${employee.employeeCode}`,
      metadata: { employeeId: employee.id },
    });

    res.json({ message: "Xodim o'chirildi" });
  } catch (error) {
    next(error);
  }
}

export async function getSuspiciousActivitiesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { action: AuditAction.MOCK_LOCATION_ATTEMPT },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where: { action: AuditAction.MOCK_LOCATION_ATTEMPT } }),
    ]);

    res.json({ activities: logs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStatsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalEmployees,
      totalOrganizations,
      todayCheckIns,
      activeMeetings,
      pendingMeetings,
      suspiciousCount,
    ] = await Promise.all([
      prisma.employee.count({ where: { isActive: true, deletedAt: null } }),
      prisma.organization.count({ where: { deletedAt: null } }),
      prisma.attendance.count({
        where: { date: { gte: today, lt: tomorrow }, type: "CHECK_IN" },
      }),
      prisma.meeting.count({ where: { status: { in: ["SCHEDULED", "ONGOING"] } } }),
      prisma.meetingParticipant.count({ where: { status: "PENDING" } }),
      prisma.auditLog.count({ where: { action: AuditAction.MOCK_LOCATION_ATTEMPT, createdAt: { gte: today, lt: tomorrow } } }),
    ]);

    res.json({
      totalEmployees,
      totalOrganizations,
      todayCheckIns,
      activeMeetings,
      pendingConfirmations: pendingMeetings,
      suspiciousActivitiesToday: suspiciousCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemStatsHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalAttendance,
      totalMeetings,
      auditCount,
      recentAttendance,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.attendance.count(),
      prisma.meeting.count({ where: { deletedAt: null } }),
      prisma.auditLog.count(),
      prisma.attendance.groupBy({
        by: ["date"],
        where: { date: { gte: thirtyDaysAgo } },
        _count: true,
        orderBy: { date: "asc" },
      }),
    ]);

    res.json({
      totalUsers,
      totalAttendance,
      totalMeetings,
      auditCount,
      dailyAttendance: recentAttendance,
    });
  } catch (error) {
    next(error);
  }
}
