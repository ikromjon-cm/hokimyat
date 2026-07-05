import { Request, Response, NextFunction } from "express";
import client from "prom-client";
import { redisClient } from "./redis";

const register = new client.Registry();

client.collectDefaultMetrics({ register, prefix: "uychi_majlis_" });

const httpRequestDuration = new client.Histogram({
  name: "uychi_majlis_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestTotal = new client.Counter({
  name: "uychi_majlis_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status"],
});

const activeConnections = new client.Gauge({
  name: "uychi_majlis_active_connections",
  help: "Number of active connections",
});

const dbQueryDuration = new client.Histogram({
  name: "uychi_majlis_db_query_duration_seconds",
  help: "Database query duration in seconds",
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

const redisOperationDuration = new client.Histogram({
  name: "uychi_majlis_redis_operation_duration_seconds",
  help: "Redis operation duration in seconds",
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1],
});

const queueSize = new client.Gauge({
  name: "uychi_majlis_queue_size",
  help: "BullMQ queue size",
  labelNames: ["queue"],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(dbQueryDuration);
register.registerMetric(redisOperationDuration);
register.registerMetric(queueSize);

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/metrics") return next();

  activeConnections.inc();
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe({ method: req.method, route, status: res.statusCode }, duration);
    httpRequestTotal.inc({ method: req.method, route, status: res.statusCode });
    activeConnections.dec();
  });

  next();
}

export async function metricsHandler(_req: Request, res: Response) {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
}

export function trackDbQuery(durationMs: number, query: string) {
  dbQueryDuration.observe(durationMs / 1000);
}

export function trackRedisOperation(durationMs: number) {
  redisOperationDuration.observe(durationMs / 1000);
}

export async function setQueueMetrics() {
  try {
    const queues = ["meeting-reminders", "daily-reports", "overdue-confirmations", "sms-retry"];
    for (const queueName of queues) {
      try {
        const counts = await redisClient.xlen(queueName);
        queueSize.set({ queue: queueName }, counts || 0);
      } catch {}
    }
  } catch {}
}

export { register };
