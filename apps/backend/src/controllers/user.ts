import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/prisma";
import { NotFoundError, ForbiddenError } from "../middleware/errorHandler";

export async function getProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ForbiddenError();

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        role: { select: { name: true, description: true } },
        employee: true,
        organization: { select: { id: true, name: true, shortName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    if (!user) throw new NotFoundError("Foydalanuvchi");
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ForbiddenError();

    const { fullName, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { fullName, avatarUrl },
      select: { id: true, phone: true, fullName: true, avatarUrl: true },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function getUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const organizationId = req.query.organizationId as string;
    const departmentId = req.query.departmentId as string;

    const where: any = { deletedAt: null };
    if (organizationId) where.organizationId = organizationId;
    if (departmentId) where.departmentId = departmentId;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: { select: { name: true } },
          employee: { select: { employeeCode: true, position: true } },
          organization: { select: { name: true } },
          department: { select: { name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function getUserByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: {
        role: true,
        employee: true,
        organization: true,
        department: true,
        devices: { where: { isActive: true } },
      },
    });

    if (!user) throw new NotFoundError("Foydalanuvchi");
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUserRoleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { roleId } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { roleId },
      include: { role: true },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updatePreferencesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();

    const { languagePreference, themePreference } = req.body;
    const data: any = {};

    if (languagePreference && ["uz", "ru", "en"].includes(languagePreference)) {
      data.languagePreference = languagePreference;
    }
    if (themePreference && ["system", "light", "dark"].includes(themePreference)) {
      data.themePreference = themePreference;
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { id: true, languagePreference: true, themePreference: true },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}
