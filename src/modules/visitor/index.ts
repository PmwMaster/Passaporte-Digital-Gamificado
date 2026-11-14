// ==============================================================================
// MÓDULO 03 — PASSAPORTE E PERFIL DO VISITANTE (RESPONSÁVEL: DEV 01)
// ==============================================================================

import {
  mockCheckIns,
  mockMissions,
  mockStamps,
  mockUsers,
  mockVisitorProfile,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { PASSPORT_LEVELS } from '@/shared/constants';

export class VisitorPassportService {
  static getPassportOverview() {
    const user = mockUsers[0];
    const profile = mockVisitorProfile;
    const levelInfo = PASSPORT_LEVELS[profile.level];
    const progressPercent = Math.min(
      100,
      Math.round((profile.lifetimePoints / levelInfo.nextLevelPoints) * 100)
    );

    return {
      user,
      profile,
      levelInfo,
      progressPercent,
      stamps: mockStamps,
      activeMissions: mockMissions,
      activeVouchers: mockVouchers.filter((v) => v.status === 'ACTIVE'),
      recentCheckIns: mockCheckIns,
    };
  }
}
