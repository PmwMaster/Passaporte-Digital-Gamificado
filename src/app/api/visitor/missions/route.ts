import { NextRequest, NextResponse } from 'next/server';
import { GamificationService } from '@/modules/gamification';
import { MissionFrequency, MissionStatus } from '@/shared/types/domain';

const VALID_FREQUENCIES: readonly MissionFrequency[] = [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'SPECIAL',
] as const;

const VALID_STATUSES: readonly MissionStatus[] = [
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const frequencyParam = searchParams.get('frequency');
  const statusParam = searchParams.get('status');

  const frequency = VALID_FREQUENCIES.includes(
    frequencyParam as MissionFrequency
  )
    ? (frequencyParam as MissionFrequency)
    : undefined;

  const status = VALID_STATUSES.includes(statusParam as MissionStatus)
    ? (statusParam as MissionStatus)
    : undefined;

  const overview = GamificationService.listMissionsAndStamps({
    frequency,
    status,
  });

  return NextResponse.json({
    success: true,
    data: overview,
    meta: {
      timestamp: new Date().toISOString(),
      totalMissions: overview.missions.length,
      totalStamps: overview.stamps.length,
    },
  });
}
