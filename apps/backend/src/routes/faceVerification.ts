import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { uploadSelfie } from "../middleware/upload";
import { uploadReferencePhotoHandler, verifySelfieHandler, getReferencePhotoStatusHandler } from "../controllers/faceVerification";

export const faceRouter = Router();

faceRouter.post("/reference-photo", authenticate, uploadSelfie.single("photo"), uploadReferencePhotoHandler);
faceRouter.post("/verify", authenticate, uploadSelfie.single("selfie"), verifySelfieHandler);
faceRouter.get("/status", authenticate, getReferencePhotoStatusHandler);
