import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { checkInLimiter } from "../middleware/rateLimiter";
import { uploadSelfie } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { checkInHandler, checkOutHandler, getTodayHandler, getHistoryHandler, getStatsHandler, getDepartmentAttendanceHandler } from "../controllers/attendance";

const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  wifiSSID: z.string().optional(),
  mockLocation: z.boolean().default(false),
  deviceInfo: z.string().optional(),
});

const checkOutSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deviceInfo: z.string().optional(),
});

export const attendanceRouter = Router();

attendanceRouter.post(
  "/check-in",
  authenticate,
  checkInLimiter,
  uploadSelfie.single("selfie"),
  validate(checkInSchema),
  checkInHandler
);

attendanceRouter.post(
  "/check-out",
  authenticate,
  validate(checkOutSchema),
  checkOutHandler
);

attendanceRouter.get("/today", authenticate, getTodayHandler);
attendanceRouter.get("/history", authenticate, getHistoryHandler);
attendanceRouter.get("/stats", authenticate, getStatsHandler);
attendanceRouter.get(
  "/department/:departmentId",
  authenticate,
  authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"),
  getDepartmentAttendanceHandler
);
