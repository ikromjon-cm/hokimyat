import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
  createOrganizationHandler,
  getOrganizationsHandler,
  getOrganizationByIdHandler,
  updateOrganizationHandler,
  updateOrganizationSettingsHandler,
  deleteOrganizationHandler,
} from "../controllers/organization";

export const organizationRouter = Router();

organizationRouter.post("/", authenticate, authorize("SUPER_ADMIN"), createOrganizationHandler);
organizationRouter.get("/", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), getOrganizationsHandler);
organizationRouter.get("/:id", authenticate, getOrganizationByIdHandler);
organizationRouter.put("/:id", authenticate, authorize("SUPER_ADMIN"), updateOrganizationHandler);
organizationRouter.put("/:id/settings", authenticate, authorize("SUPER_ADMIN"), updateOrganizationSettingsHandler);
organizationRouter.delete("/:id", authenticate, authorize("SUPER_ADMIN"), deleteOrganizationHandler);
