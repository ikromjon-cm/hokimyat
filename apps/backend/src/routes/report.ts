import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { generateExcelReport, generatePDFReport } from "../controllers/report";

export const reportRouter = Router();

reportRouter.get("/excel", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), generateExcelReport);
reportRouter.get("/pdf", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), generatePDFReport);
