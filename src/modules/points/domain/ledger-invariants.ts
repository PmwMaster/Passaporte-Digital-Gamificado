// ==============================================================================
// DOMÍNIO DO SISTEMA DE PONTOS (F06) — INVARIANTES CONTÁBEIS E IDEMPOTÊNCIA
// ==============================================================================

import {
  PointTransaction,
  PointTransactionOrigin,
  PointTransactionType,
} from '@/shared/types/domain';

export const VALID_TRANSACTION_TYPES: readonly PointTransactionType[] = [
  'CREDIT',
  'DEBIT',
] as const;

export const VALID_TRANSACTION_ORIGINS: readonly PointTransactionOrigin[] = [
  'CHECKIN',
  'MISSION',
  'REWARD_REDEMPTION',
  'PROMO_BONUS',
  'ADMIN_ADJUSTMENT',
] as const;

/**
 * Garante que o valor de uma operação de crédito ou débito seja um inteiro positivo (> 0).
 */
export function assertValidPointAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
    throw new Error('INVALID_POINT_AMOUNT');
  }
}

/**
 * Verifica se já existe uma transação idempotente para o mesmo (visitorId, type, origin, referenceId).
 */
export function findExistingTransactionByReference(
  transactions: PointTransaction[],
  params: {
    visitorId: string;
    type: PointTransactionType;
    origin: PointTransactionOrigin;
    referenceId?: string;
  }
): PointTransaction | undefined {
  if (!params.referenceId) {
    return undefined;
  }

  return transactions.find(
    (tx) =>
      tx.visitorId === params.visitorId &&
      tx.type === params.type &&
      tx.origin === params.origin &&
      tx.referenceId === params.referenceId
  );
}

/**
 * Calcula os totais de créditos e débitos e confere se o saldo atual coincide
 * com o balanceAfter da transação mais recente do visitante (RN-06).
 */
export function calculateLedgerMetrics(
  transactions: PointTransaction[],
  currentPoints: number
): {
  totalCredits: number;
  totalDebits: number;
  latestBalanceAfter: number;
  isIntegrityValid: boolean;
} {
  let totalCredits = 0;
  let totalDebits = 0;

  for (const tx of transactions) {
    if (tx.type === 'CREDIT') {
      totalCredits += tx.amount;
    } else if (tx.type === 'DEBIT') {
      totalDebits += tx.amount;
    }
  }

  const latestBalanceAfter =
    transactions.length > 0 ? transactions[0].balanceAfter : currentPoints;

  return {
    totalCredits,
    totalDebits,
    latestBalanceAfter,
    isIntegrityValid: latestBalanceAfter === currentPoints && currentPoints >= 0,
  };
}
