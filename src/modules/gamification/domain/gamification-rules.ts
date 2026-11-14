// ==============================================================================
// DOMÍNIO DE GAMIFICAÇÃO (F05) — NÍVEIS, CHAVES DE PERÍODO E ELEGIBILIDADE
// ==============================================================================

import { PASSPORT_LEVELS } from '@/shared/constants';
import {
  Mission,
  MissionFrequency,
  PassportLevel,
  StoreCategory,
} from '@/shared/types/domain';

export interface LevelProgressSummary {
  level: PassportLevel;
  levelLabel: string;
  lifetimePoints: number;
  minLifetimePoints: number;
  nextLevelPoints: number;
  pointsToNextLevel: number;
  progressPercent: number;
}

/**
 * Determina o nível do passaporte com base nos pontos acumulados na trajetória (RN-05).
 */
export function calculateLevelByLifetimePoints(
  lifetimePoints: number
): PassportLevel {
  if (lifetimePoints >= PASSPORT_LEVELS.DIAMOND.minLifetimePoints) return 'DIAMOND';
  if (lifetimePoints >= PASSPORT_LEVELS.GOLD.minLifetimePoints) return 'GOLD';
  if (lifetimePoints >= PASSPORT_LEVELS.SILVER.minLifetimePoints) return 'SILVER';
  return 'BRONZE';
}

/**
 * Calcula o resumo completo de progresso de nível do visitante.
 */
export function calculateLevelProgress(
  lifetimePoints: number
): LevelProgressSummary {
  const level = calculateLevelByLifetimePoints(lifetimePoints);
  const info = PASSPORT_LEVELS[level];
  const span = Math.max(1, info.nextLevelPoints - info.minLifetimePoints);
  const earnedInSpan = Math.max(0, lifetimePoints - info.minLifetimePoints);
  const progressPercent = Math.min(100, Math.round((earnedInSpan / span) * 100));
  const pointsToNextLevel = Math.max(0, info.nextLevelPoints - lifetimePoints);

  return {
    level,
    levelLabel: info.label,
    lifetimePoints,
    minLifetimePoints: info.minLifetimePoints,
    nextLevelPoints: info.nextLevelPoints,
    pointsToNextLevel,
    progressPercent,
  };
}

/**
 * Retorna a data local ("YYYY-MM-DD") no fuso horário oficial de Palmas - TO (America/Araguaina, UTC-3).
 */
export function getPalmasLocalDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Araguaina',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Gera a chave de período (periodKey) para cada frequência de missão no fuso de Palmas.
 */
export function getPeriodKeyForFrequency(
  frequency: MissionFrequency,
  date: Date = new Date()
): string {
  const localDate = getPalmasLocalDateString(date); // YYYY-MM-DD
  if (frequency === 'DAILY') {
    return localDate;
  }
  if (frequency === 'MONTHLY') {
    return localDate.slice(0, 7); // YYYY-MM
  }
  if (frequency === 'WEEKLY') {
    const [yearStr, monthStr, dayStr] = localDate.split('-');
    const utcDate = new Date(
      Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
    );
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
      ((utcDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
    return `${utcDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
  return `SPECIAL-${localDate.slice(0, 4)}`;
}

/**
 * Verifica se um check-in válido em determinada categoria de loja contribui para a missão.
 */
export function isCheckInEligibleForMission(
  mission: Mission,
  storeCategory: StoreCategory
): boolean {
  if (mission.status !== 'IN_PROGRESS') {
    return false;
  }

  if (mission.targetCategory && mission.targetCategory !== storeCategory) {
    return false;
  }

  return true;
}
