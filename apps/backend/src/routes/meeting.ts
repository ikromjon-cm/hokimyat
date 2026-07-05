import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { createMeetingHandler, confirmMeetingHandler, cancelMeetingHandler, getMyMeetingsHandler, getPendingMeetingsHandler, getMeetingByIdHandler, getDepartmentMeetingsHandler, getMeetingQRHandler, scanQRHandler } from "../controllers/meeting";

export const meetingRouter = Router();

meetingRouter.get("/my", authenticate, getMyMeetingsHandler);
meetingRouter.get("/pending", authenticate, getPendingMeetingsHandler);
meetingRouter.get("/:id", authenticate, getMeetingByIdHandler);
meetingRouter.post("/", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), createMeetingHandler);
meetingRouter.post("/:id/confirm", authenticate, confirmMeetingHandler);
meetingRouter.post("/:id/cancel", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), cancelMeetingHandler);
meetingRouter.get("/department/:departmentId", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), getDepartmentMeetingsHandler);
meetingRouter.get("/:id/qr-code", authenticate, getMeetingQRHandler);
meetingRouter.post("/scan-qr", authenticate, scanQRHandler);
