import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { applyRetentionPolicy, getRetentionConfigs, updateRetentionConfig } from "../services/retention";

export const retentionRouter = Router();

retentionRouter.get("/", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const configs = await getRetentionConfigs(req.user!.organizationId!);
    res.json(configs);
  } catch (error) { next(error); }
});

retentionRouter.put("/:entityType", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const { retentionDays, action } = req.body;
    if (!retentionDays || retentionDays < 1) {
      res.status(400).json({ error: { message: "Saqlanish muddati (retentionDays) 1 dan kichik bo'lishi mumkin emas" } });
      return;
    }
    const config = await updateRetentionConfig(req.user!.organizationId!, req.params.entityType, retentionDays, action);
    res.json(config);
  } catch (error) { next(error); }
});

retentionRouter.post("/apply", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const stats = await applyRetentionPolicy(req.user!.organizationId);
    res.json({ message: "Ma'lumotlarni tozalash yakunlandi", stats });
  } catch (error) { next(error); }
});
