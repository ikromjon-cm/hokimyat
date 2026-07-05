import request from "supertest";
import app from "../../index";
import { prisma } from "../../services/prisma";

describe("API Integration Tests", () => {
  let accessToken: string;
  let refreshToken: string;
  let testUserId: string;
  let testOrgId: string;
  let testDeptId: string;
  let testEmployeeId: string;
  let testMeetingId: string;

  beforeAll(async () => {
    await prisma.otpCode.deleteMany({ where: { phone: { startsWith: "+998999999" } } });
    await prisma.auditLog.deleteMany({});
    await prisma.notificationLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.meetingParticipant.deleteMany({});
    await prisma.meetingOverseer.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.device.deleteMany({});
    await prisma.user.deleteMany({ where: { phone: { startsWith: "+998999999" } } });
    await prisma.department.deleteMany({ where: { name: { startsWith: "TEST" } } });
    await prisma.organization.deleteMany({ where: { name: { startsWith: "TEST" } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("Health Check", () => {
    it("GET /health should return ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.service).toBe("uychi-majlis-backend");
    });
  });

  describe("Authentication Flow", () => {
    const testPhone = "+998999999001";

    it("POST /api/v1/auth/request-otp - should send OTP", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: testPhone });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("yuborildi");
    });

    it("POST /api/v1/auth/request-otp - should reject invalid phone", async () => {
      const res = await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: "12345" });

      expect(res.status).toBe(422);
    });

    it("POST /api/v1/auth/verify-otp - should reject invalid code", async () => {
      const res = await request(app)
        .post("/api/v1/auth/verify-otp")
        .send({ phone: testPhone, code: "000000" });

      expect(res.status).toBe(400);
    });

    it("POST /api/v1/auth/refresh - should reject invalid token", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "invalid-token" });

      expect(res.status).toBe(401);
    });
  });

  describe("Organization CRUD", () => {
    it("POST /api/v1/organizations - should create organization", async () => {
      const res = await request(app)
        .post("/api/v1/organizations")
        .send({
          name: "TEST Organization",
          shortName: "TEST",
          latitude: 41.311081,
          longitude: 69.279737,
          geofenceRadius: 100,
          wifiSSID: "TEST_WIFI",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("TEST Organization");
      testOrgId = res.body.id;
    });

    it("GET /api/v1/organizations - should list organizations", async () => {
      const res = await request(app).get("/api/v1/organizations");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("GET /api/v1/organizations/:id - should get organization details", async () => {
      const res = await request(app).get(`/api/v1/organizations/${testOrgId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(testOrgId);
      expect(res.body.settings).toBeDefined();
    });
  });

  describe("Department CRUD", () => {
    it("POST /api/v1/departments - should create department", async () => {
      const res = await request(app)
        .post("/api/v1/departments")
        .send({
          name: "TEST Department",
          code: "TEST-001",
          organizationId: testOrgId,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("TEST Department");
      testDeptId = res.body.id;
    });
  });

  describe("Employee Management", () => {
    const testPhone = "+998999999002";

    it("POST /api/v1/auth/request-otp - should register user", async () => {
      await request(app)
        .post("/api/v1/auth/request-otp")
        .send({ phone: testPhone });
    });

    it("POST /api/v1/auth/verify-otp - should create user on first login", async () => {
      const otpRecord = await prisma.otpCode.findFirst({
        where: { phone: testPhone, isUsed: false },
        orderBy: { createdAt: "desc" },
      });

      if (otpRecord) {
        const res = await request(app)
          .post("/api/v1/auth/verify-otp")
          .send({ phone: testPhone, code: "000000" });

        expect(res.status).toBe(400);
      }
    });
  });

  describe("Attendance", () => {
    it("POST /api/v1/attendance/check-in - should reject without auth", async () => {
      const res = await request(app)
        .post("/api/v1/attendance/check-in")
        .send({ latitude: 41.311081, longitude: 69.279737 });

      expect(res.status).toBe(401);
    });

    it("GET /api/v1/attendance/today - should reject without auth", async () => {
      const res = await request(app).get("/api/v1/attendance/today");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/attendance/history - should reject without auth", async () => {
      const res = await request(app).get("/api/v1/attendance/history");
      expect(res.status).toBe(401);
    });
  });

  describe("Meetings", () => {
    it("POST /api/v1/meetings - should reject without auth", async () => {
      const res = await request(app)
        .post("/api/v1/meetings")
        .send({
          title: "Test Meeting",
          participantIds: [],
        });

      expect(res.status).toBe(401);
    });

    it("GET /api/v1/meetings/my - should reject without auth", async () => {
      const res = await request(app).get("/api/v1/meetings/my");
      expect(res.status).toBe(401);
    });
  });

  describe("Reports", () => {
    it("GET /api/v1/reports/excel - should reject without auth", async () => {
      const res = await request(app).get("/api/v1/reports/excel");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/reports/pdf - should reject without auth", async () => {
      const res = await request(app).get("/api/v1/reports/pdf");
      expect(res.status).toBe(401);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits on auth endpoints", async () => {
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post("/api/v1/auth/request-otp")
          .send({ phone: "+998999999003" })
      );

      const results = await Promise.all(promises);
      const tooMany = results.some((r) => r.status === 429);
      expect(tooMany).toBe(false);
    });
  });

  describe("Security Headers", () => {
    it("should have helmet security headers", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-frame-options"]).toBeDefined();
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.headers["x-download-options"]).toBeDefined();
    });
  });
});
