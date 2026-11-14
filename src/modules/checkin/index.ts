// ==============================================================================
// MÓDULO 04 — CHECK-IN E VALIDAÇÃO POR QR CODE + HAVERSINE (NEON + GEOLOCALIZAÇÃO)
// ==============================================================================

import {
  mockCheckIns,
  mockStores,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { getNeonSql, isNeonConfigured } from '@/infrastructure/database/neon';
import { CheckIn, Stamp } from '@/shared/types/domain';
import { validateGeofence } from '@/shared/utils/haversine';
import { AdministrationService } from '@/modules/administration';
import { GamificationService } from '@/modules/gamification';
import { PointsLedgerService } from '@/modules/points';

export interface PerformCheckInInput {
  visitorId?: string;
  qrCodeToken: string;
  latitude: number;
  longitude: number;
}

export class CheckInService {
  static async performCheckIn(input: PerformCheckInInput) {
    const rawVisitorId = input.visitorId ?? mockVisitorProfile.id;
    const store = mockStores.find(
      (s) =>
        s.qrCodeToken.toUpperCase() === input.qrCodeToken.trim().toUpperCase() &&
        s.isActive
    );

    if (!store) {
      return {
        ok: false as const,
        httpStatus: 404,
        code: 'INVALID_QR_TOKEN',
        message: 'QR Code não reconhecido ou loja inativa no Passe Dourado.',
      };
    }

    // 1. Validação Haversine usando a configuração dinâmica do Admin (padrão 250m)
    const geofenceConfig = AdministrationService.getGeofenceConfig();
    const geofence = validateGeofence(
      { latitude: input.latitude, longitude: input.longitude },
      geofenceConfig.defaultCoordinates,
      geofenceConfig.defaultGeofenceRadiusMeters
    );

    if (!geofence.isWithinGeofence) {
      return {
        ok: false as const,
        httpStatus: 422,
        code: 'GEOFENCE_OUT_OF_RANGE',
        message: `Você está a ${geofence.distanceMeters}m do Passe Dourado Shopping. O raio máximo permitido para check-in presencial é de ${geofence.maxRadiusMeters}m.`,
        details: geofence,
      };
    }

    // 2. Validação de 1 Check-in por Loja por Dia Civil
    const todayDate = new Date().toISOString().slice(0, 10);
    const checkInId = `chk_${Date.now()}`;
    const stampId = `stmp_${Date.now()}`;
    const nowIso = new Date().toISOString();

    let resolvedProfileId = rawVisitorId;

    if (isNeonConfigured()) {
      try {
        const sql = getNeonSql();
        const profiles = await sql`
          SELECT id, user_id, total_check_ins, total_stamps
          FROM app_visitor_profiles
          WHERE id = ${rawVisitorId} OR user_id = ${rawVisitorId}
          LIMIT 1
        `;

        if (profiles.length > 0) {
          resolvedProfileId = String(profiles[0].id);

          const existing = await sql`
            SELECT id FROM app_check_ins
            WHERE visitor_id = ${resolvedProfileId}
              AND store_id = ${store.id}
              AND check_in_date = ${todayDate}
              AND status = 'VALID'
            LIMIT 1
          `;

          if (existing.length > 0) {
            return {
              ok: false as const,
              httpStatus: 409,
              code: 'DUPLICATE_DAILY_CHECKIN',
              message: `Você já realizou seu check-in diário em ${store.name} hoje (${todayDate}). Visite outras lojas parceiras para continuar pontuando!`,
            };
          }

          // Inserir Check-in no Neon
          await sql`
            INSERT INTO app_check_ins (
              id, visitor_id, store_id, store_name, check_in_date,
              latitude, longitude, accuracy_meters, distance_meters,
              is_within_geofence, status, points_awarded, created_at
            ) VALUES (
              ${checkInId}, ${resolvedProfileId}, ${store.id}, ${store.name}, ${todayDate},
              ${input.latitude}, ${input.longitude}, 10, ${geofence.distanceMeters},
              TRUE, 'VALID', ${store.checkInPoints}, NOW()
            )
          `;

          // Inserir Stamp no Neon
          const badgeTitle = `Passaporte ${store.category}: ${store.name}`;
          await sql`
            INSERT INTO app_stamps (
              id, visitor_id, store_id, store_name, check_in_id,
              badge_title, category, earned_at
            ) VALUES (
              ${stampId}, ${resolvedProfileId}, ${store.id}, ${store.name},
              ${checkInId}, ${badgeTitle}, ${store.category}, NOW()
            )
          `;

          // Atualizar contadores no perfil
          await sql`
            UPDATE app_visitor_profiles
            SET
              total_check_ins = total_check_ins + 1,
              total_stamps = total_stamps + 1
            WHERE id = ${resolvedProfileId}
          `;

          // Creditar pontos
          const transaction = await PointsLedgerService.recordCredit({
            visitorId: resolvedProfileId,
            amount: store.checkInPoints,
            origin: 'CHECKIN',
            referenceId: checkInId,
            description: `Check-in presencial validado (${geofence.distanceMeters}m) • ${store.name}`,
          });

          const newCheckIn: CheckIn = {
            id: checkInId,
            visitorId: resolvedProfileId,
            storeId: store.id,
            storeName: store.name,
            checkInDate: todayDate,
            latitude: input.latitude,
            longitude: input.longitude,
            distanceMeters: geofence.distanceMeters,
            isWithinGeofence: true,
            status: 'VALID',
            pointsAwarded: store.checkInPoints,
            createdAt: nowIso,
          };

          const stamp: Stamp = {
            id: stampId,
            visitorId: resolvedProfileId,
            storeId: store.id,
            storeName: store.name,
            checkInId,
            badgeTitle,
            category: store.category,
            earnedAt: nowIso,
          };

          return {
            ok: true as const,
            httpStatus: 201,
            data: {
              checkIn: newCheckIn,
              stampEarned: stamp,
              transaction,
              newBalance: transaction.balanceAfter,
            },
          };
        }
      } catch (err) {
        console.warn('[CheckInService] Erro ao registrar check-in no Neon, usando memória:', err);
      }
    }

    // Fallback em memória
    const alreadyCheckedInToday = mockCheckIns.some(
      (c) =>
        c.visitorId === resolvedProfileId &&
        c.storeId === store.id &&
        c.checkInDate === todayDate &&
        c.status === 'VALID'
    );

    if (alreadyCheckedInToday) {
      return {
        ok: false as const,
        httpStatus: 409,
        code: 'DUPLICATE_DAILY_CHECKIN',
        message: `Você já realizou seu check-in diário em ${store.name} hoje (${todayDate}). Visite outras lojas parceiras para continuar pontuando!`,
      };
    }

    const newCheckIn: CheckIn = {
      id: checkInId,
      visitorId: resolvedProfileId,
      storeId: store.id,
      storeName: store.name,
      checkInDate: todayDate,
      latitude: input.latitude,
      longitude: input.longitude,
      distanceMeters: geofence.distanceMeters,
      isWithinGeofence: true,
      status: 'VALID',
      pointsAwarded: store.checkInPoints,
      createdAt: nowIso,
    };

    mockCheckIns.unshift(newCheckIn);

    const transaction = await PointsLedgerService.recordCredit({
      visitorId: resolvedProfileId,
      amount: store.checkInPoints,
      origin: 'CHECKIN',
      referenceId: newCheckIn.id,
      description: `Check-in presencial validado (${geofence.distanceMeters}m) • ${store.name}`,
    });

    const stamp = GamificationService.grantStampFromCheckIn(
      newCheckIn,
      store.category
    );

    return {
      ok: true as const,
      httpStatus: 201,
      data: {
        checkIn: newCheckIn,
        stampEarned: stamp,
        transaction,
        newBalance: transaction.balanceAfter,
      },
    };
  }
}
