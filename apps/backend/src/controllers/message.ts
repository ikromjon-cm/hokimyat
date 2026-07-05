import { Request, Response, NextFunction } from "express";
import { sendMessage, getConversations, getMessages, getUnreadCount, deleteMessage } from "../services/messaging";
import { ForbiddenError } from "../middleware/errorHandler";

export async function sendMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const { receiverEmployeeId, content } = req.body;
    if (!receiverEmployeeId || !content) {
      res.status(400).json({ error: { message: "Qabul qiluvchi va matn talab qilinadi" } });
      return;
    }

    const message = await sendMessage({
      senderEmployeeId: req.user.employeeId,
      receiverEmployeeId,
      content,
    });

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
}

export async function getConversationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const conversations = await getConversations(req.user.employeeId);
    res.json(conversations);
  } catch (error) {
    next(error);
  }
}

export async function getMessagesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const otherId = req.params.employeeId;
    const limit = parseInt(req.query.limit as string || "50", 10);
    const offset = parseInt(req.query.offset as string || "0", 10);

    const messages = await getMessages(req.user.employeeId, otherId, limit, offset);
    res.json(messages);
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCountHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const count = await getUnreadCount(req.user.employeeId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
}

export async function deleteMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.employeeId) throw new ForbiddenError("Xodim profili to'ldirilmagan");

    const deleted = await deleteMessage(req.params.id, req.user.employeeId);
    if (!deleted) {
      res.status(404).json({ error: { message: "Xabar topilmadi" } });
      return;
    }

    res.json({ message: "Xabar o'chirildi" });
  } catch (error) {
    next(error);
  }
}
