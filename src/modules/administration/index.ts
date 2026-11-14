// ==============================================================================
// MÓDULO 09 — PAINEL ADMINISTRATIVO (RESPONSÁVEL: DEV 03)
// ==============================================================================

import {
  mockCampaigns,
  mockCheckIns,
  mockPointTransactions,
  mockRewards,
  mockStores,
  mockUsers,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { SHOPPING_CONFIG } from '@/shared/constants';

export class AdministrationService {
  static getExecutiveDashboard() {
    const totalPointsIssued = mockPointTransactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalPointsRedeemed = mockPointTransactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      shoppingConfig: SHOPPING_CONFIG,
      kpis: {
        activeVisitors: mockUsers.filter((u) => u.role === 'VISITOR').length + 1240,
        partnerStores: mockStores.length,
        totalCheckInsVerified: mockCheckIns.length + 3480,
        totalPointsIssued: totalPointsIssued + 148500,
        totalPointsRedeemed: totalPointsRedeemed + 64200,
        activeVouchersCount: mockVouchers.filter((v) => v.status === 'ACTIVE').length,
        pendingCampaignApprovals: mockCampaigns.filter(
          (c) => c.status === 'PENDING_APPROVAL'
        ).length,
      },
      stores: mockStores,
      campaigns: mockCampaigns,
      rewards: mockRewards,
      recentAuditTransactions: mockPointTransactions.slice(0, 6),
    };
  }
}
