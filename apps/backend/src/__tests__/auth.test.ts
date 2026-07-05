import request from "supertest";
import app from "../index";
import { prisma } from "../services/prisma";

describe("Auth API", () => {
  beforeAll(async () => {
    await prisma.otpCode.deleteMany({ where: { phone: { startsWith: "+998999999999" } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/v1/auth/request-otp", () => {
    it("should reject invalid phone number", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: "12345" });

      expect(res.status).toBe(422);
    });

    it("should accept valid phone number", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: "+998999999999" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
    });
  });

  describe("POST /api/v1/auth/verify-otp", () => {
    it("should reject invalid code", async () => {
      const res = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({ phone: "+998999999999", code: "000000" });

      expect(res.status).toBe(400);
    });

    it("should reject request with missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({ phone: "+998999999999" });

      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("should reject invalid refresh token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.status).toBe(401);
    });
  });
});
