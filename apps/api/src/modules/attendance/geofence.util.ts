/**
 * Geolocation and Haversine distance calculator for unit geofencing
 */

/**
 * Computes great-circle distance between two GPS coordinates in meters using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); // Distance in meters
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Checks if a coordinate is within the allowed unit geofence radius
 */
export function verifyGeofence(
  empLat: number,
  empLon: number,
  unitLat: number,
  unitLon: number,
  geofenceRadiusMeters: number,
  gpsAccuracy: number = 0
): {
  withinGeofence: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  message?: string;
} {
  const distance = calculateHaversineDistance(empLat, empLon, unitLat, unitLon);
  // Allow a small GPS accuracy margin up to 30 meters
  const effectiveRadius = geofenceRadiusMeters + Math.min(gpsAccuracy, 30);
  const withinGeofence = distance <= effectiveRadius;

  return {
    withinGeofence,
    distanceMeters: distance,
    allowedRadiusMeters: geofenceRadiusMeters,
    message: withinGeofence
      ? `Within permitted area (${distance}m from unit center)`
      : `Location outside permitted area. You are ${distance}m away (allowed: ${geofenceRadiusMeters}m)`
  };
}
