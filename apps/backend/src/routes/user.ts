import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { getProfileHandler, updateProfileHandler, getUsersHandler, getUserByIdHandler, updateUserRoleHandler, updatePreferencesHandler } from "../controllers/user";
import { checkAppVersionHandler } from "../controllers/appVersion";

export const userRouter = Router();

userRouter.get("/profile", authenticate, getProfileHandler);
userRouter.patch("/profile", authenticate, updateProfileHandler);
userRouter.put("/preferences", authenticate, updatePreferencesHandler);
userRouter.get("/", authenticate, authorize("SUPER_ADMIN", "DEPARTMENT_HEAD"), getUsersHandler);
userRouter.get("/:id", authenticate, getUserByIdHandler);
userRouter.patch("/:id/role", authenticate, authorize("SUPER_ADMIN"), updateUserRoleHandler);

export const appRouter = Router();
appRouter.get("/check-version", checkAppVersionHandler);
appRouter.post("/versions", authenticate, authorize("SUPER_ADMIN"), async (req, res, next) => {
  try {
    const { createAppVersion } = await import("../services/appVersion");
    const result = await createAppVersion(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});
