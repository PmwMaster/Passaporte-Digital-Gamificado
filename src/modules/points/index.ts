// ==============================================================================
// MÓDULO 06 — SISTEMA DE PONTOS E EXTRATO AUDITÁVEL (NEON POSTGRESQL + FALLBACK)
// ==============================================================================
// Regra Crítica: Proibido alterar saldo diretamente sem registrar PointTransaction.

import {
  mockPointTransactions,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { getNeonSql, isNeonConfigured } from '@/infrastructure/database/neon';
import { GamificationService } from '@/modules/gamification';
import {
  PassportLevel,
  PointTransaction,
  PointTransactionOrigin,
} from '@/shared/types/domain';

export class PointsLedgerService {
  static async recordCredit(params: {
    visitorId: string;
    amount: number;
    origin: PointTransactionOrigin;
    referenceId?: string;
    description: string;
  }): Promise<PointTransaction> {
    if (params.amount <= 0) {
      throw new Error('INVALID_POINT_AMOUNT');
    }

    const txId = `ptx_${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (isNeonConfigured()) {
      try {
        const sql = getNeonSql();
        const profiles = await sql`
          SELECT id, current_points, lifetime_points, level
          FROM app_visitor_profiles
          WHERE id = ${params.visitorId} OR user_id = ${params.visitorId}
          LIMIT 1
        `;

        if (profiles.length > 0) {
          const prof = profiles[0];
          const newBalance = Number(prof.current_points) + params.amount;
          const newLifetime = Number(prof.lifetime_points) + params.amount;
          const newLevel = GamificationService.calculateLevelByLifetimePoints(newLifetime);

          await sql`
            UPDATE app_visitor_profiles
            SET
              current_points = ${newBalance},
              lifetime_points = ${newLifetime},
              level = ${newLevel}
            WHERE id = ${prof.id}
          `;

          await sql`
            INSERT INTO app_point_transactions (
              id, visitor_id, type, amount, balance_after,
              origin, reference_id, description, created_at
            ) VALUES (
              ${txId}, ${prof.id}, 'CREDIT', ${params.amount}, ${newBalance},
              ${params.origin}, ${params.referenceId ?? null}, ${params.description}, NOW()
            )
          `;

          return {
            id: txId,
            visitorId: String(prof.id),
            type: 'CREDIT',
            amount: params.amount,
            balanceAfter: newBalance,
            origin: params.origin,
            referenceId: params.referenceId,
            description: params.description,
            createdAt: nowIso,
          };
        }
      } catch (err) {
        console.warn('[PointsLedgerService] Falha ao persistir crédito no Neon, usando memória:', err);
      }
    }

    // Fallback em memória
    const newBalance = mockVisitorProfile.currentPoints + params.amount;
    mockVisitorProfile.currentPoints = newBalance;
    mockVisitorProfile.lifetimePoints += params.amount;
    mockVisitorProfile.level = GamificationService.calculateLevelByLifetimePoints(
      mockVisitorProfile.lifetimePoints
    );

    const tx: PointTransaction = {
      id: txId,
      visitorId: params.visitorId,
      type: 'CREDIT',
      amount: params.amount,
      balanceAfter: newBalance,
      origin: params.origin,
      referenceId: params.referenceId,
      description: params.description,
      createdAt: nowIso,
    };

    mockPointTransactions.unshift(tx);
    return tx;
  }

  static async recordDebit(params: {
    visitorId: string;
    amount: number;
    origin: PointTransactionOrigin;
    referenceId?: string;
    description: string;
  }): Promise<PointTransaction> {
    if (params.amount <= 0) {
      throw new Error('INVALID_POINT_AMOUNT');
    }

    const txId = `ptx_${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (isNeonConfigured()) {
      try {
        const sql = getNeonSql();
        const profiles = await sql`
          SELECT id, current_points, lifetime_points, level
          FROM app_visitor_profiles
          WHERE id = ${params.visitorId} OR user_id = ${params.visitorId}
          LIMIT 1
        `;

        if (profiles.length > 0) {
          const prof = profiles[0];
          const cur = Number(prof.current_points);
          if (cur < params.amount) {
            throw new Error('INSUFFICIENT_POINTS');
          }

          const newBalance = cur - params.amount;

          await sql`
            UPDATE app_visitor_profiles
            SET current_points = ${newBalance}
            WHERE id = ${prof.id}
          `;

          await sql`
            INSERT INTO app_point_transactions (
              id, visitor_id, type, amount, balance_after,
              origin, reference_id, description, created_at
            ) VALUES (
              ${txId}, ${prof.id}, 'DEBIT', ${params.amount}, ${newBalance},
              ${params.origin}, ${params.referenceId ?? null}, ${params.description}, NOW()
            )
          `;

          return {
            id: txId,
            visitorId: String(prof.id),
            type: 'DEBIT',
            amount: params.amount,
            balanceAfter: newBalance,
            origin: params.origin,
            referenceId: params.referenceId,
            description: params.description,
            createdAt: nowIso,
          };
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'INSUFFICIENT_POINTS') {
          throw err;
        }
        console.warn('[PointsLedgerService] Falha ao persistir débito no Neon, usando memória:', err);
      }
    }

    // Fallback em memória
    if (mockVisitorProfile.currentPoints < params.amount) {
      throw new Error('INSUFFICIENT_POINTS');
    }

    const newBalance = mockVisitorProfile.currentPoints - params.amount;
    mockVisitorProfile.currentPoints = newBalance;

    const tx: PointTransaction = {
      id: txId,
      visitorId: params.visitorId,
      type: 'DEBIT',
      amount: params.amount,
      balanceAfter: newBalance,
      origin: params.origin,
      referenceId: params.referenceId,
      description: params.description,
      createdAt: nowIso,
    };

    mockPointTransactions.unshift(tx);
    return tx;
  }

  static async getStatement(
    userIdOrVisitorId?: string,
    typeFilter?: 'CREDIT' | 'DEBIT'
  ): Promise<{
    currentPoints: number;
    lifetimePoints: number;
    level: PassportLevel;
    transactions: PointTransaction[];
  }> {
    if (isNeonConfigured() && userIdOrVisitorId) {
      try {
        const sql = getNeonSql();
        const profiles = await sql`
          SELECT id, user_id, current_points, lifetime_points, level
          FROM app_visitor_profiles
          WHERE id = ${userIdOrVisitorId} OR user_id = ${userIdOrVisitorId}
          LIMIT 1
        `;

        if (profiles.length > 0) {
          const prof = profiles[0];
          const rawTxs = await sql`
            SELECT id, visitor_id, type, amount, balance_after, origin, reference_id, description, created_at
            FROM app_point_transactions
            WHERE visitor_id = ${prof.id}
            ORDER BY created_at DESC
          `;

          let transactions: PointTransaction[] = rawTxs.map((t) => ({
            id: String(t.id),
            visitorId: String(t.visitor_id),
            type: (t.type as 'CREDIT' | 'DEBIT') || 'CREDIT',
            amount: Number(t.amount),
            balanceAfter: Number(t.balance_after),
            origin: (t.origin as PointTransactionOrigin) || 'PROMO_BONUS',
            referenceId: t.reference_id ? String(t.reference_id) : undefined,
            description: String(t.description),
            createdAt: new Date(String(t.created_at)).toISOString(),
          }));

          if (typeFilter) {
            transactions = transactions.filter((t) => t.type === typeFilter);
          }

          return {
            currentPoints: Number(prof.current_points ?? 0),
            lifetimePoints: Number(prof.lifetime_points ?? 0),
            level: (prof.level as PassportLevel) || 'BRONZE',
            transactions,
          };
        }
      } catch (err) {
        console.warn('[PointsLedgerService] Erro ao buscar extrato no Neon, usando memória:', err);
      }
    }

    const transactions = typeFilter
      ? mockPointTransactions.filter((t) => t.type === typeFilter)
      : mockPointTransactions;

    return {
      currentPoints: mockVisitorProfile.currentPoints,
      lifetimePoints: mockVisitorProfile.lifetimePoints,
      level: mockVisitorProfile.level,
      transactions,
    };
  }
}
