import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { getSessionsHandler, deleteSessionHandler, deleteAllSessionsHandler } from "../controllers/session";

export const sessionRouter = Router();

sessionRouter.get("/", authenticate, getSessionsHandler);
sessionRouter.delete("/all", authenticate, deleteAllSessionsHandler);
sessionRouter.delete("/:id", authenticate, deleteSessionHandler);
