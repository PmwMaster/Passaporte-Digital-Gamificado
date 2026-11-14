// ==============================================================================
// MÓDULO 07 — CATÁLOGO DE RECOMPENSAS E VOUCHERS
// ==============================================================================

import {
  mockRewards,
  mockUsers,
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
      rewards: mockRewards.filter(
        (r) => r.isActive && r.approvalStatus === 'APPROVED'
      ),
      visitorPoints: mockVisitorProfile.currentPoints,
    };
  }

  static listVisitorVouchers(statusFilter?: 'ACTIVE' | 'USED' | 'EXPIRED', visitorId?: string): Voucher[] {
    const now = Date.now();
    for (const v of mockVouchers) {
      if (v.status === 'ACTIVE' && new Date(v.expiresAt).getTime() < now) {
        v.status = 'EXPIRED';
      }
    }

    let list = mockVouchers;
    if (visitorId) {
      list = list.filter((v) => v.visitorId === visitorId);
    }
    if (statusFilter) {
      list = list.filter((v) => v.status === statusFilter);
    }
    return list;
  }

  static redeemReward(rewardId: string, visitorId = mockVisitorProfile.id) {
    const reward = mockRewards.find((r) => r.id === rewardId && r.isActive);
    if (!reward || reward.approvalStatus !== 'APPROVED') {
      return {
        ok: false as const,
        httpStatus: 404,
        code: 'REWARD_NOT_FOUND',
        message: 'Recompensa não encontrada ou aguardando aprovação.',
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

    // Verifica limite de resgates por visitante (RN-07: maxPerVisitor)
    const visitorRedemptionsCount = mockVouchers.filter(
      (v) =>
        v.visitorId === visitorId &&
        v.rewardId === reward.id &&
        v.status !== 'CANCELLED'
    ).length;

    if (visitorRedemptionsCount >= reward.maxPerVisitor) {
      return {
        ok: false as const,
        httpStatus: 409,
        code: 'MAX_REDEMPTION_LIMIT_REACHED',
        message: `Você já atingiu o limite máximo de ${reward.maxPerVisitor} resgate(s) para esta recompensa.`,
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

    const user = mockUsers.find((u) => u.id === visitorId);
    const visitorName = user?.name ?? mockVisitorProfile.visitorName;

    const voucher: Voucher = {
      id: `vch_${Date.now()}`,
      code,
      qrPayload: `PASSAPORTE-CD:VOUCHER:${code}`,
      visitorId,
      visitorName,
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
      visitorId,
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
