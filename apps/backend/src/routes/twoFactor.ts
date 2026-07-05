import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { enable2FAHandler, verify2FAHandler, disable2FAHandler, status2FAHandler } from "../controllers/twoFactor";

export const twoFactorRouter = Router();

twoFactorRouter.get("/status", authenticate, status2FAHandler);
twoFactorRouter.post("/enable", authenticate, enable2FAHandler);
twoFactorRouter.post("/verify", authenticate, verify2FAHandler);
twoFactorRouter.post("/disable", authenticate, disable2FAHandler);
