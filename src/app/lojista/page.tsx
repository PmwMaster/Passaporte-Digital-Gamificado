'use client';

import React, { useState } from 'react';
import { MerchantPortalService } from '@/modules/merchant';
import { Voucher } from '@/shared/types/domain';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function MerchantPortalPage() {
  const dashboard = MerchantPortalService.getStoreDashboard();
  const [voucherCode, setVoucherCode] = useState('VCH-CD-4821');
  const [validatedVoucher, setValidatedVoucher] = useState<Voucher | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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
      setValidatedVoucher(json.data.voucher);
      setStatusMsg(
        `Baixa confirmada com sucesso para o voucher ${json.data.voucher.code}! Evento Server-Sent Events (SSE) enviado para a carteira do visitante.`
      );
    } else {
      setIsError(true);
      setStatusMsg(`${json.error?.code}: ${json.error?.message}`);
    }
  }

  return (
    <div>
      <ModuleHeader
        featureNumber="FUNCIONALIDADE 08"
        title="Portal Operacional do Lojista & Balcão"
        subtitle={`Operação ativa: ${dashboard.store.name} (${dashboard.store.floor}) • Operador: ${dashboard.operator.operatorName}`}
        developerOwner="DESENVOLVEDOR 03"
        moduleName="merchant"
      />

      {/* Indicadores Operacionais da Loja */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Check-ins na Loja</span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-ink">
            {dashboard.metrics.totalCheckIns}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Vouchers Aguardando Uso</span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-goldDark">
            {dashboard.metrics.activeVouchers}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Vouchers Baixados</span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {dashboard.metrics.usedVouchers}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Estoque Total de Ofertas</span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-ink">
            {dashboard.metrics.availableStockTotal} un.
          </p>
        </EditorialCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Validador de Vouchers */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Validação & Baixa de Voucher no Balcão
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Escaneie o QR Code do cliente ou digite o código único para validar e registrar a entrega da recompensa.
          </p>

          <form onSubmit={handleValidate} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Código do Voucher (ou Leitura QR)
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
                className="rounded-xl bg-brand-goldDark px-5 py-2.5 text-xs font-semibold text-white"
              >
                1. Consultar Validade (POST /validate)
              </button>
              <button
                type="button"
                onClick={handleConfirmRedemption}
                className="rounded-xl bg-brand-emerald px-5 py-2.5 text-xs font-semibold text-white"
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
        </EditorialCard>

        {/* Gestão de Ofertas e Estoque da Loja */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Ofertas & Estoque da Loja
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Novas ofertas entram como <code>PENDING_APPROVAL</code> até aprovação pelo Admin do Shopping.
          </p>

          <div className="mt-5 space-y-3">
            {dashboard.rewards.map((rew) => (
              <div
                key={rew.id}
                className="rounded-xl border border-brand-border bg-brand-ivory p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-bold text-brand-ink">
                    {rew.title}
                  </h3>
                  <span className="rounded-full bg-brand-emerald/15 px-2.5 py-0.5 text-[10px] font-bold text-brand-emerald">
                    {rew.approvalStatus}
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-muted">
                  Custo: <strong>{rew.pointsCost} pts</strong> • Estoque Restante:{' '}
                  <strong>
                    {rew.availableStock} / {rew.initialStock}
                  </strong>
                </p>
              </div>
            ))}
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
