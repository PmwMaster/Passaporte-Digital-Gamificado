// ==============================================================================
// TESTES UNITÁRIOS — FEATURE 01 (F04): HAVERSINE, FUSO DE PALMAS E CHECK-IN
// ==============================================================================

import { CheckInService } from '../../src/modules/checkin';
import {
  getLocalCheckInDate,
  isGpsAccuracyAcceptable,
} from '../../src/modules/checkin/domain/checkin-rules';
import {
  calculateHaversineDistanceMeters,
  validateGeofence,
} from '../../src/shared/utils/haversine';

export function runHaversineUnitTests(): { passed: number; failed: number } {
  const shoppingCenter = { latitude: -10.1845, longitude: -48.3337 };
  let passed = 0;
  let failed = 0;

  // Caso 1: Visitante exatamente no centro do shopping (0m <= 250m)
  const inside = validateGeofence(shoppingCenter, shoppingCenter, 250);
  if (inside.isWithinGeofence && inside.distanceMeters === 0) passed++;
  else failed++;

  // Caso 2: Visitante a ~3.5km de distância (fora do raio de 250m)
  const farVisitor = { latitude: -10.2125, longitude: -48.355 };
  const outside = validateGeofence(farVisitor, shoppingCenter, 250);
  if (!outside.isWithinGeofence && outside.distanceMeters > 250) passed++;
  else failed++;

  // Caso 3: Simetria da distância Haversine
  const d1 = calculateHaversineDistanceMeters(shoppingCenter, farVisitor);
  const d2 = calculateHaversineDistanceMeters(farVisitor, shoppingCenter);
  if (d1 === d2) passed++;
  else failed++;

  // Caso 4: Data local em Palmas (America/Araguaina, UTC-3) às 22:30 locais (01:30 UTC do dia seguinte)
  const lateNightPalmas = new Date('2026-11-14T01:30:00.000Z');
  if (getLocalCheckInDate(lateNightPalmas) === '2026-11-13') passed++;
  else failed++;

  // Caso 5: Validação de precisão do GPS (<= 150m aceito, > 150m recusado)
  if (isGpsAccuracyAcceptable(25) && !isGpsAccuracyAcceptable(220)) passed++;
  else failed++;

  // Caso 6: Tentativa fora do raio de 250m retorna 422 GEOFENCE_OUT_OF_RANGE e grava auditoria
  const outOfRangeAttempt = CheckInService.performCheckIn({
    qrCodeToken: 'QR-CD-STORE-04-VERIFIED',
    latitude: -10.2125,
    longitude: -48.355,
    accuracyMeters: 15,
  });
  if (
    !outOfRangeAttempt.ok &&
    outOfRangeAttempt.httpStatus === 422 &&
    outOfRangeAttempt.code === 'GEOFENCE_OUT_OF_RANGE'
  ) {
    passed++;
  } else {
    failed++;
  }

  return { passed, failed };
}
