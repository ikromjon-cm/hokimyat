import multer from "multer";
import path from "path";
import { AppError } from "./errorHandler";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

export const uploadSelfie = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(
        "Faqat JPEG, PNG va WebP formatlari qabul qilinadi",
        400,
        "INVALID_FILE_TYPE"
      ));
    }
  },
});

const CSV_MIME_TYPES = ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"];
const MAX_CSV_SIZE = 2 * 1024 * 1024;

export const uploadCSV = multer({
  storage,
  limits: {
    fileSize: MAX_CSV_SIZE,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (CSV_MIME_TYPES.includes(file.mimetype) || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new AppError("Faqat CSV fayllari qabul qilinadi", 400, "INVALID_FILE_TYPE"));
    }
  },
});

export const uploadMultiple = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Faqat rasm fayllari qabul qilinadi", 400, "INVALID_FILE_TYPE"));
    }
  },
});
