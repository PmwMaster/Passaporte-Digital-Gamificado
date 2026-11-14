import { NextRequest, NextResponse } from 'next/server';
import { PointsLedgerService } from '@/modules/points';
import {
  VALID_TRANSACTION_ORIGINS,
  VALID_TRANSACTION_TYPES,
} from '@/modules/points/domain/ledger-invariants';
import {
  PointTransactionOrigin,
  PointTransactionType,
} from '@/shared/types/domain';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get('type');
  const originParam = searchParams.get('origin');

  const typeFilter = VALID_TRANSACTION_TYPES.includes(
    typeParam as PointTransactionType
  )
    ? (typeParam as PointTransactionType)
    : undefined;

  const originFilter = VALID_TRANSACTION_ORIGINS.includes(
    originParam as PointTransactionOrigin
  )
    ? (originParam as PointTransactionOrigin)
    : undefined;

  const statement = PointsLedgerService.getStatement(typeFilter, originFilter);

  return NextResponse.json({
    success: true,
    data: statement,
    meta: {
      timestamp: new Date().toISOString(),
      total: statement.transactions.length,
    },
  });
}
