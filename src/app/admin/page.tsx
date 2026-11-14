'use client';

import React, { useState } from 'react';
import { AdministrationService } from '@/modules/administration';
import { Campaign, Reward, Store, StoreCategory } from '@/shared/types/domain';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function AdminDashboardPage() {
  const initialData = AdministrationService.getExecutiveDashboard();

  const [stores, setStores] = useState<Store[]>(initialData.stores);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialData.campaigns);
  const [rewards, setRewards] = useState<Reward[]>(initialData.rewards);
  const [geofence, setGeofence] = useState(initialData.shoppingConfig);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Estado para formulário de Nova Loja (Fase 2 - F09 + F01)
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] =
    useState<StoreCategory>('GASTRONOMIA');
  const [storeFloor, setStoreFloor] = useState('Piso 2 • Praça Central');
  const [storeUnit, setStoreUnit] = useState('L-215');
  const [storeDesc, setStoreDesc] = useState('');
  const [storePoints, setStorePoints] = useState(50);

  // Estado para Geofence (Fase 4 - F09)
  const [latInput, setLatInput] = useState(
    initialData.shoppingConfig.defaultCoordinates.latitude
  );
  const [lngInput, setLngInput] = useState(
    initialData.shoppingConfig.defaultCoordinates.longitude
  );
  const [radiusInput, setRadiusInput] = useState(
    initialData.shoppingConfig.defaultGeofenceRadiusMeters
  );

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: storeName,
        category: storeCategory,
        floor: storeFloor,
        unitNumber: storeUnit,
        description: storeDesc,
        checkInPoints: Number(storePoints),
        isFeatured: true,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setStores((prev) => [json.data.store, ...prev]);
      setStoreName('');
      setStoreDesc('');
      setFeedback(
        `Loja "${json.data.store.name}" criada com QR Code oficial ${json.data.store.qrCodeToken} e publicada na Vitrine Pública!`
      );
    } else {
      setFeedback(json.error?.message ?? 'Erro ao cadastrar loja.');
    }
  }

  async function handleModerate(
    targetType: 'CAMPAIGN' | 'REWARD',
    targetId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) {
    const res = await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, decision }),
    });
    const json = await res.json();
    if (json.success) {
      if (targetType === 'CAMPAIGN') {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === targetId ? { ...c, status: decision } : c))
        );
      } else {
        setRewards((prev) =>
          prev.map((r) =>
            r.id === targetId ? { ...r, approvalStatus: decision } : r
          )
        );
      }
      setFeedback(
        `Item ${targetId} (${targetType}) atualizado para ${decision} com sucesso!`
      );
    }
  }

  async function handleSaveGeofence(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/geofence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: Number(latInput),
        longitude: Number(lngInput),
        radiusMeters: Number(radiusInput),
      }),
    });
    const json = await res.json();
    if (json.success) {
      setGeofence(json.data.geofence);
      setFeedback(
        `Geofence atualizado! Novo raio Haversine: ${json.data.geofence.defaultGeofenceRadiusMeters} metros.`
      );
    }
  }

  return (
    <div>
      <ModuleHeader
        featureNumber="FASE 2 & FASE 4 • FUNCIONALIDADE 09"
        title="Painel Administrativo & Governança do Shopping"
        subtitle="Dashboard executivo, cadastro de lojas e QR Codes oficiais, moderação de campanhas/ofertas, parametrização de geofence (250m) e exportação de auditoria."
        developerOwner="DESENVOLVEDOR 03"
        moduleName="administration"
      />

      {feedback && (
        <div className="mb-6 rounded-2xl border border-brand-emerald bg-brand-emerald/10 p-4 text-xs font-semibold text-brand-emerald">
          {feedback}
        </div>
      )}

      {/* KPIs Executivos + Exportação de Auditoria */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-bold text-brand-ink">
          Indicadores Executivos do Programa
        </h2>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/admin/audit/export?format=csv"
            download="auditoria-passaporte-capim-dourado.csv"
            className="rounded-xl bg-brand-goldDark px-4 py-2 text-xs font-semibold text-white transition hover:opacity-95"
          >
            Exportar Auditoria (CSV) ↓
          </a>
          <a
            href="/api/admin/audit/export?format=json"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-brand-border bg-white px-4 py-2 text-xs font-semibold text-brand-ink transition hover:border-brand-goldDark"
          >
            Ver JSON de Auditoria
          </a>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Visitantes Ativos
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-ink">
            {initialData.kpis.activeVisitors.toLocaleString('pt-BR')}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Lojas Parceiras Ativas
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {stores.length}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Pontos Emitidos vs. Resgatados
          </span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-goldDark">
            {initialData.kpis.totalPointsIssued.toLocaleString('pt-BR')} /{' '}
            {initialData.kpis.totalPointsRedeemed.toLocaleString('pt-BR')}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Raio Haversine Atual
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-ink">
            {geofence.defaultGeofenceRadiusMeters}m
          </p>
        </EditorialCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 1. Cadastro de Nova Loja + Emissão de QR Code Oficial */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            1. Cadastrar Loja Parceira & Emitir QR Code Oficial
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Lojas criadas aqui geram automaticamente seu token QR assinado e aparecem imediatamente na Vitrine Pública (`/`).
          </p>

          <form onSubmit={handleCreateStore} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ex.: Havanna Café Capim Dourado"
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Categoria
                </label>
                <select
                  value={storeCategory}
                  onChange={(e) =>
                    setStoreCategory(e.target.value as StoreCategory)
                  }
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                >
                  <option value="GASTRONOMIA">Gastronomia & Cafés</option>
                  <option value="MODA">Moda & Acessórios</option>
                  <option value="BELEZA">Beleza & Bem-Estar</option>
                  <option value="LAZER">Cinema & Lazer</option>
                  <option value="SERVICOS">Serviços</option>
                  <option value="TECNOLOGIA">Tecnologia</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Piso / Corredor
                </label>
                <input
                  type="text"
                  value={storeFloor}
                  onChange={(e) => setStoreFloor(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Unidade
                </label>
                <input
                  type="text"
                  value={storeUnit}
                  onChange={(e) => setStoreUnit(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-brand-muted">
                  Pts / Check-in
                </label>
                <input
                  type="number"
                  min={5}
                  value={storePoints}
                  onChange={(e) => setStorePoints(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-brand-muted">
                Descrição Editorial da Loja
              </label>
              <input
                type="text"
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
                placeholder="Ex.: Dulce de leche argentino, alfajores e cafés especiais."
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-emerald py-2.5 text-xs font-semibold text-white"
            >
              Cadastrar Loja & Gerar QR Code Oficial
            </button>
          </form>

          <h3 className="mt-6 font-serif text-lg font-bold text-brand-ink">
            QR Codes Oficiais Ativos ({stores.length})
          </h3>
          <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-ivory p-3 text-xs"
              >
                <div>
                  <strong className="text-brand-ink">{store.name}</strong>
                  <span className="ml-2 text-brand-muted">
                    ({store.floor} • +{store.checkInPoints} pts)
                  </span>
                </div>
                <code className="rounded bg-white px-2.5 py-1 font-mono text-[11px] font-bold text-brand-goldDark">
                  {store.qrCodeToken}
                </code>
              </div>
            ))}
          </div>
        </EditorialCard>

        {/* 2. Moderação de Campanhas/Ofertas + Configuração de Geofence */}
        <div className="space-y-8">
          <EditorialCard>
            <h2 className="font-serif text-2xl font-bold text-brand-ink">
              2. Moderação de Campanhas & Ofertas (RN-09)
            </h2>
            <p className="mt-1 text-xs text-brand-muted">
              Aprove ou rejeite campanhas e recompensas submetidas pelos lojistas.
            </p>

            <div className="mt-4 space-y-3">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-brand-goldDark">
                      [CAMPANHA] {camp.storeName ?? 'Shopping Global'}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        camp.status === 'APPROVED'
                          ? 'bg-brand-emerald/15 text-brand-emerald'
                          : camp.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                  <p className="mt-1 font-serif text-base font-bold text-brand-ink">
                    {camp.title}
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleModerate('CAMPAIGN', camp.id, 'APPROVED')
                      }
                      className="rounded-lg bg-brand-emerald px-3 py-1 text-[11px] font-semibold text-white"
                    >
                      Aprovar ✓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleModerate('CAMPAIGN', camp.id, 'REJECTED')
                      }
                      className="rounded-lg border border-red-300 bg-white px-3 py-1 text-[11px] font-semibold text-red-700"
                    >
                      Rejeitar ✕
                    </button>
                  </div>
                </div>
              ))}

              {rewards.slice(0, 3).map((rew) => (
                <div
                  key={rew.id}
                  className="rounded-xl border border-brand-border bg-white p-3.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-brand-ink">
                      [OFERTA LOJISTA] {rew.storeName}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        rew.approvalStatus === 'APPROVED'
                          ? 'bg-brand-emerald/15 text-brand-emerald'
                          : rew.approvalStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rew.approvalStatus}
                    </span>
                  </div>
                  <p className="mt-1 font-serif text-sm font-bold text-brand-ink">
                    {rew.title} ({rew.pointsCost} pts)
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleModerate('REWARD', rew.id, 'APPROVED')
                      }
                      className="rounded-lg bg-brand-emerald px-3 py-1 text-[11px] font-semibold text-white"
                    >
                      Aprovar Oferta ✓
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleModerate('REWARD', rew.id, 'REJECTED')
                      }
                      className="rounded-lg border border-red-300 bg-white px-3 py-1 text-[11px] font-semibold text-red-700"
                    >
                      Rejeitar ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </EditorialCard>

          <EditorialCard>
            <h2 className="font-serif text-2xl font-bold text-brand-ink">
              3. Configuração de Geolocalização (Haversine)
            </h2>
            <form onSubmit={handleSaveGeofence} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-brand-muted">
                    Latitude Central
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={latInput}
                    onChange={(e) => setLatInput(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-brand-muted">
                    Longitude Central
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lngInput}
                    onChange={(e) => setLngInput(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold uppercase text-brand-muted">
                    Raio Geofence (m)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={5000}
                    value={radiusInput}
                    onChange={(e) => setRadiusInput(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-ink py-2.5 font-semibold text-white hover:bg-brand-goldDark"
              >
                Salvar Parâmetros de Geofence
              </button>
            </form>
          </EditorialCard>
        </div>
      </div>
    </div>
  );
}
