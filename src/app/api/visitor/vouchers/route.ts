import { NextRequest, NextResponse } from 'next/server';
import { RewardsCatalogService } from '@/modules/rewards';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const statusFilter =
    statusParam === 'ACTIVE' || statusParam === 'USED' || statusParam === 'EXPIRED'
      ? statusParam
      : undefined;

  const vouchers = RewardsCatalogService.listVisitorVouchers(statusFilter);

  return NextResponse.json({
    success: true,
    data: { vouchers },
    meta: {
      timestamp: new Date().toISOString(),
      total: vouchers.length,
    },
  });
}
