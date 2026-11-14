// ==============================================================================
// MÓDULO 08 (FASE 4) — PORTAL DO LOJISTA E OPERAÇÃO DE BALCÃO (DEV 03)
// ==============================================================================

import {
  mockCampaigns,
  mockCheckIns,
  mockOperators,
  mockRewards,
  mockStores,
  mockVisitorProfile,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { voucherSseBroker } from '@/infrastructure/realtime/sse-broker';
import { Reward, Voucher } from '@/shared/types/domain';

function generatePromoCode(title: string): string {
  const prefix = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, 'X');
  const suffix = Math.floor(100 + Math.random() * 900);
  return `PROMO-${prefix}${suffix}`;
}

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
    const code = rawCode
      .replace('PASSE-DOURADO:PROMO:', '')
      .replace('PASSE-DOURADO:VOUCHER:', '')
      .replace('PASSAPORTE-CD:VOUCHER:', '')
      .trim()
      .toUpperCase();

    let voucher = mockVouchers.find((v) => v.code.toUpperCase() === code);

    // Se o código lido for o QR Code de uma promoção criada pelo lojista
    if (!voucher) {
      const promoReward = mockRewards.find(
        (r) => r.promoCode?.toUpperCase() === code && r.isActive
      );

      if (promoReward) {
        if (promoReward.availableStock <= 0) {
          return {
            ok: false as const,
            httpStatus: 422,
            code: 'PROMO_OUT_OF_STOCK',
            message: `O estoque da promoção "${promoReward.title}" está esgotado.`,
          };
        }

        const issuedAt = new Date();
        const expiresAt = new Date(
          issuedAt.getTime() + promoReward.voucherValidityHours * 60 * 60 * 1000
        );

        voucher = {
          id: `vch_promo_${Date.now()}`,
          code: promoReward.promoCode ?? code,
          qrPayload:
            promoReward.qrPayload ?? `PASSE-DOURADO:PROMO:${promoReward.promoCode ?? code}`,
          visitorId: mockVisitorProfile.id,
          visitorName: mockVisitorProfile.visitorName,
          rewardId: promoReward.id,
          rewardTitle: promoReward.title,
          storeId: promoReward.storeId,
          storeName: promoReward.storeName,
          storeFloor: promoReward.storeFloor,
          pointsSpent: promoReward.pointsCost,
          status: 'ACTIVE',
          issuedAt: issuedAt.toISOString(),
          expiresAt: expiresAt.toISOString(),
        };

        mockVouchers.unshift(voucher);
      }
    }

    if (!voucher) {
      return {
        ok: false as const,
        httpStatus: 404,
        code: 'VOUCHER_NOT_FOUND',
        message: `Nenhum voucher ou promoção encontrado para o código ${code}.`,
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

    // Se for baixa de promoção direta, atualiza o estoque da oferta
    if (voucher.code.startsWith('PROMO-')) {
      const reward = mockRewards.find((r) => r.id === voucher.rewardId);
      if (reward && reward.availableStock > 0) {
        reward.availableStock -= 1;
      }
    }

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

    const promoCode = generatePromoCode(input.title);
    const qrPayload = `PASSE-DOURADO:PROMO:${promoCode}`;

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
      promoCode,
      qrPayload,
      approvalStatus: 'PENDING', // RN-09: Entra pendente até aprovação pelo Admin
      isActive: true,
    };

    mockRewards.unshift(newReward);

    // Registra também na fila de campanhas para visibilidade administrativa
    mockCampaigns.unshift({
      id: `cmp_${Date.now()}`,
      storeId: store.id,
      storeName: store.name,
      title: newReward.title,
      slug: `promo-${promoCode.toLowerCase()}`,
      description: `${newReward.description} • Código QR: ${promoCode} • Estoque: ${newReward.initialStock} un.`,
      bonusMultiplier: 1.5,
      status: 'PENDING_APPROVAL',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

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
