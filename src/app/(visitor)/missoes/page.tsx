'use client';

import React, { useMemo, useState } from 'react';
import { GamificationService } from '@/modules/gamification';
import { MissionFrequency, MissionStatus } from '@/shared/types/domain';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

const FREQUENCY_LABELS: Record<MissionFrequency, string> = {
  DAILY: 'DIÁRIA',
  WEEKLY: 'SEMANAL',
  MONTHLY: 'MENSAL',
  SPECIAL: 'ESPECIAL',
};

export default function MissionsAndStampsPage() {
  const [frequencyFilter, setFrequencyFilter] = useState<'ALL' | MissionFrequency>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MissionStatus>('ALL');

  const {
    stamps,
    stampBook,
    stampCatalog,
    missions,
    levelProgress,
  } = useMemo(() => {
    return GamificationService.listMissionsAndStamps({
      frequency: frequencyFilter === 'ALL' ? undefined : frequencyFilter,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    });
  }, [frequencyFilter, statusFilter]);

  return (
    <div>
      <VisitorNavigation currentPath="/missoes" />

      <ModuleHeader
        categoryBadge="Gamificação & Coleção • Passaporte Digital"
        title="Meus Carimbos & Missões"
        subtitle="Complete desafios nas lojas do shopping, colecione selos exclusivos e ganhe pontos bônus."
      />

      {/* Resumo de Nível e Caderneta */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Nível Atual do Passaporte (RN-05)
          </span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-goldDark">
            {levelProgress.levelLabel}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-brand-ivory">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-goldDark to-brand-emerald"
              style={{ width: `${levelProgress.progressPercent}%` }}
            />
          </div>
          <span className="mt-1.5 block text-xs text-brand-muted">
            {levelProgress.lifetimePoints} / {levelProgress.nextLevelPoints} pts acumulados (faltam{' '}
            {levelProgress.pointsToNextLevel} pts)
          </span>
        </EditorialCard>

        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Progresso da Caderneta de Lojas
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {stampCatalog.collectedCount} de {stampCatalog.totalPartnerStores}
          </p>
          <span className="text-xs text-brand-muted">
            Lojas parceiras carimbadas ({stamps.length} carimbos totais)
          </span>
        </EditorialCard>

        <EditorialCard>
          <span className="text-xs uppercase tracking-wider text-brand-muted">
            Regras de Gamificação Ativas
          </span>
          <p className="mt-1 font-serif text-lg font-bold text-brand-ink">
            1 Carimbo / Loja / Dia
          </p>
          <span className="text-xs text-brand-muted">
            Raio GPS Haversine 250m • Fuso Palmas (UTC-3)
          </span>
        </EditorialCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Missões */}
        <EditorialCard>
          <div className="flex flex-col justify-between gap-3 border-b border-brand-border pb-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-serif text-2xl font-bold text-brand-ink">
                Missões e Desafios Ativos
              </h2>
              <p className="text-xs text-brand-muted">
                Ao atingir 100% da meta, o bônus é creditado automaticamente no seu Ledger.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={frequencyFilter}
                onChange={(e) =>
                  setFrequencyFilter(e.target.value as 'ALL' | MissionFrequency)
                }
                className="rounded-xl border border-brand-border bg-brand-ivory px-3 py-1.5 text-xs font-medium text-brand-ink"
              >
                <option value="ALL">Todas as frequências</option>
                <option value="DAILY">Diárias</option>
                <option value="WEEKLY">Semanais</option>
                <option value="MONTHLY">Mensais</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'ALL' | MissionStatus)
                }
                className="rounded-xl border border-brand-border bg-brand-ivory px-3 py-1.5 text-xs font-medium text-brand-ink"
              >
                <option value="ALL">Todos os status</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="COMPLETED">Concluídas</option>
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {missions.map((mission) => {
              const pct = Math.min(
                100,
                Math.round((mission.currentCount / mission.targetCount) * 100)
              );
              const isCompleted = mission.status === 'COMPLETED';
              return (
                <div
                  key={mission.id}
                  className={`rounded-2xl border p-4 ${
                    isCompleted
                      ? 'border-brand-emerald/40 bg-brand-emerald/5'
                      : 'border-brand-border bg-brand-ivory'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-brand-goldDark/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-brand-goldDark">
                      {FREQUENCY_LABELS[mission.frequency]} • {mission.periodKey}
                    </span>
                    <span className="rounded-full bg-brand-emerald/15 px-3 py-0.5 text-xs font-bold text-brand-emerald">
                      +{mission.rewardPoints} pts bônus
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-bold text-brand-ink">
                    {mission.title}
                  </h3>
                  <p className="mt-1 text-xs text-brand-muted">{mission.description}</p>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span>
                        Progresso: {mission.currentCount} de {mission.targetCount}
                      </span>
                      <span
                        className={
                          isCompleted ? 'font-bold text-brand-emerald' : 'text-brand-ink'
                        }
                      >
                        {isCompleted ? 'CONCLUÍDA ✓' : `${pct}%`}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-goldDark to-brand-emerald"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {missions.length === 0 && (
              <p className="py-6 text-center text-xs text-brand-muted">
                Nenhuma missão encontrada para os filtros selecionados.
              </p>
            )}
          </div>
        </EditorialCard>

        {/* Caderneta Completa de Carimbos (Conquistados + Pendentes) */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Caderneta Oficial de Carimbos ({stampCatalog.collectedCount}/
            {stampCatalog.totalPartnerStores})
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Lojas em dourado já foram carimbadas; espaços tracejados indicam lojas pendentes para você visitar e pontuar.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {stampBook.map((slot) => (
              <div
                key={slot.storeId}
                className={`rounded-2xl border-2 p-4 transition ${
                  slot.collected
                    ? 'border-dashed border-brand-goldLight bg-brand-ivory'
                    : 'border-dashed border-brand-border bg-white/60 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                      slot.collected
                        ? 'bg-brand-goldDark text-white'
                        : 'bg-stone-200 text-stone-600'
                    }`}
                  >
                    {slot.category}
                  </span>
                  <span className="text-[11px] font-bold text-brand-goldDark">
                    +{slot.checkInPoints} pts
                  </span>
                </div>

                <h3 className="mt-2 font-serif text-base font-bold text-brand-ink">
                  {slot.stamp ? slot.stamp.badgeTitle : `Selo ${slot.storeName}`}
                </h3>
                <p className="text-xs text-brand-muted">
                  {slot.storeName} • {slot.storeFloor}
                </p>

                {slot.collected && slot.stamp ? (
                  <p className="mt-2 text-[11px] font-semibold text-brand-emerald">
                    ✓ Carimbado em{' '}
                    {new Date(slot.stamp.earnedAt).toLocaleDateString('pt-BR')}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] font-medium text-brand-muted">
                    ○ Pendente — Escaneie o QR no balcão
                  </p>
                )}
              </div>
            ))}
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
