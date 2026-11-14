'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RewardsCatalogService } from '@/modules/rewards';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function RewardsCatalogPage() {
  const initial = RewardsCatalogService.listCatalog();
  const [rewards, setRewards] = useState(initial.rewards);
  const [visitorPoints, setVisitorPoints] = useState(initial.visitorPoints);
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);

  async function handleRedeem(rewardId: string) {
    const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: `idem_${Date.now()}` }),
    });
    const json = await res.json();
    if (json.success) {
      setVisitorPoints(json.data.remainingPoints);
      setRewards((prev) =>
        prev.map((r) =>
          r.id === rewardId ? { ...r, availableStock: r.availableStock - 1 } : r
        )
      );
      setRedeemFeedback(
        `Voucher ${json.data.voucher.code} gerado com sucesso! Acesse "Meus Vouchers" para apresentar o QR Code no balcão.`
      );
    } else {
      setRedeemFeedback(json.error?.message ?? 'Não foi possível resgatar.');
    }
  }

  return (
    <div>
      <VisitorNavigation currentPath="/recompensas" />

      <ModuleHeader
        featureNumber="FUNCIONALIDADE 07"
        title="Catálogo de Recompensas & Emissão de Vouchers"
        subtitle="Troque seus pontos por benefícios exclusivos com controle transacional de estoque e geração de QR Code único."
        developerOwner="DESENVOLVEDOR 03"
        moduleName="rewards"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-goldDark to-brand-goldLight p-5 text-white shadow-md">
        <div>
          <span className="text-xs uppercase tracking-wider text-white/80">
            Seu Saldo Atual para Resgate
          </span>
          <p className="font-serif text-3xl font-bold">{visitorPoints} pontos</p>
        </div>
        <Link
          href="/vouchers"
          className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-brand-goldDark"
        >
          Abrir Carteira de Vouchers →
        </Link>
      </div>

      {redeemFeedback && (
        <div className="mb-6 rounded-2xl border border-brand-emerald/40 bg-brand-emerald/10 p-4 text-xs font-semibold text-brand-emerald">
          {redeemFeedback}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {rewards.map((reward) => (
          <EditorialCard key={reward.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-goldDark">
                  {reward.storeName} • {reward.storeFloor}
                </span>
                <span className="rounded-full bg-brand-goldDark px-3 py-1 text-xs font-bold text-white">
                  {reward.pointsCost} pts
                </span>
              </div>
              <h3 className="mt-3 font-serif text-xl font-bold text-brand-ink">
                {reward.title}
              </h3>
              <p className="mt-1.5 text-sm text-brand-muted">{reward.description}</p>
              <p className="mt-3 rounded-lg bg-brand-ivory p-2.5 text-xs text-brand-muted">
                <strong>Regras:</strong> {reward.rules}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-4">
              <span className="text-xs text-brand-muted">
                Estoque: <strong>{reward.availableStock}</strong> un. • Validade:{' '}
                <strong>{reward.voucherValidityHours}h</strong>
              </span>
              <button
                type="button"
                onClick={() => handleRedeem(reward.id)}
                disabled={
                  reward.availableStock <= 0 || visitorPoints < reward.pointsCost
                }
                className="rounded-xl bg-brand-emerald px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Resgatar Agora
              </button>
            </div>
          </EditorialCard>
        ))}
      </div>
    </div>
  );
}
