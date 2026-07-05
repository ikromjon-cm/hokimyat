import { calculateDistance, isWithinGeofence, getConfidenceLevel } from "../utils/haversine";

describe("Attendance Service", () => {
  describe("calculateDistance", () => {
    it("should return 0 for identical coordinates", () => {
      const d = calculateDistance(41.311081, 69.279737, 41.311081, 69.279737);
      expect(d).toBe(0);
    });

    it("should return small distance for nearby points", () => {
      const d = calculateDistance(41.311081, 69.279737, 41.3115, 69.2800);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThan(100);
    });

    it("should return large distance for far points", () => {
      const d = calculateDistance(41.311081, 69.279737, 41.5, 69.5);
      expect(d).toBeGreaterThan(10000);
    });

    it("should handle negative coordinates", () => {
      const d = calculateDistance(-33.8688, 151.2093, -33.8690, 151.2095);
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThan(100);
    });
  });

  describe("isWithinGeofence", () => {
    const officeLat = 41.311081;
    const officeLon = 69.279737;
    const radius = 100;

    it("should return true when exactly at center", () => {
      expect(isWithinGeofence(officeLat, officeLon, officeLat, officeLon, radius)).toBe(true);
    });

    it("should return true when within radius", () => {
      expect(isWithinGeofence(41.3112, 69.2798, officeLat, officeLon, radius)).toBe(true);
    });

    it("should return false when just outside radius", () => {
      expect(isWithinGeofence(41.3125, 69.2797, officeLat, officeLon, radius)).toBe(false);
    });

    it("should return false when far away", () => {
      expect(isWithinGeofence(41.4, 69.3, officeLat, officeLon, radius)).toBe(false);
    });

    it("should handle custom radius values", () => {
      const largeRadius = 10000;
      expect(isWithinGeofence(41.35, 69.28, officeLat, officeLon, largeRadius)).toBe(true);
    });
  });

  describe("getConfidenceLevel", () => {
    it("should reject when mock location detected", () => {
      expect(getConfidenceLevel(true, true, true)).toBe("REJECTED");
      expect(getConfidenceLevel(false, true, true)).toBe("REJECTED");
      expect(getConfidenceLevel(true, false, true)).toBe("REJECTED");
    });

    it("should return HIGH when inside geofence with matching WiFi", () => {
      expect(getConfidenceLevel(true, true, false)).toBe("HIGH");
    });

    it("should return MEDIUM when inside geofence without matching WiFi", () => {
      expect(getConfidenceLevel(true, false, false)).toBe("MEDIUM");
    });

    it("should reject when outside geofence regardless of WiFi", () => {
      expect(getConfidenceLevel(false, true, false)).toBe("REJECTED");
      expect(getConfidenceLevel(false, false, false)).toBe("REJECTED");
    });
  });
});

describe("OTP Service", () => {
  it("should validate phone number format", () => {
    const validPhone = "+998901234567";
    const invalidPhone = "12345";
    const phoneRegex = /^\+998\d{9}$/;
    expect(phoneRegex.test(validPhone)).toBe(true);
    expect(phoneRegex.test(invalidPhone)).toBe(false);
    expect(phoneRegex.test("+99890123456")).toBe(false);
    expect(phoneRegex.test("+9989012345678")).toBe(false);
  });
});

describe("JWT Service", () => {
  it("should generate tokens with correct format", () => {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    expect(jwtRegex.test("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNqPndKa_0gLqJ0mTz6vMAs")).toBe(true);
    expect(jwtRegex.test("invalid")).toBe(false);
  });
});
