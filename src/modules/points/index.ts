// ==============================================================================
// MÓDULO 06 — SISTEMA DE PONTOS E EXTRATO AUDITÁVEL (RESPONSÁVEL: DEV 02)
// ==============================================================================
// Regra Crítica (RN-06): Proibido alterar saldo diretamente sem registrar PointTransaction.
// Persistência Híbrida: Atualiza estado local imediatamente e sincroniza no Neon PostgreSQL.

import {
  mockPointTransactions,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import {
  ensureNeonTables,
  getNeonSql,
  isNeonConfigured,
} from '@/infrastructure/database/neon';
import { GamificationService } from '@/modules/gamification';
import { PASSPORT_LEVELS } from '@/shared/constants';
import {
  IPointsLedgerService,
  PassportLevel,
  PointTransaction,
  PointTransactionOrigin,
  PointTransactionType,
} from '@/shared/types/domain';
import {
  assertValidPointAmount,
  calculateLedgerMetrics,
  findExistingTransactionByReference,
} from './domain/ledger-invariants';

export interface LedgerOperationInput {
  visitorId: string;
  amount: number;
  origin: PointTransactionOrigin;
  referenceId?: string;
  description: string;
}

export interface StatementSummary {
  currentPoints: number;
  lifetimePoints: number;
  level: PassportLevel;
  levelLabel: string;
  nextLevelPoints: number;
  totalCredits: number;
  totalDebits: number;
  isIntegrityValid: boolean;
  transactions: PointTransaction[];
}

async function persistTransactionToNeon(
  tx: PointTransaction,
  profileSnapshot: {
    currentPoints: number;
    lifetimePoints: number;
    level: PassportLevel;
  }
): Promise<void> {
  if (!isNeonConfigured()) return;

  try {
    await ensureNeonTables();
    const sql = getNeonSql();

    await sql`
      UPDATE app_visitor_profiles
      SET
        current_points = ${profileSnapshot.currentPoints},
        lifetime_points = ${profileSnapshot.lifetimePoints},
        level = ${profileSnapshot.level}
      WHERE id = ${tx.visitorId};
    `;

    await sql`
      INSERT INTO app_point_transactions (
        id,
        visitor_id,
        type,
        amount,
        balance_after,
        origin,
        reference_id,
        description,
        created_at
      ) VALUES (
        ${tx.id},
        ${tx.visitorId},
        ${tx.type},
        ${tx.amount},
        ${tx.balanceAfter},
        ${tx.origin},
        ${tx.referenceId ?? null},
        ${tx.description},
        ${tx.createdAt}
      )
      ON CONFLICT DO NOTHING;
    `;
  } catch (err) {
    console.warn(
      '[PointsLedgerService Neon Sync] Falha não bloqueante ao gravar no Neon:',
      err
    );
  }
}

export class PointsLedgerService {
  /**
   * Registra um crédito de pontos de forma atômica e idempotente por (visitorId, origin, referenceId),
   * sincronizando o lançamento em app_point_transactions e o saldo em app_visitor_profiles no Neon.
   */
  static recordCredit(params: LedgerOperationInput): PointTransaction {
    assertValidPointAmount(params.amount);

    const existing = findExistingTransactionByReference(mockPointTransactions, {
      visitorId: params.visitorId,
      type: 'CREDIT',
      origin: params.origin,
      referenceId: params.referenceId,
    });

    if (existing) {
      return existing;
    }

    const newBalance = mockVisitorProfile.currentPoints + params.amount;
    mockVisitorProfile.currentPoints = newBalance;
    mockVisitorProfile.lifetimePoints += params.amount;
    mockVisitorProfile.level = GamificationService.calculateLevelByLifetimePoints(
      mockVisitorProfile.lifetimePoints
    );

    const tx: PointTransaction = {
      id: `ptx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      visitorId: params.visitorId,
      type: 'CREDIT',
      amount: params.amount,
      balanceAfter: newBalance,
      origin: params.origin,
      referenceId: params.referenceId,
      description: params.description,
      createdAt: new Date().toISOString(),
    };

    mockPointTransactions.unshift(tx);

    void persistTransactionToNeon(tx, {
      currentPoints: mockVisitorProfile.currentPoints,
      lifetimePoints: mockVisitorProfile.lifetimePoints,
      level: mockVisitorProfile.level,
    });

    return tx;
  }

  /**
   * Registra um débito de pontos garantindo que o saldo nunca fique negativo (RN-06),
   * preservando lifetimePoints e level do visitante (RN-05) e sincronizando no Neon.
   */
  static recordDebit(params: LedgerOperationInput): PointTransaction {
    assertValidPointAmount(params.amount);

    const existing = findExistingTransactionByReference(mockPointTransactions, {
      visitorId: params.visitorId,
      type: 'DEBIT',
      origin: params.origin,
      referenceId: params.referenceId,
    });

    if (existing) {
      return existing;
    }

    if (mockVisitorProfile.currentPoints < params.amount) {
      throw new Error('INSUFFICIENT_POINTS');
    }

    const newBalance = mockVisitorProfile.currentPoints - params.amount;
    mockVisitorProfile.currentPoints = newBalance;

    const tx: PointTransaction = {
      id: `ptx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      visitorId: params.visitorId,
      type: 'DEBIT',
      amount: params.amount,
      balanceAfter: newBalance,
      origin: params.origin,
      referenceId: params.referenceId,
      description: params.description,
      createdAt: new Date().toISOString(),
    };

    mockPointTransactions.unshift(tx);

    void persistTransactionToNeon(tx, {
      currentPoints: mockVisitorProfile.currentPoints,
      lifetimePoints: mockVisitorProfile.lifetimePoints,
      level: mockVisitorProfile.level,
    });

    return tx;
  }

  /**
   * Retorna o extrato completo ou filtrado por tipo (CREDIT | DEBIT) e origem,
   * incluindo indicadores de nível e validação de integridade contábil.
   */
  static getStatement(
    typeFilter?: PointTransactionType,
    originFilter?: PointTransactionOrigin
  ): StatementSummary {
    const metrics = calculateLedgerMetrics(
      mockPointTransactions,
      mockVisitorProfile.currentPoints
    );

    const transactions = mockPointTransactions.filter((tx) => {
      if (typeFilter && tx.type !== typeFilter) return false;
      if (originFilter && tx.origin !== originFilter) return false;
      return true;
    });

    const levelInfo = PASSPORT_LEVELS[mockVisitorProfile.level];

    return {
      currentPoints: mockVisitorProfile.currentPoints,
      lifetimePoints: mockVisitorProfile.lifetimePoints,
      level: mockVisitorProfile.level,
      levelLabel: levelInfo.label,
      nextLevelPoints: levelInfo.nextLevelPoints,
      totalCredits: metrics.totalCredits,
      totalDebits: metrics.totalDebits,
      isIntegrityValid: metrics.isIntegrityValid,
      transactions,
    };
  }
}

/**
 * Adaptador assíncrono que implementa formalmente o contrato IPointsLedgerService
 * compartilhado com o módulo de Recompensas (DEV 03).
 */
export const pointsLedgerContractAdapter: IPointsLedgerService = {
  async creditPoints(params) {
    return PointsLedgerService.recordCredit(params);
  },
  async debitPoints(params) {
    return PointsLedgerService.recordDebit(params);
  },
};
