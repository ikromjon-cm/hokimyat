import { Request, Response, NextFunction } from "express";
import { storeReferencePhoto, getReferencePhoto, verifyFace } from "../services/faceVerification";
import { prisma } from "../services/prisma";
import { ForbiddenError } from "../middleware/errorHandler";

export async function uploadReferencePhotoHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    if (!req.file) {
      res.status(400).json({ error: { message: "Rasm yuklanmadi" } });
      return;
    }

    await storeReferencePhoto(req.user.employeeId, req.file.buffer);
    res.json({ message: "Malumot uchun rasm saqlandi" });
  } catch (error) {
    next(error);
  }
}

export async function verifySelfieHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    if (!req.file) {
      res.status(400).json({ error: { message: "Selfi rasm yuklanmadi" } });
      return;
    }

    const reference = await getReferencePhoto(req.user.employeeId);
    if (!reference) {
      res.status(400).json({ error: { message: "Malumot uchun rasm topilmadi. Avval yuklang." } });
      return;
    }

    const result = await verifyFace(req.file.buffer, reference);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getReferencePhotoStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) {
      res.status(403).json({ error: { message: "Xodim profili to'ldirilmagan" } });
      return;
    }

    const employee = await prisma.employee.findUnique({
      where: { id: req.user.employeeId },
      select: { referencePhotoHash: true },
    });

    res.json({ hasReferencePhoto: !!employee?.referencePhotoHash });
  } catch (error) {
    next(error);
  }
}
