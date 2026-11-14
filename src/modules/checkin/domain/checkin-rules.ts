// ==============================================================================
// DOMÍNIO DE CHECK-IN (F04) — REGRAS DE DATA LOCAL, PRECISÃO GPS E DUPLICIDADE
// ==============================================================================

import { CheckIn } from '@/shared/types/domain';

export const MAX_ACCEPTABLE_GPS_ACCURACY_METERS = 150;

/**
 * Retorna a data civil ("YYYY-MM-DD") no fuso horário de Palmas - TO (America/Araguaina, UTC-3).
 * Evita que check-ins realizados entre 21:00 e 23:59 (horário local) caiam no dia seguinte em UTC.
 */
export function getLocalCheckInDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Araguaina',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Verifica se a precisão reportada pelo GPS do dispositivo está dentro do limite aceitável (<= 150m).
 */
export function isGpsAccuracyAcceptable(accuracyMeters?: number): boolean {
  if (accuracyMeters === undefined) {
    return true;
  }
  return Number.isFinite(accuracyMeters) && accuracyMeters >= 0 && accuracyMeters <= MAX_ACCEPTABLE_GPS_ACCURACY_METERS;
}

/**
 * Verifica se o visitante já possui um check-in VALID para a mesma loja na mesma data civil local (RN-02).
 */
export function hasValidCheckInOnSameDay(
  checkIns: CheckIn[],
  params: {
    visitorId: string;
    storeId: string;
    checkInDate: string;
  }
): boolean {
  return checkIns.some(
    (c) =>
      c.visitorId === params.visitorId &&
      c.storeId === params.storeId &&
      c.checkInDate === params.checkInDate &&
      c.status === 'VALID'
  );
}
