// ==============================================================================
// MÓDULO 08 (FASE 4) — PORTAL DO LOJISTA E OPERAÇÃO DE BALCÃO (DEV 03)
// ==============================================================================

import {
  mockCheckIns,
  mockOperators,
  mockRewards,
  mockStores,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { voucherSseBroker } from '@/infrastructure/realtime/sse-broker';
import { Reward } from '@/shared/types/domain';

export class MerchantPortalService {
  static getStoreDashboard(storeId = 'store_01') {
    const store = mockStores.find((s) => s.id === storeId) ?? mockStores[0];
    const storeRewards = mockRewards.filter((r) => r.storeId === store.id);
    const storeVouchers = mockVouchers.filter((v) => v.storeId === store.id);
    const storeCheckIns = mockCheckIns.filter((c) => c.storeId === store.id);

    return {
      store,
      allStores: mockStores,
      operator: mockOperators[0],
      metrics: {
        totalCheckIns: storeCheckIns.length + 38,
        activeVouchers: storeVouchers.filter((v) => v.status === 'ACTIVE').length,
        usedVouchers: storeVouchers.filter((v) => v.status === 'USED').length + 24,
        availableStockTotal: storeRewards.reduce(
          (acc, r) => acc + r.availableStock,
          0
        ),
      },
      rewards: storeRewards,
      recentVouchers: mockVouchers,
    };
  }

  static validateVoucherByCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    const voucher = mockVouchers.find((v) => v.code.toUpperCase() === code);

    if (!voucher) {
      return {
        ok: false as const,
        httpStatus: 404,
        code: 'VOUCHER_NOT_FOUND',
        message: `Nenhum voucher encontrado para o código ${code}.`,
      };
    }

    if (voucher.status === 'USED') {
      return {
        ok: false as const,
        httpStatus: 422,
        code: 'VOUCHER_ALREADY_USED',
        message: `Este voucher já foi utilizado em ${new Date(
          voucher.usedAt!
        ).toLocaleString('pt-BR')}.`,
        voucher,
      };
    }

    // Verifica expiração por horário (RN-07 / P1-04)
    if (
      voucher.status === 'ACTIVE' &&
      new Date(voucher.expiresAt).getTime() < Date.now()
    ) {
      voucher.status = 'EXPIRED';
    }

    if (voucher.status !== 'ACTIVE') {
      return {
        ok: false as const,
        httpStatus: 422,
        code: 'VOUCHER_EXPIRED',
        message: `Este voucher encontra-se expirado (${voucher.status}).`,
        voucher,
      };
    }

    return {
      ok: true as const,
      httpStatus: 200,
      data: {
        voucher,
        canConfirm: true,
      },
    };
  }

  static confirmVoucherRedemption(rawCode: string) {
    const validation = this.validateVoucherByCode(rawCode);
    if (!validation.ok) {
      return validation;
    }

    const voucher = validation.data.voucher;
    voucher.status = 'USED';
    voucher.usedAt = new Date().toISOString();
    voucher.validatedByOperatorId = mockOperators[0].id;

    // Dispara notificação em tempo real via Server-Sent Events (SSE)
    voucherSseBroker.publish({
      type: 'VOUCHER_USED',
      code: voucher.code,
      status: 'USED',
      usedAt: voucher.usedAt,
      storeName: voucher.storeName,
    });

    return {
      ok: true as const,
      httpStatus: 200,
      data: {
        voucher,
        realtimeBroadcastSent: true,
      },
    };
  }

  static createStoreReward(input: {
    storeId: string;
    title: string;
    description: string;
    rules: string;
    pointsCost: number;
    initialStock: number;
    maxPerVisitor: number;
    voucherValidityHours: number;
  }): Reward {
    const store =
      mockStores.find((s) => s.id === input.storeId) ?? mockStores[0];

    const newReward: Reward = {
      id: `rew_${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      storeFloor: `${store.floor} • ${store.unitNumber}`,
      title: input.title.trim(),
      description: input.description.trim(),
      rules: input.rules.trim(),
      pointsCost: input.pointsCost,
      initialStock: input.initialStock,
      availableStock: input.initialStock,
      maxPerVisitor: input.maxPerVisitor,
      voucherValidityHours: input.voucherValidityHours,
      approvalStatus: 'PENDING', // RN-09: Entra pendente até aprovação pelo Admin
      isActive: true,
    };

    mockRewards.unshift(newReward);
    return newReward;
  }

  static adjustRewardStock(rewardId: string, deltaStock: number): Reward | null {
    const reward = mockRewards.find((r) => r.id === rewardId);
    if (!reward) return null;

    reward.availableStock = Math.max(0, reward.availableStock + deltaStock);
    if (deltaStock > 0) {
      reward.initialStock = Math.max(reward.initialStock, reward.availableStock);
    }
    return reward;
  }
}
