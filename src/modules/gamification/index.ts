// ==============================================================================
// MÓDULO 05 — GAMIFICAÇÃO, CARIMBOS E MISSÕES (RESPONSÁVEL: DEV 02)
// ==============================================================================

import {
  mockMissions,
  mockStamps,
  mockStores,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { PointsLedgerService } from '@/modules/points';
import {
  CheckIn,
  Mission,
  MissionFrequency,
  MissionStatus,
  PassportLevel,
  Stamp,
  StoreCategory,
} from '@/shared/types/domain';
import {
  calculateLevelByLifetimePoints,
  calculateLevelProgress,
  isCheckInEligibleForMission,
  LevelProgressSummary,
} from './domain/gamification-rules';

export interface StampBookSlot {
  storeId: string;
  storeName: string;
  storeFloor: string;
  category: StoreCategory;
  checkInPoints: number;
  collected: boolean;
  stamp?: Stamp;
}

export class GamificationService {
  static calculateLevelByLifetimePoints(lifetimePoints: number): PassportLevel {
    return calculateLevelByLifetimePoints(lifetimePoints);
  }

  static getLevelProgress(
    lifetimePoints: number = mockVisitorProfile.lifetimePoints
  ): LevelProgressSummary {
    return calculateLevelProgress(lifetimePoints);
  }

  /**
   * Concede um carimbo digital vinculado ao check-in válido recém-realizado (RN-03).
   */
  static grantStampFromCheckIn(checkIn: CheckIn, category: StoreCategory): Stamp {
    const newStamp: Stamp = {
      id: `stp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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

  /**
   * Avalia automaticamente todas as missões em andamento após um check-in válido (RN-04).
   * Quando currentCount atinge targetCount, marca a missão como COMPLETED e credita o bônus
   * no Ledger de Pontos de forma idempotente por (mission.id + periodKey).
   */
  static evaluateMissionsAfterCheckIn(
    checkIn: CheckIn,
    storeCategory: StoreCategory
  ): {
    updatedMissions: Mission[];
    completedMissions: Mission[];
  } {
    const updatedMissions: Mission[] = [];
    const completedMissions: Mission[] = [];

    for (const mission of mockMissions) {
      if (!isCheckInEligibleForMission(mission, storeCategory)) {
        continue;
      }

      mission.currentCount = Math.min(
        mission.targetCount,
        mission.currentCount + 1
      );
      updatedMissions.push(mission);

      if (mission.currentCount >= mission.targetCount) {
        mission.status = 'COMPLETED';
        completedMissions.push(mission);

        PointsLedgerService.recordCredit({
          visitorId: checkIn.visitorId,
          amount: mission.rewardPoints,
          origin: 'MISSION',
          referenceId: `${mission.id}:${mission.periodKey}`,
          description: `Bônus de missão concluída: ${mission.title}`,
        });
      }
    }

    return {
      updatedMissions,
      completedMissions,
    };
  }

  /**
   * Retorna a lista de carimbos conquistados, a caderneta completa de lojas parceiras
   * (conquistadas vs. pendentes), as missões (com filtros opcionais) e o progresso de nível.
   */
  static listMissionsAndStamps(filters?: {
    frequency?: MissionFrequency;
    status?: MissionStatus;
  }): {
    stamps: Stamp[];
    stampBook: StampBookSlot[];
    stampCatalog: {
      collectedCount: number;
      totalPartnerStores: number;
    };
    missions: Mission[];
    level: PassportLevel;
    levelProgress: LevelProgressSummary;
  } {
    const activeStores = mockStores.filter((s) => s.isActive);
    const stampBook: StampBookSlot[] = activeStores.map((store) => {
      const earnedStamp = mockStamps.find((st) => st.storeId === store.id);
      return {
        storeId: store.id,
        storeName: store.name,
        storeFloor: store.floor,
        category: store.category,
        checkInPoints: store.checkInPoints,
        collected: Boolean(earnedStamp),
        stamp: earnedStamp,
      };
    });

    const collectedCount = stampBook.filter((slot) => slot.collected).length;

    const missions = mockMissions.filter((m) => {
      if (filters?.frequency && m.frequency !== filters.frequency) return false;
      if (filters?.status && m.status !== filters.status) return false;
      return true;
    });

    const levelProgress = calculateLevelProgress(
      mockVisitorProfile.lifetimePoints
    );

    return {
      stamps: mockStamps,
      stampBook,
      stampCatalog: {
        collectedCount,
        totalPartnerStores: activeStores.length,
      },
      missions,
      level: mockVisitorProfile.level,
      levelProgress,
    };
  }
}
