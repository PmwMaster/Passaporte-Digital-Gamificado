// ==============================================================================
// MÓDULO 04 — CHECK-IN E VALIDAÇÃO POR QR CODE + HAVERSINE (RESPONSÁVEL: DEV 02)
// ==============================================================================
// Persistência Híbrida: Grava todas as tentativas (VALID e REJECTED_*) em app_check_ins
// no Neon PostgreSQL e consome o raio dinâmico de Geofence do módulo Administration.

import {
  mockCheckIns,
  mockStores,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import {
  ensureNeonTables,
  getNeonSql,
  isNeonConfigured,
} from '@/infrastructure/database/neon';
import { AdministrationService } from '@/modules/administration';
import { GamificationService } from '@/modules/gamification';
import { PointsLedgerService } from '@/modules/points';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { CheckIn } from '@/shared/types/domain';
import { validateGeofence } from '@/shared/utils/haversine';
import {
  getLocalCheckInDate,
  hasValidCheckInOnSameDay,
  isGpsAccuracyAcceptable,
  MAX_ACCEPTABLE_GPS_ACCURACY_METERS,
} from './domain/checkin-rules';

export interface PerformCheckInInput {
  visitorId?: string;
  qrCodeToken: string;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

function resolveRuntimeGeofenceConfig(): {
  defaultCoordinates: { latitude: number; longitude: number };
  defaultGeofenceRadiusMeters: number;
} {
  const adminWithDynamicConfig = AdministrationService as unknown as {
    getGeofenceConfig?: () => {
      defaultCoordinates: { latitude: number; longitude: number };
      defaultGeofenceRadiusMeters: number;
    };
  };

  if (typeof adminWithDynamicConfig.getGeofenceConfig === 'function') {
    return adminWithDynamicConfig.getGeofenceConfig();
  }

  return SHOPPING_CONFIG;
}

async function persistCheckInToNeon(
  checkIn: CheckIn,
  accuracyMeters?: number
): Promise<void> {
  if (!isNeonConfigured()) return;

  try {
    await ensureNeonTables();
    const sql = getNeonSql();

    await sql`
      INSERT INTO app_check_ins (
        id,
        visitor_id,
        store_id,
        store_name,
        check_in_date,
        latitude,
        longitude,
        accuracy_meters,
        distance_meters,
        is_within_geofence,
        status,
        points_awarded,
        created_at
      ) VALUES (
        ${checkIn.id},
        ${checkIn.visitorId},
        ${checkIn.storeId},
        ${checkIn.storeName},
        ${checkIn.checkInDate},
        ${checkIn.latitude},
        ${checkIn.longitude},
        ${accuracyMeters ?? null},
        ${checkIn.distanceMeters},
        ${checkIn.isWithinGeofence},
        ${checkIn.status},
        ${checkIn.pointsAwarded},
        ${checkIn.createdAt}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
  } catch (err) {
    console.warn(
      '[CheckInService Neon Sync] Falha não bloqueante ao gravar check-in no Neon:',
      err
    );
  }
}

export class CheckInService {
  /**
   * Lista as tentativas recentes de check-in (aprovadas e recusadas) para auditoria antifraude.
   */
  static listRecentCheckIns(visitorId: string = mockVisitorProfile.id): CheckIn[] {
    return mockCheckIns.filter((c) => c.visitorId === visitorId);
  }

  /**
   * Executa o pipeline completo de validação de check-in presencial:
   * 1. Valida precisão do sinal GPS (<= 150m).
   * 2. Valida QR Code contra lojas parceiras ativas.
   * 3. Valida distância trigonométrica Haversine com o raio dinâmico do Admin e grava tentativa se recusado.
   * 4. Valida limite de 1 check-in válido por loja/dia no fuso America/Araguaina (UTC-3).
   * 5. Grava check-in VALID no Neon, credita pontos no Ledger, concede carimbo e avalia missões.
   */
  static performCheckIn(input: PerformCheckInInput) {
    const visitorId = input.visitorId ?? mockVisitorProfile.id;
    const todayDate = getLocalCheckInDate();

    // 1. Validação de precisão do GPS (P0-02)
    if (!isGpsAccuracyAcceptable(input.accuracyMeters)) {
      return {
        ok: false as const,
        httpStatus: 422,
        code: 'GPS_LOW_ACCURACY',
        message: `Sinal de GPS com baixa precisão (${input.accuracyMeters}m). Aproxime-se de uma área aberta para precisão de até ${MAX_ACCEPTABLE_GPS_ACCURACY_METERS}m.`,
        details: {
          accuracyMeters: input.accuracyMeters,
          maxAcceptableAccuracyMeters: MAX_ACCEPTABLE_GPS_ACCURACY_METERS,
        },
      };
    }

    // 2. Validação do Token do QR Code Oficial
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
        message:
          'QR Code não reconhecido ou loja inativa no Passaporte Capim Dourado.',
      };
    }

    // 3. Validação Haversine usando o raio dinâmico do Painel Admin (padrão 250m — RN-01)
    const runtimeGeofence = resolveRuntimeGeofenceConfig();
    const geofence = validateGeofence(
      { latitude: input.latitude, longitude: input.longitude },
      runtimeGeofence.defaultCoordinates,
      runtimeGeofence.defaultGeofenceRadiusMeters
    );

    if (!geofence.isWithinGeofence) {
      const rejectedDistanceCheckIn: CheckIn = {
        id: `chk_rej_dist_${Date.now()}`,
        visitorId,
        storeId: store.id,
        storeName: store.name,
        checkInDate: todayDate,
        latitude: input.latitude,
        longitude: input.longitude,
        distanceMeters: geofence.distanceMeters,
        isWithinGeofence: false,
        status: 'REJECTED_DISTANCE',
        pointsAwarded: 0,
        createdAt: new Date().toISOString(),
      };
      mockCheckIns.unshift(rejectedDistanceCheckIn);
      void persistCheckInToNeon(rejectedDistanceCheckIn, input.accuracyMeters);

      return {
        ok: false as const,
        httpStatus: 422,
        code: 'GEOFENCE_OUT_OF_RANGE',
        message: `Você está a ${geofence.distanceMeters}m do Capim Dourado Shopping. O raio máximo permitido para check-in presencial é de ${geofence.maxRadiusMeters}m.`,
        details: geofence,
      };
    }

    // 4. Validação de 1 Check-in por Loja por Dia Civil em Palmas (RN-02)
    const alreadyCheckedInToday = hasValidCheckInOnSameDay(mockCheckIns, {
      visitorId,
      storeId: store.id,
      checkInDate: todayDate,
    });

    if (alreadyCheckedInToday) {
      const rejectedDuplicateCheckIn: CheckIn = {
        id: `chk_rej_dup_${Date.now()}`,
        visitorId,
        storeId: store.id,
        storeName: store.name,
        checkInDate: todayDate,
        latitude: input.latitude,
        longitude: input.longitude,
        distanceMeters: geofence.distanceMeters,
        isWithinGeofence: true,
        status: 'REJECTED_DUPLICATE',
        pointsAwarded: 0,
        createdAt: new Date().toISOString(),
      };
      mockCheckIns.unshift(rejectedDuplicateCheckIn);
      void persistCheckInToNeon(rejectedDuplicateCheckIn, input.accuracyMeters);

      return {
        ok: false as const,
        httpStatus: 409,
        code: 'DUPLICATE_DAILY_CHECKIN',
        message: `Você já realizou seu check-in diário em ${store.name} hoje (${todayDate}). Visite outras lojas parceiras para continuar pontuando!`,
      };
    }

    // 5. Registro do Check-in Válido + Crédito no Ledger + Carimbo + Avaliação de Missões
    const newCheckIn: CheckIn = {
      id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      visitorId,
      storeId: store.id,
      storeName: store.name,
      checkInDate: todayDate,
      latitude: input.latitude,
      longitude: input.longitude,
      distanceMeters: geofence.distanceMeters,
      isWithinGeofence: true,
      status: 'VALID',
      pointsAwarded: store.checkInPoints,
      createdAt: new Date().toISOString(),
    };

    mockCheckIns.unshift(newCheckIn);
    void persistCheckInToNeon(newCheckIn, input.accuracyMeters);

    const transaction = PointsLedgerService.recordCredit({
      visitorId,
      amount: store.checkInPoints,
      origin: 'CHECKIN',
      referenceId: newCheckIn.id,
      description: `Check-in presencial validado (${geofence.distanceMeters}m) • ${store.name}`,
    });

    const stamp = GamificationService.grantStampFromCheckIn(
      newCheckIn,
      store.category
    );

    const missionEvaluation = GamificationService.evaluateMissionsAfterCheckIn(
      newCheckIn,
      store.category
    );

    const updatedBalance = PointsLedgerService.getStatement().currentPoints;

    return {
      ok: true as const,
      httpStatus: 201,
      data: {
        checkIn: newCheckIn,
        stampEarned: stamp,
        completedMissions: missionEvaluation.completedMissions,
        updatedMissions: missionEvaluation.updatedMissions,
        transaction,
        newBalance: updatedBalance,
      },
    };
  }
}
