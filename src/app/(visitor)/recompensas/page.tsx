'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RewardsCatalogService } from '@/modules/rewards';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function RewardsCatalogPage() {
  const initial = RewardsCatalogService.listCatalog();
  const [rewards, setRewards] = useState(initial.rewards);
  const [visitorPoints, setVisitorPoints] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserPoints() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (json.success && json.data?.profile) {
          setVisitorPoints(json.data.profile.currentPoints);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    }
    loadUserPoints();
  }, []);

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
        `Voucher ${json.data.voucher.code} gerado! Acesse a aba Vouchers para apresentar na loja.`
      );
    } else {
      setRedeemFeedback(json.error?.message ?? 'Não foi possível resgatar.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-goldDark to-brand-goldLight p-5 text-white shadow-md">
        <div>
          <span className="text-xs uppercase tracking-wider text-white/80">
            {isLoggedIn ? 'Seu Saldo Disponível' : 'Saldo do Membro'}
          </span>
          <p className="font-serif text-2xl font-bold">{visitorPoints} pontos</p>
        </div>
        <div className="flex gap-2">
          {!isLoggedIn ? (
            <Link
              href="/login?redirectTo=/recompensas"
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-brand-goldDark"
            >
              Entrar para Resgatar
            </Link>
          ) : (
            <Link
              href="/vouchers"
              className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-brand-goldDark"
            >
              Meus Vouchers →
            </Link>
          )}
        </div>
      </div>

      {redeemFeedback && (
        <div className="rounded-2xl border border-brand-emerald/40 bg-brand-emerald/10 p-4 text-xs font-semibold text-brand-emerald">
          {redeemFeedback}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {rewards.map((reward) => (
          <EditorialCard key={reward.id} className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-goldDark">
                  {reward.storeName}
                </span>
                <span className="rounded-full bg-brand-goldDark px-3 py-1 text-xs font-bold text-white">
                  {reward.pointsCost} pts
                </span>
              </div>
              <h3 className="mt-2 font-serif text-lg font-bold text-brand-ink">
                {reward.title}
              </h3>
              <p className="mt-1 text-xs text-brand-muted">{reward.description}</p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-3">
              <span className="text-xs text-brand-muted">
                Disponíveis: <strong>{reward.availableStock}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleRedeem(reward.id)}
                disabled={
                  reward.availableStock <= 0 || (isLoggedIn && visitorPoints < reward.pointsCost)
                }
                className="rounded-xl bg-brand-emerald px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Resgatar
              </button>
            </div>
          </EditorialCard>
        ))}
      </div>
    </div>
  );
}
