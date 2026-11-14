'use client';

import React, { useState } from 'react';
import { MerchantPortalService } from '@/modules/merchant';
import { Reward, Voucher } from '@/shared/types/domain';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function MerchantPortalPage() {
  const initialDashboard = MerchantPortalService.getStoreDashboard();
  const [rewards, setRewards] = useState<Reward[]>(initialDashboard.rewards);
  const [recentVouchers, setRecentVouchers] = useState<Voucher[]>(
    initialDashboard.recentVouchers
  );
  const [voucherCode, setVoucherCode] = useState('VCH-CD-4821');
  const [validatedVoucher, setValidatedVoucher] = useState<Voucher | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Estado para formulário de Nova Oferta/Recompensa (Fase 4 - F08)
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRules, setNewRules] = useState(
    'Apresente o voucher ativo no balcão em até 2h após o resgate.'
  );
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
        `Voucher ${json.data.voucher.code} VÁLIDO! Titular: ${json.data.voucher.visitorName}. Clique em "Confirmar Baixa" para concluir o atendimento.`
      );
    } else {
      setIsError(true);
      setValidatedVoucher(null);
      setStatusMsg(`${json.error?.code}: ${json.error?.message}`);
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
      setStatusMsg(
        `Baixa confirmada para o voucher ${updatedVoucher.code}! Evento Server-Sent Events (SSE) disparado para o celular do visitante.`
      );
    } else {
      setIsError(true);
      setStatusMsg(`${json.error?.code}: ${json.error?.message}`);
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
        rules: newRules,
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
      setOfferFeedback(
        `Oferta "${json.data.reward.title}" cadastrada com status PENDING! Aprove-a no Painel Admin (/admin) para publicá-la no Catálogo.`
      );
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
    <div>
      <ModuleHeader
        featureNumber="FASE 4 • FUNCIONALIDADE 08"
        title="Portal Operacional do Lojista & Balcão (SSE)"
        subtitle={`Operação ativa: ${initialDashboard.store.name} (${initialDashboard.store.floor}) • Operador: ${initialDashboard.operator.operatorName}`}
        developerOwner="DESENVOLVEDOR 03"
        moduleName="merchant"
      />

      {/* Indicadores Operacionais da Loja */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Check-ins na Loja
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-ink">
            {initialDashboard.metrics.totalCheckIns}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Vouchers Aguardando Uso
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-goldDark">
            {recentVouchers.filter((v) => v.status === 'ACTIVE').length}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Vouchers Baixados
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {recentVouchers.filter((v) => v.status === 'USED').length + 24}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Estoque Total de Ofertas
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-ink">
            {rewards.reduce((acc, r) => acc + r.availableStock, 0)} un.
          </p>
        </EditorialCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Validador de Vouchers */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            1. Validação & Baixa de Voucher no Balcão
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Digite o código único do voucher ou escaneie o QR Code do cliente para validar e disparar o evento SSE em tempo real.
          </p>

          <form onSubmit={handleValidate} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Código do Voucher (Ex.: VCH-CD-4821)
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                placeholder="Ex.: VCH-CD-4821"
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 font-mono text-sm font-bold uppercase"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-xl bg-brand-goldDark px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-95"
              >
                1. Consultar Validade (POST /validate)
              </button>
              <button
                type="button"
                onClick={handleConfirmRedemption}
                className="rounded-xl bg-brand-emerald px-5 py-2.5 text-xs font-semibold text-white transition hover:opacity-95"
              >
                2. Confirmar Utilização + Disparar SSE (POST /confirm)
              </button>
            </div>
          </form>

          {statusMsg && (
            <div
              className={`mt-4 rounded-xl p-4 text-xs font-semibold ${
                isError
                  ? 'border border-red-300 bg-red-50 text-red-800'
                  : 'border border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald'
              }`}
            >
              {statusMsg}
            </div>
          )}

          {validatedVoucher && (
            <div className="mt-4 rounded-xl border border-brand-border bg-brand-ivory p-4 text-xs">
              <p className="font-serif text-base font-bold text-brand-ink">
                {validatedVoucher.rewardTitle}
              </p>
              <p className="mt-1 text-brand-muted">
                Visitante: <strong>{validatedVoucher.visitorName}</strong> • Status:{' '}
                <strong>{validatedVoucher.status}</strong>
              </p>
            </div>
          )}

          <h3 className="mt-8 font-serif text-lg font-bold text-brand-ink">
            Histórico Recente de Vouchers
          </h3>
          <div className="mt-3 space-y-2">
            {recentVouchers.map((vch) => (
              <div
                key={vch.id}
                className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2.5 text-xs"
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

        {/* Cadastro de Ofertas e Gestão de Estoque da Loja */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            2. Cadastrar Nova Oferta & Gerenciar Estoque
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Novas ofertas entram com status <code>PENDING</code> até aprovação pela Administração do Shopping (RN-09).
          </p>

          <form onSubmit={handleCreateOffer} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-brand-muted">
                Título da Recompensa / Cupom
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex.: Cappuccino Italiano + Croissant Amanteigado"
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-brand-muted">
                Descrição para o Visitante
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Ex.: Benefício exclusivo para membros do Passaporte Capim Dourado."
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Custo em Pontos
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
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Estoque Inicial (Unidades)
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
              className="w-full rounded-xl bg-gradient-to-r from-brand-goldDark to-brand-goldLight py-2.5 text-xs font-semibold text-white"
            >
              Submeter Nova Oferta para Aprovação
            </button>
          </form>

          <h3 className="mt-6 font-serif text-lg font-bold text-brand-ink">
            Estoque Atual das Ofertas ({rewards.length})
          </h3>
          <div className="mt-3 space-y-3">
            {rewards.map((rew) => (
              <div
                key={rew.id}
                className="rounded-xl border border-brand-border bg-brand-ivory p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif text-sm font-bold text-brand-ink">
                    {rew.title}
                  </h4>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
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
                    <strong>{rew.pointsCost} pts</strong> • Estoque:{' '}
                    <strong>
                      {rew.availableStock} / {rew.initialStock}
                    </strong>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(rew.id, 5)}
                      className="rounded bg-brand-emerald px-2 py-1 text-[10px] font-bold text-white"
                    >
                      +5 Estoque
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
