import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/infrastructure/authentication/session';
import { VisitorPassportService } from '@/modules/visitor';

export async function GET() {
  const session = await getCurrentSession();
  const passport = await VisitorPassportService.getPassportOverview(session);
  return NextResponse.json({
    success: true,
    data: passport,
    meta: { timestamp: new Date().toISOString() },
  });
}
