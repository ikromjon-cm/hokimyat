import { Request, Response, NextFunction } from "express";
import { getCached, setCache, cacheKey } from "../services/cache";

interface CacheOptions {
  ttl?: number;
  key?: (req: Request) => string;
}

const defaultKeyFn = (prefix: string) => (req: Request) => {
  const userId = (req as any).user?.userId || "anonymous";
  const query = JSON.stringify(req.query);
  return `${userId}:${req.path}:${query}`;
};

export function cacheMiddleware(prefix: string, options: CacheOptions = {}) {
  const ttl = options.ttl;
  const keyFn = options.key || defaultKeyFn(prefix);

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const key = keyFn(req);
    const fullKey = cacheKey(prefix, key);

    const cached = await getCached<any>(fullKey);
    if (cached !== null) {
      res.json(cached);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      setCache(fullKey, body, ttl);
      return originalJson(body);
    };

    next();
  };
}
