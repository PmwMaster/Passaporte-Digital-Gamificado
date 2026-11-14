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
import { SessionPayload } from '@/infrastructure/authentication/session';
import { AuthenticationService } from '@/modules/authentication';
import { PASSPORT_LEVELS } from '@/shared/constants';

export class VisitorPassportService {
  static async getPassportOverview(session?: SessionPayload | null) {
    const sessionProfile = session
      ? await AuthenticationService.getProfileFromSession(session)
      : null;

    const user = sessionProfile?.user ?? mockUsers[0];
    const profile = sessionProfile?.profile
      ? {
          id: sessionProfile.profile.id,
          userId: user.id,
          visitorName: user.name,
          memberCode: sessionProfile.profile.memberCode,
          level: sessionProfile.profile.level,
          currentPoints: sessionProfile.profile.currentPoints,
          lifetimePoints: sessionProfile.profile.lifetimePoints,
          totalCheckIns: sessionProfile.profile.totalCheckIns,
          totalStamps: sessionProfile.profile.totalStamps,
        }
      : mockVisitorProfile;

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
