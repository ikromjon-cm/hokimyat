import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  createDepartmentHandler,
  getDepartmentsHandler,
  getDepartmentByIdHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
} from "../controllers/department";

export const departmentRouter = Router();

departmentRouter.post("/", authenticate, authorize("SUPER_ADMIN"), createDepartmentHandler);
departmentRouter.get("/", authenticate, getDepartmentsHandler);
departmentRouter.get("/:id", authenticate, getDepartmentByIdHandler);
departmentRouter.put("/:id", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), updateDepartmentHandler);
departmentRouter.delete("/:id", authenticate, authorize("SUPER_ADMIN"), deleteDepartmentHandler);
