import { Request, Response, NextFunction } from "express";

const SENSITIVE_FIELDS = ["password", "token", "secret", "authorization", "cookie"];

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    stripSensitiveFields(req.body);
  }
  if (req.query && typeof req.query === "object") {
    stripSensitiveFields(req.query);
  }
  next();
}

function stripSensitiveFields(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      delete obj[key];
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      stripSensitiveFields(obj[key] as Record<string, unknown>);
    }
  }
}

const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const ON_EVENT_REGEX = /\son\w+\s*=\s*["'][^"']*["']/gi;

export function sanitizeHTML(req: Request, _res: Response, next: NextFunction): void {
  if (typeof req.body === "object" && req.body !== null) {
    sanitizeObjectValues(req.body);
  }
  next();
}

function sanitizeObjectValues(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === "string") {
      (obj as Record<string, string>)[key] = (obj[key] as string)
        .replace(SCRIPT_TAG_REGEX, "")
        .replace(ON_EVENT_REGEX, "");
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObjectValues(obj[key] as Record<string, unknown>);
    }
  }
}
