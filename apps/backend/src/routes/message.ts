import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  sendMessageHandler,
  getConversationsHandler,
  getMessagesHandler,
  getUnreadCountHandler,
  deleteMessageHandler,
} from "../controllers/message";

export const messageRouter = Router();

messageRouter.post("/", authenticate, sendMessageHandler);
messageRouter.get("/conversations", authenticate, getConversationsHandler);
messageRouter.get("/unread", authenticate, getUnreadCountHandler);
messageRouter.get("/:employeeId", authenticate, getMessagesHandler);
messageRouter.delete("/:id", authenticate, deleteMessageHandler);
