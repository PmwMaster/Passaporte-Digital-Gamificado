// ==============================================================================
// MÓDULO 04 — CHECK-IN E VALIDAÇÃO POR QR CODE + HAVERSINE (RESPONSÁVEL: DEV 02)
// ==============================================================================

import { mockCheckIns, mockStores, mockVisitorProfile } from '@/infrastructure/database/mock-data';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { CheckIn } from '@/shared/types/domain';
import { validateGeofence } from '@/shared/utils/haversine';
import { GamificationService } from '@/modules/gamification';
import { PointsLedgerService } from '@/modules/points';

export interface PerformCheckInInput {
  visitorId?: string;
  qrCodeToken: string;
  latitude: number;
  longitude: number;
}

export class CheckInService {
  static performCheckIn(input: PerformCheckInInput) {
    const visitorId = input.visitorId ?? mockVisitorProfile.id;
    const store = mockStores.find(
      (s) => s.qrCodeToken.toUpperCase() === input.qrCodeToken.trim().toUpperCase() && s.isActive
    );

    if (!store) {
      return {
        ok: false as const,
        httpStatus: 404,
        code: 'INVALID_QR_TOKEN',
        message: 'QR Code não reconhecido ou loja inativa no Passaporte Capim Dourado.',
      };
    }

    // 1. Validação Haversine (Geofence padrão 250m)
    const geofence = validateGeofence(
      { latitude: input.latitude, longitude: input.longitude },
      SHOPPING_CONFIG.defaultCoordinates,
      SHOPPING_CONFIG.defaultGeofenceRadiusMeters
    );

    if (!geofence.isWithinGeofence) {
      return {
        ok: false as const,
        httpStatus: 422,
        code: 'GEOFENCE_OUT_OF_RANGE',
        message: `Você está a ${geofence.distanceMeters}m do Capim Dourado Shopping. O raio máximo permitido para check-in presencial é de ${geofence.maxRadiusMeters}m.`,
        details: geofence,
      };
    }

    // 2. Validação de 1 Check-in por Loja por Dia Civil
    const todayDate = new Date().toISOString().slice(0, 10);
    const alreadyCheckedInToday = mockCheckIns.some(
      (c) =>
        c.visitorId === visitorId &&
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

    // 3. Registro do Check-in + Carimbo + Crédito no Ledger
    const newCheckIn: CheckIn = {
      id: `chk_${Date.now()}`,
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

    const transaction = PointsLedgerService.recordCredit({
      visitorId,
      amount: store.checkInPoints,
      origin: 'CHECKIN',
      referenceId: newCheckIn.id,
      description: `Check-in presencial validado (${geofence.distanceMeters}m) • ${store.name}`,
    });

    const stamp = GamificationService.grantStampFromCheckIn(newCheckIn, store.category);

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
