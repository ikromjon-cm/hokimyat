import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getMyNotificationsHandler, markAsReadHandler, markAllAsReadHandler, getUnreadCountHandler } from "../controllers/notification";

export const notificationRouter = Router();

notificationRouter.get("/", authenticate, getMyNotificationsHandler);
notificationRouter.get("/unread-count", authenticate, getUnreadCountHandler);
notificationRouter.patch("/:id/read", authenticate, markAsReadHandler);
notificationRouter.post("/mark-all-read", authenticate, markAllAsReadHandler);
