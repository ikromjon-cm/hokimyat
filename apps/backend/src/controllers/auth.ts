import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { requestOTP, verifyOTP } from "../services/otp";
import { generateTokenPair, verifyRefreshToken } from "../services/jwt";
import { blacklistToken } from "../services/redis";
import { createAuditLog } from "../middleware/audit";
import { AppError, UnauthorizedError } from "../middleware/errorHandler";
import { AuditAction } from "@prisma/client";

const requestOtpSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak"),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+998\d{9}$/, "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak"),
  code: z.string().length(6, "Kod 6 xonadan iborat bo'lishi kerak"),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  pushToken: z.string().optional(),
  platform: z.string().optional(),
  osVersion: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token talab qilinadi"),
});

export async function requestOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = requestOtpSchema.parse(req.body);
    const result = await requestOTP(phone);

    await createAuditLog({
      action: AuditAction.OTP_REQUESTED,
      actorType: "PHONE",
      description: `OTP kodi so'raldi: ${phone}`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    if (result.devCode) {
      // Demo/free mode: no SMS sent, code returned directly for the client to show.
      res.json({
        message: "Demo rejim: tasdiqlash kodi to'g'ridan-to'g'ri qaytarildi",
        demoMode: true,
        devCode: result.devCode,
      });
      return;
    }

    res.json({ message: "Tasdiqlash kodi SMS orqali yuborildi" });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, code, deviceId, deviceName, pushToken, platform, osVersion } = verifyOtpSchema.parse(req.body);

    await verifyOTP(phone, code);

    let user = await prisma.user.findUnique({
      where: { phone },
      include: {
        role: true,
        employee: { select: { id: true } },
        organization: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          role: {
            connectOrCreate: {
              where: { name: "EMPLOYEE" },
              create: {
                name: "EMPLOYEE",
                description: "Xodim",
                isSystem: true,
              },
            },
          },
        },
        include: {
          role: true,
          employee: { select: { id: true } },
          organization: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      });
    }

    if (deviceId) {
      await prisma.device.upsert({
        where: { userId_deviceId: { userId: user.id, deviceId } },
        create: {
          userId: user.id,
          deviceId,
          deviceName: deviceName || null,
          platform: platform || null,
          osVersion: osVersion || null,
          pushToken: pushToken || null,
        },
        update: {
          deviceName: deviceName || undefined,
          platform: platform || undefined,
          osVersion: osVersion || undefined,
          pushToken: pushToken || undefined,
          lastUsedAt: new Date(),
        },
      });
    }

    const tokenPair = generateTokenPair({
      userId: user.id,
      phone: user.phone,
      role: user.role!.name,
      roleId: user.role!.id,
      organizationId: user.organization?.id,
      departmentId: user.department?.id,
      employeeId: user.employee?.id,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken: tokenPair.refreshToken,
      },
    });

    await createAuditLog({
      action: AuditAction.LOGIN,
      actorId: user.id,
      actorType: "USER",
      description: `Foydalanuvchi tizimga kirdi: ${phone}`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: user.organization?.id,
    });

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role!.name,
        organization: user.organization,
        department: user.department,
        employeeId: user.employee?.id,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true,
        employee: { select: { id: true } },
        organization: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError("Refresh token yaroqsiz");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("Foydalanuvchi faol emas");
    }

    const tokenPair = generateTokenPair({
      userId: user.id,
      phone: user.phone,
      role: user.role!.name,
      roleId: user.role!.id,
      organizationId: user.organization?.id,
      departmentId: user.department?.id,
      employeeId: user.employee?.id,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokenPair.refreshToken },
    });

    res.json({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      accessTokenExpiresAt: tokenPair.accessTokenExpiresAt,
      refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new UnauthorizedError();

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { refreshToken: null },
    });

    if (req.user.jti) {
      const expiresIn = 7 * 24 * 60 * 60;
      await blacklistToken(req.user.jti, expiresIn);
    }

    await createAuditLog({
      action: AuditAction.LOGOUT,
      actorId: req.user.userId,
      actorType: "USER",
      description: "Foydalanuvchi tizimdan chiqdi",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      organizationId: req.user.organizationId,
    });

    res.json({ message: "Muvaffaqiyatli chiqildi" });
  } catch (error) {
    next(error);
  }
}
