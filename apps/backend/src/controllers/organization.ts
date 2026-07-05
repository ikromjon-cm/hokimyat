import { Request, Response, NextFunction } from "express";
import { prisma } from "../services/prisma";
import { createAuditLog } from "../middleware/audit";
import { NotFoundError } from "../middleware/errorHandler";
import { AuditAction } from "@prisma/client";

export async function createOrganizationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, shortName, address, phone, email, latitude, longitude, geofenceRadius, wifiSSID } = req.body;

    const organization = await prisma.organization.create({
      data: {
        name,
        shortName,
        address,
        phone,
        email,
        latitude,
        longitude,
        geofenceRadius,
        wifiSSID,
        settings: {
          create: {},
        },
      },
    });

    await createAuditLog({
      action: AuditAction.ORGANIZATION_CREATED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: `Tashkilot yaratildi: ${name}`,
      metadata: { organizationId: organization.id },
    });

    res.status(201).json(organization);
  } catch (error) {
    next(error);
  }
}

export async function getOrganizationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const organizations = await prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        _count: { select: { users: true, departments: true, employees: true } },
      },
    });
    res.json(organizations);
  } catch (error) {
    next(error);
  }
}

export async function getOrganizationByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.params.id, deletedAt: null },
      include: {
        settings: true,
        departments: { where: { deletedAt: null } },
        _count: { select: { users: true, employees: true } },
      },
    });
    if (!org) throw new NotFoundError("Tashkilot");
    res.json(org);
  } catch (error) {
    next(error);
  }
}

export async function updateOrganizationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await prisma.organization.update({
      where: { id: req.params.id },
      data: req.body,
    });

    await createAuditLog({
      action: AuditAction.ORGANIZATION_UPDATED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: `Tashkilot yangilandi: ${org.name}`,
      metadata: { organizationId: org.id },
    });

    res.json(org);
  } catch (error) {
    next(error);
  }
}

export async function updateOrganizationSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await prisma.organizationSettings.upsert({
      where: { organizationId: req.params.id },
      create: { organizationId: req.params.id, ...req.body },
      update: req.body,
    });

    await createAuditLog({
      action: AuditAction.SETTINGS_UPDATED,
      actorId: req.user?.userId,
      actorType: "USER",
      description: "Tashkilot sozlamalari yangilandi",
      metadata: { organizationId: req.params.id },
    });

    res.json(settings);
  } catch (error) {
    next(error);
  }
}

export async function deleteOrganizationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.organization.update({
      where: { id: req.params.id },
      data: { deletedAt: new Date() },
    });
    res.json({ message: "Tashkilot o'chirildi" });
  } catch (error) {
    next(error);
  }
}
