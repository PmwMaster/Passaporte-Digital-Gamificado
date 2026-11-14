// ==============================================================================
// MÓDULO 05 — GAMIFICAÇÃO, CARIMBOS E MISSÕES (RESPONSÁVEL: DEV 02)
// ==============================================================================

import {
  mockMissions,
  mockStamps,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { PASSPORT_LEVELS } from '@/shared/constants';
import {
  CheckIn,
  Mission,
  PassportLevel,
  Stamp,
  StoreCategory,
} from '@/shared/types/domain';

export class GamificationService {
  static calculateLevelByLifetimePoints(lifetimePoints: number): PassportLevel {
    if (lifetimePoints >= PASSPORT_LEVELS.DIAMOND.minLifetimePoints) return 'DIAMOND';
    if (lifetimePoints >= PASSPORT_LEVELS.GOLD.minLifetimePoints) return 'GOLD';
    if (lifetimePoints >= PASSPORT_LEVELS.SILVER.minLifetimePoints) return 'SILVER';
    return 'BRONZE';
  }

  static grantStampFromCheckIn(checkIn: CheckIn, category: StoreCategory): Stamp {
    const newStamp: Stamp = {
      id: `stp_${Date.now()}`,
      visitorId: checkIn.visitorId,
      storeId: checkIn.storeId,
      storeName: checkIn.storeName,
      checkInId: checkIn.id,
      badgeTitle: `Selo ${checkIn.storeName}`,
      category,
      earnedAt: checkIn.createdAt,
    };

    mockStamps.unshift(newStamp);
    mockVisitorProfile.totalStamps += 1;
    mockVisitorProfile.totalCheckIns += 1;

    return newStamp;
  }

  static listMissionsAndStamps(): {
    stamps: Stamp[];
    missions: Mission[];
    level: PassportLevel;
  } {
    return {
      stamps: mockStamps,
      missions: mockMissions,
      level: mockVisitorProfile.level,
    };
  }
}
