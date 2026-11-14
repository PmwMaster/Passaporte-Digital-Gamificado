// ==============================================================================
// MÓDULO 07 — CATÁLOGO DE RECOMPENSAS E VOUCHERS (RESPONSÁVEL: DEV 03)
// ==============================================================================

import {
  mockRewards,
  mockVisitorProfile,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { PointsLedgerService } from '@/modules/points';
import { Reward, Voucher } from '@/shared/types/domain';

export class RewardsCatalogService {
  static listCatalog(): {
    rewards: Reward[];
    visitorPoints: number;
  } {
    return {
      rewards: mockRewards.filter((r) => r.isActive && r.approvalStatus === 'APPROVED'),
      visitorPoints: mockVisitorProfile.currentPoints,
    };
  }

  static listVisitorVouchers(statusFilter?: 'ACTIVE' | 'USED' | 'EXPIRED'): Voucher[] {
    if (!statusFilter) return mockVouchers;
    return mockVouchers.filter((v) => v.status === statusFilter);
  }

  static redeemReward(rewardId: string) {
    const reward = mockRewards.find((r) => r.id === rewardId && r.isActive);
    if (!reward || reward.approvalStatus !== 'APPROVED') {
      return {
        ok: false as const,
        httpStatus: 404,
        code: 'REWARD_NOT_FOUND',
        message: 'Recompensa não encontrada ou indisponível.',
      };
    }

    if (reward.availableStock <= 0) {
      return {
        ok: false as const,
        httpStatus: 409,
        code: 'OUT_OF_STOCK',
        message: 'Estoque esgotado para esta recompensa.',
      };
    }

    if (mockVisitorProfile.currentPoints < reward.pointsCost) {
      return {
        ok: false as const,
        httpStatus: 400,
        code: 'INSUFFICIENT_POINTS',
        message: `Saldo insuficiente. Você possui ${mockVisitorProfile.currentPoints} pts e esta recompensa requer ${reward.pointsCost} pts.`,
      };
    }

    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `VCH-CD-${codeSuffix}`;
    const issuedAt = new Date();
    const expiresAt = new Date(
      issuedAt.getTime() + reward.voucherValidityHours * 60 * 60 * 1000
    );

    // Operação atômica: decrementa estoque, debita no ledger e emite voucher
    reward.availableStock -= 1;

    const voucher: Voucher = {
      id: `vch_${Date.now()}`,
      code,
      qrPayload: `PASSAPORTE-CD:VOUCHER:${code}`,
      visitorId: mockVisitorProfile.id,
      visitorName: mockVisitorProfile.visitorName,
      rewardId: reward.id,
      rewardTitle: reward.title,
      storeId: reward.storeId,
      storeName: reward.storeName,
      storeFloor: reward.storeFloor,
      pointsSpent: reward.pointsCost,
      status: 'ACTIVE',
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const ledgerTx = PointsLedgerService.recordDebit({
      visitorId: mockVisitorProfile.id,
      amount: reward.pointsCost,
      origin: 'REWARD_REDEMPTION',
      referenceId: voucher.id,
      description: `Resgate de recompensa: ${reward.title} (${code})`,
    });

    mockVouchers.unshift(voucher);

    return {
      ok: true as const,
      httpStatus: 201,
      data: {
        voucher,
        remainingPoints: ledgerTx.balanceAfter,
      },
    };
  }
}
