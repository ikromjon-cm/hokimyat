import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/prisma";
import { NotFoundError } from "../middleware/errorHandler";

export async function createDepartmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, code, description, organizationId, headUserId } = req.body;

    const department = await prisma.department.create({
      data: { name, code, description, organizationId, headUserId },
    });

    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const organizationId = req.query.organizationId as string;
    const where: any = { deletedAt: null };
    if (organizationId) where.organizationId = organizationId;

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: { select: { employees: true, users: true } },
        head: { select: { id: true, fullName: true, phone: true } },
      },
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: {
        head: { select: { id: true, fullName: true, phone: true } },
        organization: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });
    if (!department) throw new NotFoundError("Bo'lim");
    res.json(department);
  } catch (error) {
    next(error);
  }
}

export async function updateDepartmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(department);
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.department.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ message: "Bo'lim o'chirildi" });
  } catch (error) {
    next(error);
  }
}
