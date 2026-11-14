import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/infrastructure/authentication/session';
import { RewardsCatalogService } from '@/modules/rewards';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status');
  const statusFilter =
    statusParam === 'ACTIVE' || statusParam === 'USED' || statusParam === 'EXPIRED'
      ? statusParam
      : undefined;

  const vouchers = await RewardsCatalogService.listVisitorVouchers(
    statusFilter,
    session?.userId
  );

  return NextResponse.json({
    success: true,
    data: { vouchers },
    meta: {
      timestamp: new Date().toISOString(),
      total: vouchers.length,
    },
  });
}
