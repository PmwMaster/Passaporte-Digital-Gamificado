// ==============================================================================
// MÓDULO 09 (FASE 2 & FASE 4) — PAINEL ADMINISTRATIVO E GOVERNANÇA (DEV 03)
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
import { Store, StoreCategory } from '@/shared/types/domain';

interface RuntimeGeofenceConfig {
  name: string;
  city: string;
  timezone: string;
  defaultCoordinates: {
    latitude: number;
    longitude: number;
  };
  defaultGeofenceRadiusMeters: number;
  updatedAt: string;
}

const runtimeGeofence: RuntimeGeofenceConfig = {
  name: SHOPPING_CONFIG.name,
  city: SHOPPING_CONFIG.city,
  timezone: SHOPPING_CONFIG.timezone,
  defaultCoordinates: {
    latitude: SHOPPING_CONFIG.defaultCoordinates.latitude,
    longitude: SHOPPING_CONFIG.defaultCoordinates.longitude,
  },
  defaultGeofenceRadiusMeters: SHOPPING_CONFIG.defaultGeofenceRadiusMeters,
  updatedAt: new Date().toISOString(),
};

function slugifyStoreName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class AdministrationService {
  static getGeofenceConfig(): RuntimeGeofenceConfig {
    return runtimeGeofence;
  }

  static updateGeofenceConfig(input: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  }): RuntimeGeofenceConfig {
    runtimeGeofence.defaultCoordinates.latitude = input.latitude;
    runtimeGeofence.defaultCoordinates.longitude = input.longitude;
    runtimeGeofence.defaultGeofenceRadiusMeters = input.radiusMeters;
    runtimeGeofence.updatedAt = new Date().toISOString();
    return runtimeGeofence;
  }

  static createPartnerStore(input: {
    name: string;
    category: StoreCategory;
    floor: string;
    unitNumber: string;
    description: string;
    checkInPoints: number;
    isFeatured?: boolean;
  }): Store {
    const baseSlug = slugifyStoreName(input.name);
    const exists = mockStores.some((s) => s.slug === baseSlug);
    const slug = exists ? `${baseSlug}-${mockStores.length + 1}` : baseSlug;
    const tokenNumber = String(mockStores.length + 1).padStart(2, '0');

    const newStore: Store = {
      id: `store_${Date.now()}`,
      slug,
      name: input.name.trim(),
      category: input.category,
      floor: input.floor.trim(),
      unitNumber: input.unitNumber.trim(),
      description: input.description.trim(),
      qrCodeToken: `QR-CD-STORE-${tokenNumber}-VERIFIED`,
      checkInPoints: input.checkInPoints,
      latitude: runtimeGeofence.defaultCoordinates.latitude,
      longitude: runtimeGeofence.defaultCoordinates.longitude,
      isFeatured: input.isFeatured ?? true,
      isActive: true,
    };

    mockStores.unshift(newStore);
    return newStore;
  }

  static moderateItem(input: {
    targetType: 'CAMPAIGN' | 'REWARD';
    targetId: string;
    decision: 'APPROVED' | 'REJECTED';
  }) {
    if (input.targetType === 'CAMPAIGN') {
      const camp = mockCampaigns.find((c) => c.id === input.targetId);
      if (!camp) {
        return { ok: false as const, message: 'Campanha não encontrada.' };
      }
      camp.status = input.decision;
      return { ok: true as const, item: camp };
    }

    const reward = mockRewards.find((r) => r.id === input.targetId);
    if (!reward) {
      return { ok: false as const, message: 'Recompensa não encontrada.' };
    }
    reward.approvalStatus = input.decision;
    return { ok: true as const, item: reward };
  }

  static getExecutiveDashboard() {
    const totalPointsIssued = mockPointTransactions
      .filter((t) => t.type === 'CREDIT')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalPointsRedeemed = mockPointTransactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((acc, t) => acc + t.amount, 0);

    const pendingCampaigns = mockCampaigns.filter(
      (c) => c.status === 'PENDING_APPROVAL'
    ).length;
    const pendingRewards = mockRewards.filter(
      (r) => r.approvalStatus === 'PENDING'
    ).length;

    return {
      shoppingConfig: runtimeGeofence,
      kpis: {
        activeVisitors: mockUsers.filter((u) => u.role === 'VISITOR').length + 1240,
        partnerStores: mockStores.length,
        totalCheckInsVerified: mockCheckIns.length + 3480,
        totalPointsIssued: totalPointsIssued + 148500,
        totalPointsRedeemed: totalPointsRedeemed + 64200,
        activeVouchersCount: mockVouchers.filter((v) => v.status === 'ACTIVE')
          .length,
        pendingCampaignApprovals: pendingCampaigns + pendingRewards,
      },
      stores: mockStores,
      campaigns: mockCampaigns,
      rewards: mockRewards,
      recentAuditTransactions: mockPointTransactions.slice(0, 10),
    };
  }

  static exportAuditData() {
    const csvHeader =
      'id,visitorId,type,amount,balanceAfter,origin,referenceId,description,createdAt\n';
    const csvRows = mockPointTransactions
      .map(
        (tx) =>
          `"${tx.id}","${tx.visitorId}","${tx.type}",${tx.amount},${tx.balanceAfter},"${tx.origin}","${tx.referenceId ?? ''}","${tx.description.replace(/"/g, '""')}","${tx.createdAt}"`
      )
      .join('\n');

    return {
      exportedAt: new Date().toISOString(),
      geofence: runtimeGeofence,
      summary: {
        storesCount: mockStores.length,
        transactionsCount: mockPointTransactions.length,
        checkInsCount: mockCheckIns.length,
        vouchersCount: mockVouchers.length,
      },
      csvContent: `${csvHeader}${csvRows}`,
      transactions: mockPointTransactions,
      vouchers: mockVouchers,
      checkIns: mockCheckIns,
    };
  }
}
