'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  mockRewards,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { Reward, Voucher } from '@/shared/types/domain';

const REWARD_IMAGES: Record<string, string> = {
  rew_01:
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=400&q=80',
  rew_02:
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
  rew_03:
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80',
  rew_04:
    'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=400&q=80',
  rew_05:
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
  rew_06:
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=400&q=80',
};

export default function RewardsCatalogPage() {
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);
  const [visitorPoints, setVisitorPoints] = useState<number>(
    mockVisitorProfile.currentPoints
  );
  const [filterCost, setFilterCost] = useState<'ALL' | 'UP_TO_80' | 'OVER_80'>(
    'ALL'
  );
  const [isRedeemingId, setIsRedeemingId] = useState<string | null>(null);
  const [emittedVoucher, setEmittedVoucher] = useState<Voucher | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [rewRes, ptsRes] = await Promise.all([
          fetch('/api/rewards', { cache: 'no-store' }),
          fetch('/api/visitor/points', { cache: 'no-store' }),
        ]);
        const rewJson = await rewRes.json();
        if (rewJson?.success && Array.isArray(rewJson.data?.rewards)) {
          setRewards(rewJson.data.rewards);
        }
        const ptsJson = await ptsRes.json();
        if (ptsJson?.success && typeof ptsJson.data?.currentPoints === 'number') {
          setVisitorPoints(ptsJson.data.currentPoints);
        }
      } catch {
        // Fallback local
      }
    }
    loadData();
  }, []);

  async function handleRedeem(rewardId: string) {
    setIsRedeemingId(rewardId);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/rewards/${rewardId}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey: `idem_cat_${Date.now()}` }),
      });
      const json = await res.json();
      if (json.success) {
        setVisitorPoints(json.data.remainingPoints);
        setRewards((prev) =>
          prev.map((r) =>
            r.id === rewardId
              ? { ...r, availableStock: Math.max(0, r.availableStock - 1) }
              : r
          )
        );
        window.dispatchEvent(new Event('passport:points-updated'));
        setEmittedVoucher(json.data.voucher);
      } else {
        setErrorMessage(
          json.error?.message ?? 'Não foi possível concluir o resgate.'
        );
      }
    } catch {
      setErrorMessage('Falha de comunicação ao emitir voucher.');
    } finally {
      setIsRedeemingId(null);
    }
  }

  const visibleRewards = rewards.filter((r) => {
    if (filterCost === 'UP_TO_80') return r.pointsCost <= 80;
    if (filterCost === 'OVER_80') return r.pointsCost > 80;
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl pb-12">
      {/* Banner Dourado de Saldo */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#523500] via-[#7A5300] to-[#B6862C] p-6 text-white shadow-lg">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-fixed">
            Catálogo Oficial • Troca de Pontos por Cupons
          </span>
          <h1 className="mt-1 font-headline text-2xl font-black sm:text-3xl">
            Seu Saldo: {visitorPoints} Pontos Dourados
          </h1>
          <p className="mt-0.5 text-xs text-white/80">
            Resgate vantagens exclusivas com emissão imediata de QR Code para o caixa.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/passaporte?tab=wallet"
            className="flex items-center gap-1.5 rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-[#523500] shadow-md transition hover:bg-primary-fixed"
          >
            <span className="material-symbols-outlined text-[18px]">
              confirmation_number
            </span>
            Meus Cupons Ativos
          </Link>
        </div>
      </div>

      {/* Chips de Filtro */}
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'ALL', label: 'Todos os Prêmios' },
              { id: 'UP_TO_80', label: 'Até 80 pts' },
              { id: 'OVER_80', label: 'Acima de 80 pts' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilterCost(chip.id)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filterCost === chip.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-error/30 bg-error-container/50 p-4 text-xs font-bold text-on-error-container">
          {errorMessage}
        </div>
      )}

      {/* Grid de Recompensas */}
      <div className="grid gap-4 md:grid-cols-2">
        {visibleRewards.map((reward) => {
          const canAfford =
            visitorPoints >= reward.pointsCost && reward.availableStock > 0;
          const missingPts = Math.max(0, reward.pointsCost - visitorPoints);
          const imgUrl =
            REWARD_IMAGES[reward.id] ??
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';

          return (
            <article
              key={reward.id}
              className="flex flex-col justify-between overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-4 shadow-card"
            >
              <div className="flex gap-4">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface-container">
                  <img
                    src={imgUrl}
                    alt={reward.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-0.5 text-[11px] font-black text-white shadow">
                    {reward.pointsCost} pts
                  </span>
                </div>

                <div className="flex-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    {reward.storeName} • {reward.storeFloor}
                  </span>
                  <h2 className="mt-1 font-headline text-base font-extrabold text-on-surface leading-snug">
                    {reward.title}
                  </h2>
                  <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">
                    {reward.description}
                  </p>
                  <p className="mt-2 text-[10px] text-outline">
                    Estoque: <strong>{reward.availableStock} un.</strong> •
                    Validade: {reward.voucherValidityHours}h
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-3">
                {canAfford ? (
                  <span className="text-xs font-bold text-secondary">
                    ✓ Disponível para resgate imediato
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-on-surface-variant">
                    Faltam {missingPts} pts para desbloquear
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => handleRedeem(reward.id)}
                  disabled={!canAfford || isRedeemingId === reward.id}
                  className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isRedeemingId === reward.id
                    ? 'Gerando...'
                    : 'Resgatar Cupom'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal de Voucher Emitido */}
      {emittedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-surface-container-lowest p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container text-secondary">
              <span className="material-symbols-outlined text-3xl icon-filled">
                confirmation_number
              </span>
            </div>
            <h3 className="mt-3 font-headline text-xl font-extrabold text-on-surface">
              Voucher Emitido com Sucesso!
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              {emittedVoucher.rewardTitle} ({emittedVoucher.storeName})
            </p>
            <div className="my-4 rounded-2xl border-2 border-dashed border-primary/40 bg-surface-container-low p-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
                Código do Cupom
              </span>
              <p className="mt-1 font-mono text-2xl font-black tracking-widest text-primary">
                {emittedVoucher.code}
              </p>
            </div>
            <div className="flex gap-2.5">
              <Link
                href="/passaporte?tab=wallet"
                className="flex-1 rounded-xl bg-primary py-3 text-xs font-extrabold text-white"
              >
                Abrir QR Code na Carteira
              </Link>
              <button
                type="button"
                onClick={() => setEmittedVoucher(null)}
                className="rounded-xl border border-outline-variant/40 px-4 py-3 text-xs font-bold text-on-surface-variant"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
