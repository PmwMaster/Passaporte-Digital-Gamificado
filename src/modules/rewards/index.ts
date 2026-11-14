// ==============================================================================
// MÓDULO 07 — CATÁLOGO DE RECOMPENSAS E VOUCHERS (NEON + MEMÓRIA)
// ==============================================================================

import {
  mockRewards,
  mockUsers,
  mockVisitorProfile,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { getNeonSql, isNeonConfigured } from '@/infrastructure/database/neon';
import { PointsLedgerService } from '@/modules/points';
import { Reward, Voucher, VoucherStatus } from '@/shared/types/domain';

export class RewardsCatalogService {
  static getRewardsCatalog(): Reward[] {
    return mockRewards.filter(
      (r) => r.isActive && r.approvalStatus === 'APPROVED'
    );
  }

  static async listCatalog(visitorId?: string): Promise<{
    rewards: Reward[];
    visitorPoints: number;
  }> {
    let visitorPoints = mockVisitorProfile.currentPoints;

    if (isNeonConfigured() && visitorId) {
      try {
        const sql = getNeonSql();
        const profiles = await sql`
          SELECT current_points
          FROM app_visitor_profiles
          WHERE id = ${visitorId} OR user_id = ${visitorId}
          LIMIT 1
        `;
        if (profiles.length > 0) {
          visitorPoints = Number(profiles[0].current_points);
        }
      } catch {
        // Fallback
      }
    }

    return {
      rewards: mockRewards.filter(
        (r) => r.isActive && r.approvalStatus === 'APPROVED'
      ),
      visitorPoints,
    };
  }

  static async listVisitorVouchers(
    statusFilter?: 'ACTIVE' | 'USED' | 'EXPIRED',
    visitorId?: string
  ): Promise<Voucher[]> {
    if (isNeonConfigured() && visitorId) {
      try {
        const sql = getNeonSql();
        const profiles = await sql`
          SELECT id FROM app_visitor_profiles
          WHERE id = ${visitorId} OR user_id = ${visitorId}
          LIMIT 1
        `;

        if (profiles.length > 0) {
          const profId = profiles[0].id;
          const rows = await sql`
            SELECT id, code, qr_payload, visitor_id, visitor_name,
                   reward_id, reward_title, store_id, store_name,
                   store_floor, points_spent, status, issued_at,
                   expires_at, used_at
            FROM app_vouchers
            WHERE visitor_id = ${profId}
            ORDER BY issued_at DESC
          `;

          const now = Date.now();
          const list: Voucher[] = rows.map((r) => {
            let status = (r.status as VoucherStatus) || 'ACTIVE';
            if (status === 'ACTIVE' && new Date(String(r.expires_at)).getTime() < now) {
              status = 'EXPIRED';
            }
            return {
              id: String(r.id),
              code: String(r.code),
              qrPayload: String(r.qr_payload),
              visitorId: String(r.visitor_id),
              visitorName: String(r.visitor_name),
              rewardId: String(r.reward_id),
              rewardTitle: String(r.reward_title),
              storeId: String(r.store_id),
              storeName: String(r.store_name),
              storeFloor: String(r.store_floor),
              pointsSpent: Number(r.points_spent),
              status,
              issuedAt: new Date(String(r.issued_at)).toISOString(),
              expiresAt: new Date(String(r.expires_at)).toISOString(),
              usedAt: r.used_at ? new Date(String(r.used_at)).toISOString() : undefined,
            };
          });

          if (statusFilter) {
            return list.filter((v) => v.status === statusFilter);
          }
          return list;
        }
      } catch (err) {
        console.warn('[RewardsCatalogService] Erro ao listar vouchers no Neon, usando memória:', err);
      }
    }

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

  static async redeemReward(rewardId: string, visitorId: string) {
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

    let resolvedProfileId = visitorId;
    let visitorName = 'Visitante Passe Dourado';
    let currentPoints = mockVisitorProfile.currentPoints;

    if (isNeonConfigured()) {
      try {
        const sql = getNeonSql();
        const profiles = await sql`
          SELECT vp.id, vp.user_id, vp.current_points, u.name
          FROM app_visitor_profiles vp
          JOIN app_users u ON u.id = vp.user_id
          WHERE vp.id = ${visitorId} OR vp.user_id = ${visitorId}
          LIMIT 1
        `;

        if (profiles.length > 0) {
          resolvedProfileId = String(profiles[0].id);
          visitorName = String(profiles[0].name);
          currentPoints = Number(profiles[0].current_points);

          // Verifica limite de resgates no Neon
          const existingVouchers = await sql`
            SELECT count(*)::int as total
            FROM app_vouchers
            WHERE visitor_id = ${resolvedProfileId}
              AND reward_id = ${reward.id}
              AND status != 'CANCELLED'
          `;

          const count = existingVouchers[0].total;
          if (count >= reward.maxPerVisitor) {
            return {
              ok: false as const,
              httpStatus: 409,
              code: 'MAX_REDEMPTION_LIMIT_REACHED',
              message: `Você já atingiu o limite máximo de ${reward.maxPerVisitor} resgate(s) para esta recompensa.`,
            };
          }
        }
      } catch (err) {
        console.warn('[RewardsCatalogService] Erro ao consultar perfil no Neon para resgate:', err);
      }
    }

    // Verifica saldo
    if (currentPoints < reward.pointsCost) {
      return {
        ok: false as const,
        httpStatus: 400,
        code: 'INSUFFICIENT_POINTS',
        message: `Saldo insuficiente. Você possui ${currentPoints} pts e esta recompensa requer ${reward.pointsCost} pts.`,
      };
    }

    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `VCH-CD-${codeSuffix}`;
    const voucherId = `vch_${Date.now()}`;
    const issuedAt = new Date();
    const expiresAt = new Date(
      issuedAt.getTime() + reward.voucherValidityHours * 60 * 60 * 1000
    );

    reward.availableStock -= 1;

    const voucher: Voucher = {
      id: voucherId,
      code,
      qrPayload: `PASSAPORTE-CD:VOUCHER:${code}`,
      visitorId: resolvedProfileId,
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

    if (isNeonConfigured()) {
      try {
        const sql = getNeonSql();
        await sql`
          INSERT INTO app_vouchers (
            id, code, qr_payload, visitor_id, visitor_name,
            reward_id, reward_title, store_id, store_name,
            store_floor, points_spent, status, issued_at, expires_at
          ) VALUES (
            ${voucher.id}, ${voucher.code}, ${voucher.qrPayload},
            ${voucher.visitorId}, ${voucher.visitorName},
            ${voucher.rewardId}, ${voucher.rewardTitle},
            ${voucher.storeId}, ${voucher.storeName},
            ${voucher.storeFloor}, ${voucher.pointsSpent},
            'ACTIVE', ${voucher.issuedAt}, ${voucher.expiresAt}
          )
        `;
      } catch (err) {
        console.warn('[RewardsCatalogService] Erro ao persistir voucher no Neon:', err);
      }
    }

    const ledgerTx = await PointsLedgerService.recordDebit({
      visitorId: resolvedProfileId,
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
