import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { createApiKey, listApiKeys, revokeApiKey } from "../services/apiKey";

export const apiKeyRouter = Router();

apiKeyRouter.post("/", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const { name, permissions, allowedIps, rateLimitPerMinute, expiresAt } = req.body;
    const result = await createApiKey(req.user!.userId, name, {
      organizationId: req.user!.organizationId,
      permissions,
      allowedIps,
      rateLimitPerMinute,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    res.status(201).json(result);
  } catch (error) { next(error); }
});

apiKeyRouter.get("/", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const keys = await listApiKeys(req.user!.userId);
    res.json(keys);
  } catch (error) { next(error); }
});

apiKeyRouter.delete("/:id", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const revoked = await revokeApiKey(req.params.id, req.user!.userId);
    if (!revoked) { res.status(404).json({ error: { message: "Kalit topilmadi" } }); return; }
    res.json({ message: "API kalit bekor qilindi" });
  } catch (error) { next(error); }
});
