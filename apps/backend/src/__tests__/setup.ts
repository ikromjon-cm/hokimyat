import dotenv from "dotenv";

dotenv.config({ path: "../../.env.example" });

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/uychi_majlis_test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.JWT_ACCESS_SECRET = "test-access-secret-for-jwt-tokens";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-jwt-tokens";
process.env.SELFIE_ENCRYPTION_KEY = "test-encryption-key-32chars!!!!!";

jest.mock("@sentry/profiling-node", () => ({
  nodeProfilingIntegration: () => ({}),
}));

jest.mock("ioredis", () => {
  const EventEmitter = require("events");
  const mockRedis = {
    ...EventEmitter.prototype,
    on: jest.fn().mockReturnThis(),
    once: jest.fn().mockReturnThis(),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    setex: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    status: "ready",
  };
  return {
    default: jest.fn(() => mockRedis),
    Redis: jest.fn(() => mockRedis),
  };
});
