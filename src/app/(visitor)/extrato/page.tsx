'use client';

import React, { useMemo, useState } from 'react';
import { PointsLedgerService } from '@/modules/points';
import {
  PointTransactionOrigin,
  PointTransactionType,
} from '@/shared/types/domain';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

const ORIGIN_LABELS: Record<
  PointTransactionOrigin,
  { label: string; badgeClass: string }
> = {
  CHECKIN: {
    label: 'CHECK-IN PRESENCIAL',
    badgeClass: 'bg-brand-emerald/15 text-brand-emerald',
  },
  MISSION: {
    label: 'BÔNUS DE MISSÃO',
    badgeClass: 'bg-brand-goldDark/15 text-brand-goldDark',
  },
  REWARD_REDEMPTION: {
    label: 'RESGATE DE VOUCHER',
    badgeClass: 'bg-red-100 text-red-800',
  },
  PROMO_BONUS: {
    label: 'PRESENTE / PROMOÇÃO',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  ADMIN_ADJUSTMENT: {
    label: 'AJUSTE AUDITADO',
    badgeClass: 'bg-stone-200 text-stone-700',
  },
};

export default function PointsStatementPage() {
  const [typeFilter, setTypeFilter] = useState<'ALL' | PointTransactionType>('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | PointTransactionOrigin>('ALL');

  const statement = useMemo(() => {
    return PointsLedgerService.getStatement(
      typeFilter === 'ALL' ? undefined : typeFilter,
      originFilter === 'ALL' ? undefined : originFilter
    );
  }, [typeFilter, originFilter]);

  const levelProgressPct = Math.min(
    100,
    Math.round((statement.lifetimePoints / statement.nextLevelPoints) * 100)
  );

  return (
    <div>
      <VisitorNavigation currentPath="/extrato" />

      <ModuleHeader
        categoryBadge="Extrato de Pontos • Passaporte Digital"
        title="Meu Extrato de Pontos"
        subtitle="Acompanhe todos os créditos de visitas, bônus de missões e resgates realizados no seu Passaporte."
      />

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Saldo Disponível para Resgate
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {statement.currentPoints} pts
          </p>
          <span className="text-xs text-brand-muted">
            Pronto para troca no catálogo
          </span>
        </EditorialCard>

        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Trajetória ({statement.levelLabel})
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-goldDark">
            {statement.lifetimePoints} pts
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-ivory">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-goldDark to-brand-emerald"
              style={{ width: `${levelProgressPct}%` }}
            />
          </div>
          <span className="mt-1 block text-[11px] text-brand-muted">
            Meta próximo nível: {statement.nextLevelPoints} pts ({levelProgressPct}%)
          </span>
        </EditorialCard>

        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Balanço de Entradas vs. Saídas
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="block text-[11px] text-brand-muted">Total Ganho</span>
              <span className="font-serif text-xl font-bold text-brand-emerald">
                +{statement.totalCredits} pts
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[11px] text-brand-muted">Total Resgatado</span>
              <span className="font-serif text-xl font-bold text-red-700">
                -{statement.totalDebits} pts
              </span>
            </div>
          </div>
        </EditorialCard>

        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Integridade Contábil (RN-06)
          </span>
          <p className="mt-1 font-serif text-lg font-bold text-brand-ink">
            {statement.isIntegrityValid ? 'Ledger Auditado ✓' : 'Divergência Detectada'}
          </p>
          <span className="text-xs text-brand-muted">
            {statement.transactions.length} movimentações exibidas
          </span>
        </EditorialCard>
      </div>

      <EditorialCard>
        <div className="flex flex-col justify-between gap-4 border-b border-brand-border pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-bold text-brand-ink">
              Extrato de Movimentações (`PointTransaction`)
            </h2>
            <p className="text-xs text-brand-muted">
              Filtre suas entradas de check-in/missões ou saídas de resgate de vouchers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTypeFilter('ALL')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                typeFilter === 'ALL'
                  ? 'bg-brand-goldDark text-white'
                  : 'border border-brand-border bg-brand-ivory text-brand-ink'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('CREDIT')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                typeFilter === 'CREDIT'
                  ? 'bg-brand-emerald text-white'
                  : 'border border-brand-border bg-brand-ivory text-brand-emerald'
              }`}
            >
              + Entradas (Créditos)
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('DEBIT')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                typeFilter === 'DEBIT'
                  ? 'bg-red-700 text-white'
                  : 'border border-brand-border bg-brand-ivory text-red-700'
              }`}
            >
              - Saídas (Resgates)
            </button>

            <select
              value={originFilter}
              onChange={(e) =>
                setOriginFilter(e.target.value as 'ALL' | PointTransactionOrigin)
              }
              className="rounded-xl border border-brand-border bg-brand-ivory px-3 py-1.5 text-xs font-medium text-brand-ink"
            >
              <option value="ALL">Todas as origens</option>
              <option value="CHECKIN">Check-in Presencial</option>
              <option value="MISSION">Bônus de Missão</option>
              <option value="REWARD_REDEMPTION">Resgate de Voucher</option>
              <option value="PROMO_BONUS">Bônus Promocional</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brand-border text-brand-muted">
                <th className="py-3 pr-4">Data / Hora</th>
                <th className="py-3 pr-4">Origem</th>
                <th className="py-3 pr-4">Descrição Auditada</th>
                <th className="py-3 pr-4">Movimentação</th>
                <th className="py-3 text-right">Saldo Após</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {statement.transactions.map((tx) => {
                const originMeta = ORIGIN_LABELS[tx.origin];
                return (
                  <tr key={tx.id}>
                    <td className="py-3.5 pr-4 text-brand-muted">
                      {new Date(tx.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${originMeta.badgeClass}`}
                      >
                        {originMeta.label}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 font-medium text-brand-ink">
                      {tx.description}
                    </td>
                    <td
                      className={`py-3.5 pr-4 font-bold ${
                        tx.type === 'CREDIT' ? 'text-brand-emerald' : 'text-red-700'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? `+${tx.amount}` : `-${tx.amount}`} pts
                    </td>
                    <td className="py-3.5 text-right font-semibold text-brand-ink">
                      {tx.balanceAfter} pts
                    </td>
                  </tr>
                );
              })}

              {statement.transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-muted">
                    Nenhuma movimentação encontrada para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </EditorialCard>
    </div>
  );
}
