// ==============================================================================
// MÓDULO 03 — PASSAPORTE E PERFIL DO VISITANTE
// ==============================================================================

import {
  mockCheckIns,
  mockMissions,
  mockStamps,
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

    if (!sessionProfile) {
      throw new Error('UNAUTHORIZED');
    }

    const user = sessionProfile.user;
    const profile = sessionProfile.profile ?? {
      id: `vis_${user.id}`,
      userId: user.id,
      visitorName: user.name,
      memberCode: `CD-2026-${user.id.slice(-4).toUpperCase()}`,
      level: 'BRONZE' as const,
      currentPoints: 0,
      lifetimePoints: 0,
      totalCheckIns: 0,
      totalStamps: 0,
    };

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
      stamps: mockStamps.filter((s) => s.visitorId === profile.id || s.visitorId === user.id),
      activeMissions: mockMissions,
      activeVouchers: mockVouchers.filter(
        (v) => (v.visitorId === profile.id || v.visitorId === user.id) && v.status === 'ACTIVE'
      ),
      recentCheckIns: mockCheckIns.filter(
        (c) => c.visitorId === profile.id || c.visitorId === user.id
      ),
    };
  }
}
