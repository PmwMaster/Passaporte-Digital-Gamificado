import { NextResponse } from 'next/server';
import { AdministrationService } from '@/modules/administration';

export async function GET() {
  const dashboard = AdministrationService.getExecutiveDashboard();
  return NextResponse.json({
    success: true,
    data: dashboard,
    meta: { timestamp: new Date().toISOString() },
  });
}
