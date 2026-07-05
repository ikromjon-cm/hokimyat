import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UnauthorizedError, ForbiddenError } from "./errorHandler";
import { isTokenBlacklisted } from "../services/redis";
import { prisma } from "../services/prisma";

export interface JwtPayload {
  userId: string;
  phone: string;
  role: string;
  roleId: string;
  organizationId?: string;
  departmentId?: string;
  employeeId?: string;
  jti: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token taqdim etilmagan");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    if (await isTokenBlacklisted(decoded.jti)) {
      throw new UnauthorizedError("Token bloklangan");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("Foydalanuvchi faol emas");
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Token muddati tugagan"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError("Yaroqsiz token"));
    } else {
      next(error);
    }
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      next(new ForbiddenError("Ushbu amal uchun ruxsat yo'q"));
      return;
    }
    next();
  };
}

export function authorizePermission(resource: string, action: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new UnauthorizedError());
        return;
      }

      if (req.user.role === "SUPER_ADMIN") {
        next();
        return;
      }

      const permission = await prisma.permission.findFirst({
        where: {
          roleId: req.user.roleId,
          resource,
          action,
        },
      });

      if (!permission) {
        next(new ForbiddenError(`"${resource}" resursida "${action}" amali uchun ruxsat yo'q`));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
