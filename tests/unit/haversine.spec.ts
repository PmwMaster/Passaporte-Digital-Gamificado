// ==============================================================================
// TESTE UNITÁRIO DE REFERÊNCIA — FÓRMULA DE HAVERSINE & GEOFENCE (250M)
// ==============================================================================

import { calculateHaversineDistanceMeters, validateGeofence } from '@/shared/utils/haversine';
import { SHOPPING_CONFIG } from '@/shared/constants';

export function runHaversineSmokeChecks() {
  const inside = validateGeofence(
    { latitude: -10.18442, longitude: -48.33365 },
    SHOPPING_CONFIG.defaultCoordinates,
    250
  );

  const outside = validateGeofence(
    { latitude: -10.2125, longitude: -48.355 },
    SHOPPING_CONFIG.defaultCoordinates,
    250
  );

  const exactZero = calculateHaversineDistanceMeters(
    SHOPPING_CONFIG.defaultCoordinates,
    SHOPPING_CONFIG.defaultCoordinates
  );

  return {
    insidePassed: inside.isWithinGeofence === true && inside.distanceMeters <= 250,
    outsidePassed: outside.isWithinGeofence === false && outside.distanceMeters > 250,
    exactZeroPassed: exactZero === 0,
  };
}
