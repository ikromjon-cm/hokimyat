import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import cluster from "cluster";
import os from "os";
import { swaggerSpec } from "./swagger";
import { errorHandler } from "./middleware/errorHandler";
import { sanitizeInput, sanitizeHTML } from "./middleware/sanitize";
import { authRouter } from "./routes/auth";
import { attendanceRouter } from "./routes/attendance";
import { meetingRouter } from "./routes/meeting";
import { userRouter } from "./routes/user";
import { organizationRouter } from "./routes/organization";
import { departmentRouter } from "./routes/department";
import { reportRouter } from "./routes/report";
import { notificationRouter } from "./routes/notification";
import { auditRouter } from "./routes/audit";
import { adminRouter } from "./routes/admin";
import { sessionRouter } from "./routes/session";
import { twoFactorRouter } from "./routes/twoFactor";
import { appRouter as appVersionRouter } from "./routes/user";
import { messageRouter } from "./routes/message";
import { calendarRouter } from "./routes/calendar";
import { documentRouter } from "./routes/document";
import { faceRouter } from "./routes/faceVerification";
import { apiKeyRouter } from "./routes/apiKey";
import { retentionRouter } from "./routes/retention";
import { tMiddleware } from "./i18n";
import { maintenanceMiddleware } from "./middleware/maintenance";
import { noSniffMiddleware, frameGuardMiddleware, hstsMiddleware, cspMiddleware, referrerPolicyMiddleware } from "./middleware/security";
import { initializeRedis, redisClient } from "./services/redis";
import { initializeQueueProcessors } from "./jobs";
import { prisma } from "./services/prisma";
import { initializeSentry, getSentry } from "./services/sentry";
import { metricsMiddleware, metricsHandler } from "./services/metrics";
import { initializeWebSocket } from "./services/websocket";
import { printEnvStatus } from "./utils/envValidator";

printEnvStatus();
initializeSentry();

const app = express();
const PORT = parseInt(process.env.PORT || "4000", 10);
const API_PREFIX = process.env.API_PREFIX || "/api/v1";
const USE_CLUSTER = process.env.NODE_ENV === "production" && process.env.CLUSTER_ENABLED !== "false";

process.on("unhandledRejection", (reason) => {
  console.error("[UYCHI MAJLIS] Unhandled Rejection:", reason);
  const Sentry = getSentry();
  if (Sentry?.captureException) Sentry.captureException(reason);
});

process.on("uncaughtException", (err) => {
  console.error("[UYCHI MAJLIS] Uncaught Exception:", err);
  const Sentry = getSentry();
  if (Sentry?.captureException) Sentry.captureException(err);
  process.exit(1);
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));
app.use(noSniffMiddleware);
app.use(frameGuardMiddleware);
app.use(hstsMiddleware);
app.use(cspMiddleware);
app.use(referrerPolicyMiddleware);

app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("combined"));
app.use(sanitizeInput);
app.use(sanitizeHTML);
app.use(metricsMiddleware);
app.use(tMiddleware);

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  message: { error: "Ko'p so'rov yuborildi. Iltimos, keyinroq urinib ko'ring." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);
app.use(maintenanceMiddleware);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "UYCHI MAJLIS API",
}));

app.get("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/health", async (_req, res) => {
  const checks = { database: false, redis: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {}
  try {
    await redisClient.ping();
    checks.redis = true;
  } catch {}
  const allOk = checks.database && checks.redis;
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    service: "uychi-majlis-backend",
    checks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.get("/metrics", metricsHandler);

app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/attendance`, attendanceRouter);
app.use(`${API_PREFIX}/meetings`, meetingRouter);
app.use(`${API_PREFIX}/users`, userRouter);
app.use(`${API_PREFIX}/organizations`, organizationRouter);
app.use(`${API_PREFIX}/departments`, departmentRouter);
app.use(`${API_PREFIX}/reports`, reportRouter);
app.use(`${API_PREFIX}/notifications`, notificationRouter);
app.use(`${API_PREFIX}/audit`, auditRouter);
app.use(`${API_PREFIX}/admin`, adminRouter);
app.use(`${API_PREFIX}/app`, appVersionRouter);
app.use(`${API_PREFIX}/sessions`, sessionRouter);
app.use(`${API_PREFIX}/two-factor`, twoFactorRouter);
app.use(`${API_PREFIX}/messages`, messageRouter);
app.use(`${API_PREFIX}/calendar`, calendarRouter);
app.use(`${API_PREFIX}/documents`, documentRouter);
app.use(`${API_PREFIX}/face`, faceRouter);
app.use(`${API_PREFIX}/api-keys`, apiKeyRouter);
app.use(`${API_PREFIX}/retention`, retentionRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const Sentry = getSentry();
  if (Sentry?.captureException) Sentry.captureException(err);
  errorHandler(err, _req, res, _next);
});

function gracefulShutdown() {
  console.log("[UYCHI MAJLIS] Shutting down gracefully...");
  const timeout = setTimeout(() => {
    console.error("[UYCHI MAJLIS] Forced shutdown after timeout");
    process.exit(1);
  }, 10000);

  Promise.all([
    prisma.$disconnect(),
    redisClient.quit(),
  ]).then(() => {
    clearTimeout(timeout);
    console.log("[UYCHI MAJLIS] Shutdown complete");
    process.exit(0);
  }).catch((err) => {
    console.error("[UYCHI MAJLIS] Shutdown error:", err);
    clearTimeout(timeout);
    process.exit(1);
  });
}

async function startServer() {
  try {
    await initializeRedis();
    await initializeQueueProcessors();

    const server = http.createServer(app);
    initializeWebSocket(server);

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`[UYCHI MAJLIS] Server ${process.pid} running on port ${PORT}`);
      console.log(`[UYCHI MAJLIS] API docs: http://localhost:${PORT}/api-docs`);
      console.log(`[UYCHI MAJLIS] WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`[UYCHI MAJLIS] Metrics: http://localhost:${PORT}/metrics`);
    });

    server.on("close", gracefulShutdown);
    process.on("SIGTERM", () => server.close());
    process.on("SIGINT", () => server.close());
  } catch (error) {
    console.error("[UYCHI MAJLIS] Failed to start server:", error);
    process.exit(1);
  }
}

if (USE_CLUSTER && cluster.isPrimary) {
  const cpus = os.cpus().length;
  console.log(`[UYCHI MAJLIS] Primary ${process.pid} starting ${cpus} workers`);

  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`[UYCHI MAJLIS] Worker ${worker.process.pid} died (${signal || code}), restarting`);
    cluster.fork();
  });
} else if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
