import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/infrastructure/authentication/session';
import { PointsLedgerService } from '@/modules/points';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const typeFilter =
    typeParam === 'CREDIT' || typeParam === 'DEBIT' ? typeParam : undefined;

  const statement = await PointsLedgerService.getStatement(
    session?.userId,
    typeFilter
  );

  return NextResponse.json({
    success: true,
    data: statement,
    meta: {
      timestamp: new Date().toISOString(),
      total: statement.transactions.length,
    },
  });
}
