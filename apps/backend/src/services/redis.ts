import Redis from "ioredis";
import { config } from "../config";

let redis: Redis | null = null;

export async function initializeRedis(): Promise<void> {
  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    // Fail commands after 5s instead of hanging forever when Redis is
    // unreachable — otherwise request handlers (and /health) block indefinitely.
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy(times) {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
  });

  redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err);
  });

  redis.on("connect", () => {
    console.log("[Redis] Connected successfully");
  });
}

export function getRedis(): Redis | null {
  return redis;
}

// Every method swallows Redis errors and returns a safe default so that a
// slow/unreachable Redis degrades features gracefully instead of hanging or
// throwing across the request path (maintenance, cache, sessions, etc.).
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error("[Redis] command failed (ignored):", (err as Error).message);
    return fallback;
  }
}

export const redisClient = {
  get: async (key: string) => { const r = getRedis(); return r ? safe(() => r.get(key), null) : null; },
  setex: async (key: string, ttl: number, value: string) => { const r = getRedis(); if (r) await safe(() => r.setex(key, ttl, value), "" as any); },
  set: async (key: string, value: string, mode?: string, ttl?: number) => { const r = getRedis(); if (r) await safe(() => r.set(key, value, mode as any, ttl as any), "" as any); },
  del: async (...keys: string[]) => { const r = getRedis(); if (r) await safe(() => r.del(...keys), 0); },
  scan: async (cursor: string, opts: { match: string; count: number }): Promise<[string, string[]]> => { const r = getRedis(); if (!r) return ["0", []]; return safe(() => r.scan(cursor, "MATCH", opts.match, "COUNT", opts.count), ["0", []] as [string, string[]]); },
  ping: async () => { const r = getRedis(); return r ? safe(() => r.ping(), "NO_REDIS") : "NO_REDIS"; },
  quit: async () => { const r = getRedis(); if (r) await safe(() => r.quit(), "OK"); },
  xlen: async (key: string) => { const r = getRedis(); return r ? safe(() => r.xlen(key), 0) : 0; },
};

export async function cacheSet(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.set(key, value, "EX", ttlSeconds);
  } catch (err) {
    console.error("[Redis] cacheSet failed (ignored):", (err as Error).message);
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  try {
    return await r.get(key);
  } catch (err) {
    console.error("[Redis] cacheGet failed (ignored):", (err as Error).message);
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  try {
    await r.del(key);
  } catch (err) {
    console.error("[Redis] cacheDel failed (ignored):", (err as Error).message);
  }
}

export async function cacheSetObject(key: string, value: object, ttlSeconds: number = 3600): Promise<void> {
  await cacheSet(key, JSON.stringify(value), ttlSeconds);
}

export async function cacheGetObject<T>(key: string): Promise<T | null> {
  const data = await cacheGet(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export async function blacklistToken(jti: string, expiresInSeconds: number): Promise<void> {
  await cacheSet(`blacklist:${jti}`, "1", expiresInSeconds);
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const result = await cacheGet(`blacklist:${jti}`);
  return result !== null;
}
