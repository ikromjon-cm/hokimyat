import { Request, Response, NextFunction } from "express";

export function noSniffMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
}

export function noOpenMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Download-Options", "noopen");
  next();
}

export function frameGuardMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Frame-Options", "DENY");
  next();
}

export function hstsMiddleware(_req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
}

export function cspMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' ws: wss:; " +
    "frame-ancestors 'none'"
  );
  next();
}

export function referrerPolicyMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
}

export function permissionsPolicyMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), geolocation=(self), microphone=(), " +
    "payment=(), usb=(), bluetooth=(), midi=()"
  );
  next();
}

export function originCheckMiddleware(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin as string;
    if (origin && !allowedOrigins.includes("*") && !allowedOrigins.includes(origin)) {
      res.status(403).json({ error: { message: "Ruxsat etilmagan origin", code: "CORS_ERROR" } });
      return;
    }
    next();
  };
}

export function bodySizeLimiter(maxSize: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > maxSize) {
      res.status(413).json({ error: { message: "So'rov hajmi juda katta", code: "PAYLOAD_TOO_LARGE" } });
      return;
    }
    next();
  };
}
