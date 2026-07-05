import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { uploadCSV } from "../middleware/upload";
import {
  createEmployeeHandler,
  getEmployeesHandler,
  getEmployeeByIdHandler,
  updateEmployeeHandler,
  deleteEmployeeHandler,
  getSuspiciousActivitiesHandler,
  getDashboardStatsHandler,
  getSystemStatsHandler,
} from "../controllers/admin";
import { importEmployeesHandler } from "../controllers/import";
import { setMaintenanceMode, getMaintenanceMessage, isMaintenanceMode } from "../middleware/maintenance";

export const adminRouter = Router();

adminRouter.get("/dashboard", authenticate, authorize("SUPER_ADMIN"), getDashboardStatsHandler);
adminRouter.get("/stats", authenticate, authorize("SUPER_ADMIN"), getSystemStatsHandler);
adminRouter.get("/maintenance", authenticate, authorize("SUPER_ADMIN"), async (_req, res, next) => {
  try {
    const message = await getMaintenanceMessage();
    res.json({ maintenance: await isMaintenanceMode(), message });
  } catch (error) { next(error); }
});
adminRouter.post("/maintenance", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const { enabled, message } = req.body;
    await setMaintenanceMode(enabled, message);
    res.json({ maintenance: enabled, message: enabled ? "Xizmat rejimi yoqildi" : "Xizmat rejimi o'chirildi" });
  } catch (error) { next(error); }
});
adminRouter.post("/employees/import", authenticate, authorize("SUPER_ADMIN"), uploadCSV.single("file"), importEmployeesHandler);
adminRouter.get("/employees", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), getEmployeesHandler);
adminRouter.post("/employees", authenticate, authorize("SUPER_ADMIN"), createEmployeeHandler);
adminRouter.get("/employees/:id", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), getEmployeeByIdHandler);
adminRouter.put("/employees/:id", authenticate, authorize("SUPER_ADMIN"), updateEmployeeHandler);
adminRouter.delete("/employees/:id", authenticate, authorize("SUPER_ADMIN"), deleteEmployeeHandler);
adminRouter.get("/suspicious-activities", authenticate, authorize("SUPER_ADMIN"), getSuspiciousActivitiesHandler);


