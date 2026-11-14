import { NextResponse } from 'next/server';
import { RewardsCatalogService } from '@/modules/rewards';

export async function GET() {
  const catalog = RewardsCatalogService.listCatalog();
  return NextResponse.json({
    success: true,
    data: catalog,
    meta: { timestamp: new Date().toISOString() },
  });
}
