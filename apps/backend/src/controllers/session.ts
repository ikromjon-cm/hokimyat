import { Request, Response, NextFunction } from "express";
import { listSessions, terminateSession, terminateAllSessions } from "../services/session";
import { ForbiddenError } from "../middleware/errorHandler";

export async function getSessionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();
    const sessions = await listSessions(req.user.userId);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
}

export async function deleteSessionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();
    const deleted = await terminateSession(req.params.id, req.user.userId);
    if (!deleted) {
      res.status(404).json({ message: "Sessiya topilmadi" });
      return;
    }
    res.json({ message: "Sessiya tugatildi" });
  } catch (error) {
    next(error);
  }
}

export async function deleteAllSessionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.userId) throw new ForbiddenError();
    const count = await terminateAllSessions(req.user.userId, req.body?.currentToken);
    res.json({ message: `${count} ta sessiya tugatildi` });
  } catch (error) {
    next(error);
  }
}
