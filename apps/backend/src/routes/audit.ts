import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getAuditLogsHandler, verifyAuditChainHandler } from "../controllers/audit";

export const auditRouter = Router();

auditRouter.get("/", authenticate, authorize("SUPER_ADMIN"), getAuditLogsHandler);
auditRouter.get("/verify-chain", authenticate, authorize("SUPER_ADMIN"), verifyAuditChainHandler);
