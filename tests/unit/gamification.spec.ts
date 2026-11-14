// ==============================================================================
// TESTES UNITÁRIOS — FEATURE 02 (F05): GAMIFICAÇÃO, CARIMBOS, MISSÕES E NÍVEIS
// ==============================================================================

import { GamificationService } from '../../src/modules/gamification';
import {
  calculateLevelByLifetimePoints,
  getPeriodKeyForFrequency,
} from '../../src/modules/gamification/domain/gamification-rules';
import { CheckIn } from '../../src/shared/types/domain';

export function runGamificationUnitTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  // Caso 1: Fronteiras exatas de progressão de nível (RN-05)
  const isBronze = calculateLevelByLifetimePoints(499) === 'BRONZE';
  const isSilver = calculateLevelByLifetimePoints(500) === 'SILVER';
  const isGold = calculateLevelByLifetimePoints(1200) === 'GOLD';
  const isDiamond = calculateLevelByLifetimePoints(3000) === 'DIAMOND';

  if (isBronze && isSilver && isGold && isDiamond) {
    passed++;
  } else {
    failed++;
  }

  // Caso 2: Geração de periodKey no fuso horário de Palmas (America/Araguaina)
  const sampleDate = new Date('2026-11-13T23:30:00.000Z'); // 20:30 em Palmas
  const dailyKey = getPeriodKeyForFrequency('DAILY', sampleDate);
  const monthlyKey = getPeriodKeyForFrequency('MONTHLY', sampleDate);

  if (dailyKey === '2026-11-13' && monthlyKey === '2026-11') {
    passed++;
  } else {
    failed++;
  }

  // Caso 3: Avaliação automática de missão e concessão de bônus ao atingir targetCount
  const fakeCheckIn: CheckIn = {
    id: 'chk_test_gamification_01',
    visitorId: 'vis_01',
    storeId: 'store_03',
    storeName: 'Gelato & Café Tocantins',
    checkInDate: '2026-11-13',
    latitude: -10.1845,
    longitude: -48.3337,
    distanceMeters: 10,
    isWithinGeofence: true,
    status: 'VALID',
    pointsAwarded: 35,
    createdAt: new Date().toISOString(),
  };

  const evalResult = GamificationService.evaluateMissionsAfterCheckIn(
    fakeCheckIn,
    'GASTRONOMIA'
  );

  if (evalResult.updatedMissions.length >= 1) {
    passed++;
  } else {
    failed++;
  }

  return { passed, failed };
}
