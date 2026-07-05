import Redis from "ioredis";
import { config } from "../config";

let redis: Redis | null = null;

export async function initializeRedis(): Promise<void> {
  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
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

export const redisClient = {
  get: async (key: string) => { const r = getRedis(); return r ? r.get(key) : null; },
  setex: async (key: string, ttl: number, value: string) => { const r = getRedis(); if (r) await r.setex(key, ttl, value); },
  set: async (key: string, value: string, mode?: string, ttl?: number) => { const r = getRedis(); if (r) await r.set(key, value, mode as any, ttl as any); },
  del: async (...keys: string[]) => { const r = getRedis(); if (r) await r.del(...keys); },
  scan: async (cursor: string, opts: { match: string; count: number }): Promise<[string, string[]]> => { const r = getRedis(); const result = r ? await r.scan(cursor, "MATCH", opts.match, "COUNT", opts.count) : null; return result || [ "0", [] ]; },
  ping: async () => { const r = getRedis(); return r ? r.ping() : "NO_REDIS"; },
  quit: async () => { const r = getRedis(); if (r) await r.quit(); },
  xlen: async (key: string) => { const r = getRedis(); return r ? r.xlen(key) : 0; },
};

export async function cacheSet(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.set(key, value, "EX", ttlSeconds);
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = getRedis();
  return r ? r.get(key) : null;
}

export async function cacheDel(key: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(key);
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
