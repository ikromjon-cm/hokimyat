import { Request, Response, NextFunction } from "express";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";
import en from "./locales/en.json";

export type Locale = "uz" | "ru" | "en";
export type TranslationKey = keyof typeof uz;

const translations: Record<Locale, Record<string, any>> = { uz, ru, en };
const supportedLocales: Locale[] = ["uz", "ru", "en"];

function detectLocale(req: Request): Locale {
  const header = req.headers["accept-language"] || req.headers["lang"] || "";
  const langStr = Array.isArray(header) ? header[0] : header;

  for (const supported of supportedLocales) {
    if (langStr.startsWith(supported)) return supported;
  }

  const cookieLocale = req.cookies?.locale as Locale | undefined;
  if (cookieLocale && supportedLocales.includes(cookieLocale)) return cookieLocale;

  const queryLocale = req.query?.locale as Locale | undefined;
  if (queryLocale && supportedLocales.includes(queryLocale)) return queryLocale;

  return "uz";
}

function t(locale: Locale, path: string, params?: Record<string, string | number>): string {
  const keys = path.split(".");
  let value: any = translations[locale];

  for (const key of keys) {
    if (value?.[key] === undefined) {
      value = getFallback(path);
      break;
    }
    value = value[key];
  }

  if (typeof value !== "string") return path;

  if (params) {
    return Object.entries(params).reduce(
      (str, [key, val]) => str.replace(`{${key}}`, String(val)),
      value
    );
  }

  return value;
}

function getFallback(path: string): string {
  const keys = path.split(".");
  let value: any = translations.uz;
  for (const key of keys) {
    if (value?.[key] === undefined) return path;
    value = value[key];
  }
  return typeof value === "string" ? value : path;
}

export function tMiddleware(req: Request, _res: Response, next: NextFunction) {
  const locale = detectLocale(req);
  (req as any).locale = locale;
  (req as any).t = (path: string, params?: Record<string, string | number>) => t(locale, path, params);
  next();
}

export function getT(req: Request): (path: string, params?: Record<string, string | number>) => string {
  return (req as any).t || ((path: string) => path);
}

export { t };
