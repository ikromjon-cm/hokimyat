import { Request, Response, NextFunction } from "express";
import { enableTOTP, verifyTOTP, confirmTOTPEnable, disableTOTP, isTOTPEnabled } from "../services/totp";
import { ForbiddenError } from "../middleware/errorHandler";

export async function enable2FAHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();

    const result = await enableTOTP(req.user.userId);
    res.json({
      secret: result.secret,
      backupCodes: result.backupCodes,
      issuer: result.issuer,
    });
  } catch (error) {
    next(error);
  }
}

export async function verify2FAHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: { message: "Token talab qilinadi" } });
      return;
    }

    const valid = await confirmTOTPEnable(req.user.userId, token);
    if (!valid) {
      res.status(400).json({ error: { message: "Yaroqsiz token" } });
      return;
    }

    res.json({ message: "2FA muvaffaqiyatli yoqildi" });
  } catch (error) {
    next(error);
  }
}

export async function disable2FAHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: { message: "Token talab qilinadi" } });
      return;
    }

    const valid = await verifyTOTP(req.user.userId, token);
    if (!valid) {
      res.status(400).json({ error: { message: "Yaroqsiz token" } });
      return;
    }

    await disableTOTP(req.user.userId);
    res.json({ message: "2FA o'chirildi" });
  } catch (error) {
    next(error);
  }
}

export async function status2FAHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();

    const enabled = await isTOTPEnabled(req.user.userId);
    res.json({ enabled });
  } catch (error) {
    next(error);
  }
}
