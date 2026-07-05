import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/prisma";

export async function getMyNotificationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.json([]);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [notifications, total] = await Promise.all([
      prisma.notificationLog.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationLog.count({ where: { userId: req.user.userId } }),
    ]);

    res.json({ notifications, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
}

export async function markAsReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    await prisma.notificationLog.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ message: "Bildirishnoma o'qilgan deb belgilandi" });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    await prisma.notificationLog.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ message: "Barcha bildirishnomalar o'qilgan deb belgilandi" });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.json({ count: 0 });

    const count = await prisma.notificationLog.count({
      where: { userId: req.user.userId, isRead: false },
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
}
