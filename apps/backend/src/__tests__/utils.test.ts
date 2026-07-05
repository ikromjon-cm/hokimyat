import { calculateDistance, isWithinGeofence, getConfidenceLevel } from "../utils/haversine";

describe("Haversine Distance Calculation", () => {
  it("should calculate zero distance for same point", () => {
    const distance = calculateDistance(41.311081, 69.279737, 41.311081, 69.279737);
    expect(distance).toBe(0);
  });

  it("should calculate distance between two points correctly", () => {
    const distance = calculateDistance(41.311081, 69.279737, 41.315, 69.285);
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1000);
  });

  it("should calculate large distances correctly", () => {
    const distance = calculateDistance(41.311081, 69.279737, 41.5, 69.5);
    expect(distance).toBeGreaterThan(10000);
  });
});

describe("Geofence Check", () => {
  const officeLat = 41.311081;
  const officeLon = 69.279737;
  const radius = 100;

  it("should return true when within geofence", () => {
    const result = isWithinGeofence(41.3112, 69.2798, officeLat, officeLon, radius);
    expect(result).toBe(true);
  });

  it("should return false when outside geofence", () => {
    const result = isWithinGeofence(41.32, 69.29, officeLat, officeLon, radius);
    expect(result).toBe(false);
  });
});

describe("Confidence Engine", () => {
  it("should return REJECTED when mock location detected", () => {
    const result = getConfidenceLevel(true, true, true);
    expect(result).toBe("REJECTED");
  });

  it("should return HIGH when inside geofence and wifi matched", () => {
    const result = getConfidenceLevel(true, true, false);
    expect(result).toBe("HIGH");
  });

  it("should return MEDIUM when inside geofence but wifi unmatched", () => {
    const result = getConfidenceLevel(true, false, false);
    expect(result).toBe("MEDIUM");
  });

  it("should return REJECTED when outside geofence", () => {
    const result = getConfidenceLevel(false, false, false);
    expect(result).toBe("REJECTED");
  });
});
