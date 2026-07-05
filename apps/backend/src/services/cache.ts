import { redisClient } from "./redis";
import { trackRedisOperation } from "./metrics";

const DEFAULT_TTL = parseInt(process.env.CACHE_TTL_SECONDS || "60", 10);
const ENABLED = process.env.CACHE_ENABLED !== "false";

export function cacheKey(prefix: string, identifier: string): string {
  return `cache:${prefix}:${identifier}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (!ENABLED || !redisClient) return null;

  const start = Date.now();
  try {
    const data = await redisClient.get(key);
    trackRedisOperation(Date.now() - start);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (err) {
    console.error("[Cache] Get error:", err);
    return null;
  }
}

export async function setCache<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
  if (!ENABLED || !redisClient) return;

  const start = Date.now();
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, ttl, serialized);
    trackRedisOperation(Date.now() - start);
  } catch (err) {
    console.error("[Cache] Set error:", err);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!ENABLED || !redisClient) return;

  const start = Date.now();
  try {
    let cursor = "0";
    do {
      const result = await redisClient.scan(cursor, { match: pattern, count: 100 });
      cursor = result[0];
      const keys = result[1];
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== "0");
    trackRedisOperation(Date.now() - start);
  } catch (err) {
    console.error("[Cache] Invalidate error:", err);
  }
}

export function cachedQuery<T>(prefix: string, ttl?: number) {
  return async (key: string, fetcher: () => Promise<T>): Promise<T> => {
    const cacheKeyStr = cacheKey(prefix, key);
    const cached = await getCached<T>(cacheKeyStr);
    if (cached !== null) return cached;

    const data = await fetcher();
    await setCache(cacheKeyStr, data, ttl);
    return data;
  };
}
