// ==============================================================================
// MÓDULO 01 — VITRINE PÚBLICA E LOJAS PARCEIRAS (RESPONSÁVEL: DEV 01)
// ==============================================================================

import {
  mockCampaigns,
  mockRewards,
  mockStores,
} from '@/infrastructure/database/mock-data';
import { Campaign, Reward, Store } from '@/shared/types/domain';

export interface StorefrontFilters {
  query?: string;
  category?: string;
  featuredOnly?: boolean;
}

export class StorefrontService {
  static listPublicStores(filters: StorefrontFilters = {}): Store[] {
    return mockStores.filter((store) => {
      if (!store.isActive) return false;

      if (
        filters.category &&
        filters.category !== 'TODOS' &&
        store.category !== filters.category
      ) {
        return false;
      }

      if (filters.featuredOnly && !store.isFeatured) {
        return false;
      }

      if (filters.query) {
        const q = filters.query.toLowerCase();
        const matchesName = store.name.toLowerCase().includes(q);
        const matchesDesc = store.description.toLowerCase().includes(q);
        const matchesFloor = store.floor.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesFloor;
      }

      return true;
    });
  }

  static getStoreBySlug(slug: string): {
    store: Store;
    rewards: Reward[];
    campaigns: Campaign[];
  } | null {
    const store = mockStores.find((s) => s.slug === slug && s.isActive);
    if (!store) return null;

    const rewards = mockRewards.filter(
      (r) => r.storeId === store.id && r.isActive && r.approvalStatus === 'APPROVED'
    );
    const campaigns = mockCampaigns.filter(
      (c) => (c.storeId === store.id || !c.storeId) && c.status === 'APPROVED'
    );

    return { store, rewards, campaigns };
  }

  static getPublicHighlights() {
    return {
      featuredStores: this.listPublicStores({ featuredOnly: true }),
      activeCampaigns: mockCampaigns.filter((c) => c.status === 'APPROVED'),
      featuredRewards: mockRewards.filter(
        (r) => r.isActive && r.approvalStatus === 'APPROVED'
      ),
    };
  }
}
