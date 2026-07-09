import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { checkInLimiter } from "../middleware/rateLimiter";
import { uploadSelfie } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { z } from "zod";
import { checkInHandler, checkOutHandler, getTodayHandler, getHistoryHandler, getStatsHandler, getDepartmentAttendanceHandler } from "../controllers/attendance";

// Check-in is submitted as multipart/form-data (for the selfie), so every field
// arrives as a string. Coerce numbers and parse the boolean explicitly
// (z.coerce.boolean() would treat the string "false" as true).
const checkInSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  wifiSSID: z.string().optional(),
  mockLocation: z.preprocess((v) => v === "true" || v === true, z.boolean()).default(false),
  deviceInfo: z.string().optional(),
});

const checkOutSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
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
