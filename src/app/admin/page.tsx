'use client';

import React, { useState } from 'react';
import { AdministrationService } from '@/modules/administration';
import { Campaign, Reward, Store, StoreCategory } from '@/shared/types/domain';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function AdminDashboardPage() {
  const initialData = AdministrationService.getExecutiveDashboard();

  const [stores, setStores] = useState<Store[]>(initialData.stores);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialData.campaigns);
  const [rewards, setRewards] = useState<Reward[]>(initialData.rewards);
  const [geofence, setGeofence] = useState(initialData.shoppingConfig);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] =
    useState<StoreCategory>('GASTRONOMIA');
  const [storeFloor, setStoreFloor] = useState('Piso 2');
  const [storeUnit, setStoreUnit] = useState('L-215');
  const [storeDesc, setStoreDesc] = useState('');
  const [storePoints, setStorePoints] = useState(50);

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
      setFeedback(`Loja "${json.data.store.name}" cadastrada (${json.data.store.qrCodeToken}).`);
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
      setFeedback(`Status atualizado para ${decision}.`);
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
      setFeedback(`Raio atualizado para ${json.data.geofence.defaultGeofenceRadiusMeters}m.`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold text-brand-ink">
          Administração do Shopping
        </h1>
        <a
          href="/api/admin/audit/export?format=csv"
          download="auditoria-passaporte.csv"
          className="rounded-xl bg-brand-goldDark px-4 py-2 text-xs font-semibold text-white"
        >
          Exportar CSV ↓
        </a>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-brand-emerald bg-brand-emerald/10 p-3.5 text-xs font-semibold text-brand-emerald">
          {feedback}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Visitantes</span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-ink">
            {initialData.kpis.activeVisitors.toLocaleString('pt-BR')}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Lojas</span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-emerald">
            {stores.length}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Pontos Emitidos</span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-goldDark">
            {initialData.kpis.totalPointsIssued.toLocaleString('pt-BR')}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Raio GPS</span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-ink">
            {geofence.defaultGeofenceRadiusMeters}m
          </p>
        </EditorialCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cadastro de Loja */}
        <EditorialCard>
          <h2 className="font-serif text-xl font-bold text-brand-ink">
            Cadastrar Loja Parceira
          </h2>

          <form onSubmit={handleCreateStore} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Nome da Loja"
                className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
                required
              />
              <select
                value={storeCategory}
                onChange={(e) => setStoreCategory(e.target.value as StoreCategory)}
                className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
              >
                <option value="GASTRONOMIA">Gastronomia & Cafés</option>
                <option value="MODA">Moda & Acessórios</option>
                <option value="BELEZA">Beleza & Bem-Estar</option>
                <option value="LAZER">Cinema & Lazer</option>
                <option value="SERVICOS">Serviços</option>
                <option value="TECNOLOGIA">Tecnologia</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={storeFloor}
                onChange={(e) => setStoreFloor(e.target.value)}
                placeholder="Piso"
                className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-xs"
                required
              />
              <input
                type="text"
                value={storeUnit}
                onChange={(e) => setStoreUnit(e.target.value)}
                placeholder="Unidade"
                className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-xs"
                required
              />
              <input
                type="number"
                min={5}
                value={storePoints}
                onChange={(e) => setStorePoints(Number(e.target.value))}
                placeholder="Pontos"
                className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-xs"
                required
              />
            </div>

            <input
              type="text"
              value={storeDesc}
              onChange={(e) => setStoreDesc(e.target.value)}
              placeholder="Descrição curta"
              className="w-full rounded-xl border border-brand-border bg-brand-ivory px-3.5 py-2 text-xs"
              required
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-emerald py-2.5 text-xs font-semibold text-white"
            >
              Cadastrar Loja
            </button>
          </form>

          <div className="mt-5 max-h-56 space-y-2 overflow-y-auto pr-1">
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-ivory p-2.5 text-xs"
              >
                <div>
                  <strong className="text-brand-ink">{store.name}</strong>
                  <span className="ml-2 text-brand-muted">+{store.checkInPoints} pts</span>
                </div>
                <code className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-brand-goldDark">
                  {store.qrCodeToken}
                </code>
              </div>
            ))}
          </div>
        </EditorialCard>

        {/* Moderação + Geofence */}
        <div className="space-y-6">
          <EditorialCard>
            <h2 className="font-serif text-xl font-bold text-brand-ink">
              Aprovação de Campanhas & Ofertas
            </h2>

            <div className="mt-4 space-y-2.5">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-ivory p-3 text-xs"
                >
                  <div>
                    <p className="font-serif text-sm font-bold text-brand-ink">
                      {camp.title}
                    </p>
                    <span className="text-[11px] text-brand-muted">{camp.status}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleModerate('CAMPAIGN', camp.id, 'APPROVED')}
                      className="rounded-lg bg-brand-emerald px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerate('CAMPAIGN', camp.id, 'REJECTED')}
                      className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}

              {rewards.slice(0, 3).map((rew) => (
                <div
                  key={rew.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-white p-3 text-xs"
                >
                  <div>
                    <p className="font-serif text-sm font-bold text-brand-ink">
                      {rew.title} ({rew.pointsCost} pts)
                    </p>
                    <span className="text-[11px] text-brand-muted">
                      {rew.storeName} • {rew.approvalStatus}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleModerate('REWARD', rew.id, 'APPROVED')}
                      className="rounded-lg bg-brand-emerald px-2.5 py-1 text-[11px] font-semibold text-white"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModerate('REWARD', rew.id, 'REJECTED')}
                      className="rounded-lg border border-red-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700"
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </EditorialCard>

          <EditorialCard>
            <h2 className="font-serif text-xl font-bold text-brand-ink">
              Raio de Check-in (GPS)
            </h2>
            <form onSubmit={handleSaveGeofence} className="mt-3 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-brand-muted">
                    Latitude
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
                  <label className="block text-[11px] font-semibold uppercase text-brand-muted">
                    Longitude
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
                  <label className="block text-[11px] font-semibold uppercase text-brand-muted">
                    Raio (m)
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
                Salvar Raio GPS
              </button>
            </form>
          </EditorialCard>
        </div>
      </div>
    </div>
  );
}
