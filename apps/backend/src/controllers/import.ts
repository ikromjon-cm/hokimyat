import { Request, Response, NextFunction } from "express";
import { importEmployees, parseCSV } from "../services/import";

export async function importEmployeesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.organizationId) {
      res.status(400).json({ error: { message: "Tashkilot tanlanmagan" } });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: { message: "Fayl yuklanmadi" } });
      return;
    }

    const content = req.file.buffer.toString("utf-8");
    const rows = parseCSV(content);

    if (rows.length === 0) {
      res.status(400).json({ error: { message: "Faylda ma'lumot topilmadi. CSV formati: phone,fullName,departmentCode,position,email" } });
      return;
    }

    if (rows.length > 1000) {
      res.status(400).json({ error: { message: "Bir vaqtda 1000 tadan ko'p xodim yuklab bo'lmaydi" } });
      return;
    }

    const result = await importEmployees(rows, req.user.organizationId);

    res.json({
      message: `${result.success} ta xodim import qilindi, ${result.failed} ta xatolik`,
      result,
    });
  } catch (error) {
    next(error);
  }
}
