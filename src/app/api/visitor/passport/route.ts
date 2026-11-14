import { NextResponse } from 'next/server';
import { VisitorPassportService } from '@/modules/visitor';

export async function GET() {
  const passport = VisitorPassportService.getPassportOverview();
  return NextResponse.json({
    success: true,
    data: passport,
    meta: { timestamp: new Date().toISOString() },
  });
}
