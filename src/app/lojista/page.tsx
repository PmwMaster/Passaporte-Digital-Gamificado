'use client';

import React, { useState } from 'react';
import { MerchantPortalService } from '@/modules/merchant';
import { Reward, Voucher } from '@/shared/types/domain';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function MerchantPortalPage() {
  const initialDashboard = MerchantPortalService.getStoreDashboard();
  const [rewards, setRewards] = useState<Reward[]>(initialDashboard.rewards);
  const [recentVouchers, setRecentVouchers] = useState<Voucher[]>(
    initialDashboard.recentVouchers
  );
  const [voucherCode, setVoucherCode] = useState('');
  const [validatedVoucher, setValidatedVoucher] = useState<Voucher | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPointsCost, setNewPointsCost] = useState(150);
  const [newInitialStock, setNewInitialStock] = useState(30);
  const [offerFeedback, setOfferFeedback] = useState<string | null>(null);

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/merchant/vouchers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: voucherCode }),
    });
    const json = await res.json();
    if (json.success) {
      setIsError(false);
      setValidatedVoucher(json.data.voucher);
      setStatusMsg(
        `Voucher ${json.data.voucher.code} válido (${json.data.voucher.visitorName}).`
      );
    } else {
      setIsError(true);
      setValidatedVoucher(null);
      setStatusMsg(json.error?.message ?? 'Voucher inválido.');
    }
  }

  async function handleConfirmRedemption() {
    const res = await fetch('/api/merchant/vouchers/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: voucherCode }),
    });
    const json = await res.json();
    if (json.success) {
      setIsError(false);
      const updatedVoucher: Voucher = json.data.voucher;
      setValidatedVoucher(updatedVoucher);
      setRecentVouchers((prev) =>
        prev.map((v) => (v.code === updatedVoucher.code ? updatedVoucher : v))
      );
      setStatusMsg(`Baixa confirmada para ${updatedVoucher.code}!`);
    } else {
      setIsError(true);
      setStatusMsg(json.error?.message ?? 'Erro ao dar baixa.');
    }
  }

  async function handleCreateOffer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/merchant/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeId: initialDashboard.store.id,
        title: newTitle,
        description: newDesc,
        rules: 'Apresente o voucher ativo no balcão.',
        pointsCost: Number(newPointsCost),
        initialStock: Number(newInitialStock),
        maxPerVisitor: 2,
        voucherValidityHours: 2,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setRewards((prev) => [json.data.reward, ...prev]);
      setNewTitle('');
      setNewDesc('');
      setOfferFeedback(`Oferta "${json.data.reward.title}" enviada para aprovação.`);
    } else {
      setOfferFeedback(json.error?.message ?? 'Erro ao criar oferta.');
    }
  }

  async function handleAdjustStock(rewardId: string, deltaStock: number) {
    const res = await fetch('/api/merchant/rewards', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rewardId, deltaStock }),
    });
    const json = await res.json();
    if (json.success) {
      setRewards((prev) =>
        prev.map((r) => (r.id === rewardId ? json.data.reward : r))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl font-bold text-brand-ink">
            {initialDashboard.store.name}
          </h1>
          <p className="text-xs text-brand-muted">
            {initialDashboard.store.floor} • Operador: {initialDashboard.operator.operatorName}
          </p>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid gap-4 sm:grid-cols-3">
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Check-ins</span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-ink">
            {initialDashboard.metrics.totalCheckIns}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Vouchers Ativos</span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-goldDark">
            {recentVouchers.filter((v) => v.status === 'ACTIVE').length}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Estoque Total</span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-emerald">
            {rewards.reduce((acc, r) => acc + r.availableStock, 0)} un.
          </p>
        </EditorialCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Validador de Vouchers */}
        <EditorialCard>
          <h2 className="font-serif text-xl font-bold text-brand-ink">
            Validar Voucher
          </h2>

          <form onSubmit={handleValidate} className="mt-4 space-y-3">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="Código (Ex.: VCH-CD-4821)"
              className="w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 font-mono text-sm font-bold uppercase"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-xl bg-brand-goldDark px-4 py-2.5 text-xs font-semibold text-white"
              >
                Consultar
              </button>
              <button
                type="button"
                onClick={handleConfirmRedemption}
                className="rounded-xl bg-brand-emerald px-4 py-2.5 text-xs font-semibold text-white"
              >
                Confirmar Baixa
              </button>
            </div>
          </form>

          {statusMsg && (
            <div
              className={`mt-4 rounded-xl p-3.5 text-xs font-semibold ${
                isError
                  ? 'border border-red-300 bg-red-50 text-red-800'
                  : 'border border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald'
              }`}
            >
              {statusMsg}
            </div>
          )}

          {validatedVoucher && (
            <div className="mt-3 rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-xs">
              <p className="font-serif text-sm font-bold text-brand-ink">
                {validatedVoucher.rewardTitle}
              </p>
              <p className="mt-0.5 text-brand-muted">
                Cliente: <strong>{validatedVoucher.visitorName}</strong> ({validatedVoucher.status})
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2">
            {recentVouchers.map((vch) => (
              <div
                key={vch.id}
                className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
              >
                <div>
                  <code className="font-bold text-brand-goldDark">{vch.code}</code>
                  <span className="ml-2 text-brand-ink">{vch.rewardTitle}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    vch.status === 'ACTIVE'
                      ? 'bg-brand-emerald/15 text-brand-emerald'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {vch.status}
                </span>
              </div>
            ))}
          </div>
        </EditorialCard>

        {/* Cadastro de Ofertas e Estoque */}
        <EditorialCard>
          <h2 className="font-serif text-xl font-bold text-brand-ink">
            Ofertas & Estoque
          </h2>

          <form onSubmit={handleCreateOffer} className="mt-4 space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título da recompensa"
              className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
              required
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descrição curta"
              className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-brand-muted">
                  Pontos
                </label>
                <input
                  type="number"
                  min={10}
                  value={newPointsCost}
                  onChange={(e) => setNewPointsCost(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-brand-muted">
                  Estoque
                </label>
                <input
                  type="number"
                  min={1}
                  value={newInitialStock}
                  onChange={(e) => setNewInitialStock(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                  required
                />
              </div>
            </div>

            {offerFeedback && (
              <div className="rounded-xl bg-brand-emerald/10 p-3 text-xs font-semibold text-brand-emerald">
                {offerFeedback}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-goldDark py-2.5 text-xs font-semibold text-white"
            >
              Adicionar Oferta
            </button>
          </form>

          <div className="mt-5 space-y-2.5">
            {rewards.map((rew) => (
              <div
                key={rew.id}
                className="rounded-xl border border-brand-border bg-brand-ivory p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif text-sm font-bold text-brand-ink">
                    {rew.title}
                  </h4>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      rew.approvalStatus === 'APPROVED'
                        ? 'bg-brand-emerald/15 text-brand-emerald'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rew.approvalStatus}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-brand-muted">
                    {rew.pointsCost} pts • Estoque: <strong>{rew.availableStock}</strong>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(rew.id, 5)}
                      className="rounded bg-brand-emerald px-2 py-1 text-[10px] font-bold text-white"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(rew.id, -1)}
                      className="rounded border border-brand-border bg-white px-2 py-1 text-[10px] font-semibold text-brand-ink"
                    >
                      -1
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
