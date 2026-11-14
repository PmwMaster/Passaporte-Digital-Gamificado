// ==============================================================================
// UTILITÁRIO MATEMÁTICO DE GEOLOCALIZAÇÃO — FÓRMULA DE HAVERSINE
// ==============================================================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calcula a distância em metros entre duas coordenadas GPS usando a fórmula de Haversine.
 */
export function calculateHaversineDistanceMeters(
  origin: Coordinates,
  target: Coordinates
): number {
  const dLat = toRadians(target.latitude - origin.latitude);
  const dLon = toRadians(target.longitude - origin.longitude);

  const lat1 = toRadians(origin.latitude);
  const lat2 = toRadians(target.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Verifica se a coordenada do visitante está dentro do raio de geofence configurado.
 */
export function validateGeofence(
  visitorCoords: Coordinates,
  shoppingCoords: Coordinates,
  maxRadiusMeters = 250
): { isWithinGeofence: boolean; distanceMeters: number; maxRadiusMeters: number } {
  const distanceMeters = calculateHaversineDistanceMeters(visitorCoords, shoppingCoords);
  return {
    isWithinGeofence: distanceMeters <= maxRadiusMeters,
    distanceMeters,
    maxRadiusMeters,
  };
}
