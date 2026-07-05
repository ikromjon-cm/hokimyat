import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { generateAttendanceCertificate, generateMeetingMinutes, generateOrderDocument } from "../services/documentGenerator";
import { prisma } from "../services/prisma";

export const documentRouter = Router();

documentRouter.get("/attendance-certificate/:employeeId", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), async (req, res, next) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const pdf = await generateAttendanceCertificate(req.params.employeeId, startDate, endDate);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=attendance-certificate-${req.params.employeeId}.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

documentRouter.get("/meeting-minutes/:meetingId", authenticate, async (req, res, next) => {
  try {
    const pdf = await generateMeetingMinutes(req.params.meetingId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=meeting-minutes-${req.params.meetingId}.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

documentRouter.post("/order", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      res.status(400).json({ error: { message: "Tashkilot tanlanmagan" } });
      return;
    }

    const { orderNumber, title, preamble, content, assignees, effectiveDate } = req.body;
    if (!orderNumber || !title || !content) {
      res.status(400).json({ error: { message: "Buyruq raqami, sarlavha va matn talab qilinadi" } });
      return;
    }

    const pdf = await generateOrderDocument(req.user.organizationId, {
      orderNumber,
      title,
      preamble: preamble || "",
      content,
      assignees: assignees || [],
      effectiveDate: new Date(effectiveDate || Date.now()),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=order-${orderNumber}.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});
