import { Request, Response, NextFunction } from "express";
import { getRedis } from "../services/redis";

const MAINTENANCE_KEY = "system:maintenance";

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const redis = getRedis();
    if (!redis) return false;
    const val = await redis.get(MAINTENANCE_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function setMaintenanceMode(enabled: boolean, message?: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  if (enabled) {
    await redis.setex(MAINTENANCE_KEY, 86400, "true");
    if (message) {
      await redis.setex("system:maintenance_message", 86400, message);
    }
  } else {
    await redis.del(MAINTENANCE_KEY);
    await redis.del("system:maintenance_message");
  }
}

export async function getMaintenanceMessage(): Promise<string> {
  try {
    const redis = getRedis();
    if (!redis) return "Tizim texnik xizmat ko'rsatish rejimida. Birozdan so'ng urinib ko'ring.";
    const msg = await redis.get("system:maintenance_message");
    return msg || "Tizim texnik xizmat ko'rsatish rejimida. Birozdan so'ng urinib ko'ring.";
  } catch {
    return "Tizim texnik xizmat ko'rsatish rejimida. Birozdan so'ng urinib ko'ring.";
  }
}

export async function maintenanceMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health" || req.path.startsWith("/api-docs") || req.path === "/metrics") {
    return next();
  }

  const isAdmin = (req as any).user?.role === "SUPER_ADMIN";
  if (isAdmin) return next();

  const maintenance = await isMaintenanceMode();
  if (!maintenance) return next();

  const message = await getMaintenanceMessage();
  res.status(503).json({
    error: {
      message,
      code: "MAINTENANCE_MODE",
      retryAfter: 3600,
    },
  });
}
