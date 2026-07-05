const EARTH_RADIUS_METERS = 6371000;

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function isWithinGeofence(
  employeeLat: number,
  employeeLon: number,
  officeLat: number,
  officeLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(employeeLat, employeeLon, officeLat, officeLon);
  return distance <= radiusMeters;
}

export function getConfidenceLevel(
  isInsideGeofence: boolean,
  wifiMatched: boolean,
  mockLocation: boolean
): "HIGH" | "MEDIUM" | "REJECTED" {
  if (mockLocation) return "REJECTED";
  if (!isInsideGeofence) return "REJECTED";
  if (wifiMatched) return "HIGH";
  return "MEDIUM";
}
