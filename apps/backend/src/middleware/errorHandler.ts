import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resurs") {
    super(`${resource} topilmadi`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Avtorizatsiyadan o'tilmagan") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Ruxsat etilmagan") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  public errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("Validatsiya xatosi", 422, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resurs allaqachon mavjud") {
    super(message, 409, "CONFLICT");
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error("[Error]", err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err instanceof ValidationError ? { errors: err.errors } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join(".");
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    res.status(422).json({
      error: {
        message: "Validatsiya xatosi",
        code: "VALIDATION_ERROR",
        errors,
      },
    });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[])?.join(", ") || "field";
      res.status(409).json({
        error: {
          message: `Bu ${target} allaqachon mavjud`,
          code: "UNIQUE_CONSTRAINT",
        },
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        error: {
          message: "Resurs topilmadi",
          code: "NOT_FOUND",
        },
      });
      return;
    }
  }

  res.status(500).json({
    error: {
      message: "Serverda xatolik yuz berdi",
      code: "INTERNAL_ERROR",
    },
  });
}
