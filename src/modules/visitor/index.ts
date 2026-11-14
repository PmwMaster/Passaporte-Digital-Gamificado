// ==============================================================================
// MÓDULO 03 — PASSAPORTE E PERFIL DO VISITANTE (NEON POSTGRESQL + FALLBACK)
// ==============================================================================

import {
  mockCheckIns,
  mockMissions,
  mockStamps,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { getNeonSql, isNeonConfigured } from '@/infrastructure/database/neon';
import { SessionPayload } from '@/infrastructure/authentication/session';
import { AuthenticationService } from '@/modules/authentication';
import { PASSPORT_LEVELS } from '@/shared/constants';
import { CheckIn, Stamp, Voucher, VoucherStatus } from '@/shared/types/domain';

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

    let stamps: Stamp[] = mockStamps.filter(
      (s) => s.visitorId === profile.id || s.visitorId === user.id
    );
    let activeVouchers: Voucher[] = mockVouchers.filter(
      (v) => (v.visitorId === profile.id || v.visitorId === user.id) && v.status === 'ACTIVE'
    );
    let recentCheckIns: CheckIn[] = mockCheckIns.filter(
      (c) => c.visitorId === profile.id || c.visitorId === user.id
    );

    if (isNeonConfigured()) {
      try {
        const sql = getNeonSql();

        // 1. Carimbos do Neon
        const rawStamps = await sql`
          SELECT id, visitor_id, store_id, store_name, check_in_id, badge_title, category, earned_at
          FROM app_stamps
          WHERE visitor_id = ${profile.id}
          ORDER BY earned_at DESC
        `;
        if (rawStamps.length > 0) {
          stamps = rawStamps.map((s) => ({
            id: String(s.id),
            visitorId: String(s.visitor_id),
            storeId: String(s.store_id),
            storeName: String(s.store_name),
            checkInId: String(s.check_in_id),
            badgeTitle: String(s.badge_title),
            category: s.category ? String(s.category) : undefined,
            earnedAt: new Date(String(s.earned_at)).toISOString(),
          }));
        }

        // 2. Vouchers Ativos do Neon
        const now = Date.now();
        const rawVouchers = await sql`
          SELECT id, code, qr_payload, visitor_id, visitor_name,
                 reward_id, reward_title, store_id, store_name,
                 store_floor, points_spent, status, issued_at,
                 expires_at, used_at
          FROM app_vouchers
          WHERE visitor_id = ${profile.id} AND status = 'ACTIVE'
          ORDER BY issued_at DESC
        `;
        if (rawVouchers.length > 0) {
          activeVouchers = rawVouchers
            .filter((v) => new Date(String(v.expires_at)).getTime() >= now)
            .map((v) => ({
              id: String(v.id),
              code: String(v.code),
              qrPayload: String(v.qr_payload),
              visitorId: String(v.visitor_id),
              visitorName: String(v.visitor_name),
              rewardId: String(v.reward_id),
              rewardTitle: String(v.reward_title),
              storeId: String(v.store_id),
              storeName: String(v.store_name),
              storeFloor: String(v.store_floor),
              pointsSpent: Number(v.points_spent),
              status: (v.status as VoucherStatus) || 'ACTIVE',
              issuedAt: new Date(String(v.issued_at)).toISOString(),
              expiresAt: new Date(String(v.expires_at)).toISOString(),
              usedAt: v.used_at ? new Date(String(v.used_at)).toISOString() : undefined,
            }));
        }

        // 3. Check-ins Recentes do Neon
        const rawCheckIns = await sql`
          SELECT id, visitor_id, store_id, store_name, check_in_date,
                 latitude, longitude, accuracy_meters, distance_meters,
                 is_within_geofence, status, points_awarded, created_at
          FROM app_check_ins
          WHERE visitor_id = ${profile.id}
          ORDER BY created_at DESC
          LIMIT 10
        `;
        if (rawCheckIns.length > 0) {
          recentCheckIns = rawCheckIns.map((c) => ({
            id: String(c.id),
            visitorId: String(c.visitor_id),
            storeId: String(c.store_id),
            storeName: String(c.store_name),
            checkInDate: String(c.check_in_date),
            latitude: Number(c.latitude),
            longitude: Number(c.longitude),
            accuracyMeters: c.accuracy_meters ? Number(c.accuracy_meters) : undefined,
            distanceMeters: Number(c.distance_meters),
            isWithinGeofence: Boolean(c.is_within_geofence),
            status: (c.status as 'VALID' | 'REJECTED') || 'VALID',
            pointsAwarded: Number(c.points_awarded),
            createdAt: new Date(String(c.created_at)).toISOString(),
          }));
        }
      } catch (err) {
        console.warn('[VisitorPassportService] Erro ao carregar dados do Neon, usando fallback:', err);
      }
    }

    return {
      user,
      profile,
      levelInfo,
      progressPercent,
      stamps,
      activeMissions: mockMissions,
      activeVouchers,
      recentCheckIns,
    };
  }
}
