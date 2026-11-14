// ==============================================================================
// MÓDULO 08 — PORTAL DO LOJISTA (RESPONSÁVEL: DEV 03)
// ==============================================================================

import {
  mockCheckIns,
  mockOperators,
  mockRewards,
  mockStores,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { voucherSseBroker } from '@/infrastructure/realtime/sse-broker';

export class MerchantPortalService {
  static getStoreDashboard(storeId = 'store_01') {
    const store = mockStores.find((s) => s.id === storeId) ?? mockStores[0];
    const storeRewards = mockRewards.filter((r) => r.storeId === store.id);
    const storeVouchers = mockVouchers.filter((v) => v.storeId === store.id);
    const storeCheckIns = mockCheckIns.filter((c) => c.storeId === store.id);

    return {
      store,
      operator: mockOperators[0],
      metrics: {
        totalCheckIns: storeCheckIns.length + 38,
        activeVouchers: storeVouchers.filter((v) => v.status === 'ACTIVE').length,
        usedVouchers: storeVouchers.filter((v) => v.status === 'USED').length + 24,
        availableStockTotal: storeRewards.reduce((acc, r) => acc + r.availableStock, 0),
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
        message: `Este voucher já foi utilizado em ${voucher.usedAt}.`,
        voucher,
      };
    }

    if (voucher.status !== 'ACTIVE') {
      return {
        ok: false as const,
        httpStatus: 422,
        code: 'VOUCHER_EXPIRED',
        message: `Este voucher encontra-se com status ${voucher.status}.`,
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
}
