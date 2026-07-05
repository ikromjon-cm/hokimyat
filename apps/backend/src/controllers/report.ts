import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { prisma } from "../services/prisma";
import { createAuditLog } from "../middleware/audit";
import { AuditAction } from "@prisma/client";

export async function generateExcelReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, organizationId, departmentId, employeeId } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      date: { gte: start, lte: end },
    };
    if (organizationId) where.organizationId = organizationId;
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.employee = { departmentId };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { fullName: true, phone: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: "asc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "UYCHI MAJLIS";
    const sheet = workbook.addWorksheet("Davomat");

    sheet.columns = [
      { header: "Sana", key: "date", width: 15 },
      { header: "Xodim", key: "employee", width: 25 },
      { header: "Bo'lim", key: "department", width: 20 },
      { header: "Telefon", key: "phone", width: 15 },
      { header: "Tur", key: "type", width: 10 },
      { header: "Vaqt", key: "time", width: 10 },
      { header: "Ishonchlilik", key: "confidence", width: 15 },
      { header: "Masofa (m)", key: "distance", width: 12 },
      { header: "WiFi", key: "wifi", width: 10 },
    ];

    records.forEach((r) => {
      sheet.addRow({
        date: r.date.toLocaleDateString("uz-UZ"),
        employee: r.employee.user.fullName || "Noma'lum",
        department: r.employee.department?.name || "-",
        phone: r.employee.user.phone,
        type: r.type === "CHECK_IN" ? "Kirish" : "Chiqish",
        time: r.timestamp.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        confidence: r.confidence || "-",
        distance: r.distance ? Math.round(r.distance) : "-",
        wifi: r.wifiMatched ? "Ha" : "Yo'q",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=davomat_${start.toISOString().split("T")[0]}_${end.toISOString().split("T")[0]}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();

    await createAuditLog({
      action: AuditAction.REPORT_GENERATED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: "Excel hisobot yaratildi",
      metadata: { format: "excel", startDate: start, endDate: end },
    });
  } catch (error) {
    next(error);
  }
}

export async function generatePDFReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, organizationId, departmentId, employeeId } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate as string) : new Date();

    const where: any = {
      date: { gte: start, lte: end },
      type: "CHECK_IN",
    };
    if (organizationId) where.organizationId = organizationId;
    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.employee = { departmentId };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            user: { select: { fullName: true, phone: true } },
            department: { select: { name: true } },
          },
        },
      },
      orderBy: [ { date: "asc" }, { timestamp: "asc" } ],
    });

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=davomat_${start.toISOString().split("T")[0]}_${end.toISOString().split("T")[0]}.pdf`);

    doc.pipe(res);

    doc.fontSize(20).text("UYCHI MAJLIS", { align: "center" });
    doc.fontSize(16).text("Davomat hisoboti", { align: "center" });
    doc.fontSize(10).text(`${start.toLocaleDateString("uz-UZ")} - ${end.toLocaleDateString("uz-UZ")}`, { align: "center" });
    doc.moveDown();

    const tableTop = doc.y;
    const colWidths = [80, 100, 80, 60, 60, 60];
    const headers = ["Sana", "Xodim", "Bo'lim", "Kirish", "Ishonchlilik", "Masofa"];

    doc.fontSize(8).font("Helvetica-Bold");
    let xPos = 30;
    headers.forEach((h, i) => {
      doc.text(h, xPos, tableTop, { width: colWidths[i], align: "left" });
      xPos += colWidths[i];
    });

    doc.moveDown(0.5);
    let yPos = doc.y;

    doc.font("Helvetica").fontSize(7);
    records.forEach((r) => {
      if (yPos > 750) {
        doc.addPage();
        yPos = 30;
      }

      xPos = 30;
      const row = [
        r.date.toLocaleDateString("uz-UZ"),
        r.employee.user.fullName || "-",
        r.employee.department?.name || "-",
        r.timestamp.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        r.confidence || "-",
        r.distance ? `${Math.round(r.distance)}m` : "-",
      ];

      row.forEach((cell, i) => {
        doc.text(cell, xPos, yPos, { width: colWidths[i], align: "left" });
        xPos += colWidths[i];
      });

      yPos += 15;
    });

    doc.end();

    await createAuditLog({
      action: AuditAction.REPORT_GENERATED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: "PDF hisobot yaratildi",
      metadata: { format: "pdf", startDate: start, endDate: end },
    });
  } catch (error) {
    next(error);
  }
}
