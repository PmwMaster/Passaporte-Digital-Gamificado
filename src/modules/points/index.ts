// ==============================================================================
// MÓDULO 06 — SISTEMA DE PONTOS E EXTRATO AUDITÁVEL (RESPONSÁVEL: DEV 02)
// ==============================================================================
// Regra Crítica: Proibido alterar saldo diretamente sem registrar PointTransaction.

import {
  mockPointTransactions,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { GamificationService } from '@/modules/gamification';
import {
  PointTransaction,
  PointTransactionOrigin,
} from '@/shared/types/domain';

export class PointsLedgerService {
  static recordCredit(params: {
    visitorId: string;
    amount: number;
    origin: PointTransactionOrigin;
    referenceId?: string;
    description: string;
  }): PointTransaction {
    if (params.amount <= 0) {
      throw new Error('INVALID_POINT_AMOUNT');
    }

    const newBalance = mockVisitorProfile.currentPoints + params.amount;
    mockVisitorProfile.currentPoints = newBalance;
    mockVisitorProfile.lifetimePoints += params.amount;
    mockVisitorProfile.level = GamificationService.calculateLevelByLifetimePoints(
      mockVisitorProfile.lifetimePoints
    );

    const tx: PointTransaction = {
      id: `ptx_${Date.now()}`,
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
    return tx;
  }

  static recordDebit(params: {
    visitorId: string;
    amount: number;
    origin: PointTransactionOrigin;
    referenceId?: string;
    description: string;
  }): PointTransaction {
    if (params.amount <= 0) {
      throw new Error('INVALID_POINT_AMOUNT');
    }

    if (mockVisitorProfile.currentPoints < params.amount) {
      throw new Error('INSUFFICIENT_POINTS');
    }

    const newBalance = mockVisitorProfile.currentPoints - params.amount;
    mockVisitorProfile.currentPoints = newBalance;

    const tx: PointTransaction = {
      id: `ptx_${Date.now()}`,
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
    return tx;
  }

  static getStatement(typeFilter?: 'CREDIT' | 'DEBIT') {
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
