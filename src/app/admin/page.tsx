'use client';

import React, { useState } from 'react';
import { AdministrationService } from '@/modules/administration';
import { Campaign, Store, StoreCategory } from '@/shared/types/domain';
import { PasseDouradoLogo } from '@/components/shared/PasseDouradoLogo';

const MOBILE_HOURLY_BARS = [
  { hour: '10h', count: 42, pct: 22, isPeak: false },
  { hour: '12h', count: 168, pct: 88, isPeak: true },
  { hour: '14h', count: 94, pct: 49, isPeak: false },
  { hour: '16h', count: 70, pct: 37, isPeak: false },
  { hour: '18h', count: 112, pct: 59, isPeak: false },
  { hour: '20h', count: 190, pct: 100, isPeak: true },
  { hour: '22h', count: 36, pct: 19, isPeak: false },
];

const DESKTOP_HOURLY_FLOW = [
  { hour: '10h', checkIns: 35, redemptions: 22 },
  { hour: '11h', checkIns: 60, redemptions: 40 },
  { hour: '12h', checkIns: 152, redemptions: 122, tag: 'Almoço' },
  { hour: '13h', checkIns: 161, redemptions: 138, isPeak: true },
  { hour: '14h', checkIns: 82, redemptions: 66 },
  { hour: '15h', checkIns: 54, redemptions: 42 },
  { hour: '16h', checkIns: 68, redemptions: 55 },
  { hour: '17h', checkIns: 98, redemptions: 80 },
  { hour: '18h', checkIns: 134, redemptions: 110 },
  { hour: '19h', checkIns: 168, redemptions: 156, tag: 'Jantar', isPeak: true },
  { hour: '20h', checkIns: 145, redemptions: 135 },
  { hour: '21h', checkIns: 90, redemptions: 82 },
];

const MOBILE_TOP_LOCATIONS = [
  {
    rank: 1,
    name: 'Café Exemplo',
    sub: 'Piso L2 · Gastronomia',
    count: 182,
    isTop: true,
  },
  {
    rank: 2,
    name: 'Joias Exemplo',
    sub: 'Piso L1 · Luxo',
    count: 140,
    isTop: false,
  },
  {
    rank: 3,
    name: 'Cinema Lumière',
    sub: 'Piso L3 · Lazer',
    count: 124,
    isTop: false,
  },
  {
    rank: 4,
    name: 'Praça de Alimentação Central',
    sub: 'Piso L2 · Área comum',
    count: 98,
    isTop: false,
  },
];

const DESKTOP_ENGAGED_STORES = [
  {
    rank: 1,
    name: 'Café Exemplo',
    sub: 'Piso L2 · Café e doceria',
    checkIns: '784 check-ins',
    coupons: '412 cupons baixados',
    isTop: true,
  },
  {
    rank: 2,
    name: 'Grill Exemplo',
    sub: 'Piso L2 · Gastronomia',
    checkIns: '692 check-ins',
    coupons: '380 cupons baixados',
    isTop: false,
  },
  {
    rank: 3,
    name: 'Lojas Exemplo',
    sub: 'Âncora · Moda e acessórios',
    checkIns: '541 check-ins',
    coupons: '290 cupons baixados',
    isTop: false,
  },
  {
    rank: 4,
    name: 'Choco Exemplo',
    sub: 'Piso L1 · Chocolateria',
    checkIns: '489 check-ins',
    coupons: '215 cupons baixados',
    isTop: false,
  },
];

export default function AdminDashboardPage() {
  const initialData = AdministrationService.getExecutiveDashboard();

  const [period, setPeriod] = useState<'TODAY' | '7D' | 'MONTH' | 'YEAR'>('TODAY');
  const [adminTab, setAdminTab] = useState<'STORES' | 'QR' | 'MODERATION' | 'RULES'>('STORES');
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialData.campaigns);
  const [stores, setStores] = useState<Store[]>(initialData.stores);
  const [storeSearch, setStoreSearch] = useState('');
  const [geofenceRadius, setGeofenceRadius] = useState<number>(250);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [bannersOrder, setBannersOrder] = useState([
    {
      id: 'B1',
      title: 'Festival Gourmet',
      subtitle: 'Ativo · Destaque',
      isTop: true,
    },
    {
      id: 'B2',
      title: 'Joias Exemplo · Coleção',
      subtitle: 'Carrossel · posição 2',
      isTop: false,
    },
  ]);

  // Modal Nova Loja Parceira
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] =
    useState<StoreCategory>('GASTRONOMIA');
  const [newStoreFloor, setNewStoreFloor] = useState('Piso L2');
  const [newStoreUnit, setNewStoreUnit] = useState('Loja 114');
  const [newStorePoints, setNewStorePoints] = useState(35);
  const [isSavingStore, setIsSavingStore] = useState(false);

  // Modal de Totem QR Code para Impressão
  const [selectedTotemStore, setSelectedTotemStore] =
    useState<Store | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  }

  const pendingCampaigns = campaigns.filter(
    (c) => c.status === 'PENDING_APPROVAL'
  );
  const activeModerationCampaign = pendingCampaigns[0] ?? campaigns[0];

  async function handleModerateCampaign(
    campaignId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) {
    try {
      await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'CAMPAIGN',
          targetId: campaignId,
          decision,
        }),
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: decision } : c))
      );
      showToast(
        `Oferta ${
          decision === 'APPROVED' ? 'aprovada e publicada' : 'recusada'
        } com sucesso!`
      );
    } catch {
      showToast('Erro ao moderar campanha.');
    }
  }

  async function handleUpdateGeofence(radius: number) {
    setGeofenceRadius(radius);
    try {
      await fetch('/api/admin/geofence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: initialData.shoppingConfig.defaultCoordinates.latitude,
          longitude: initialData.shoppingConfig.defaultCoordinates.longitude,
          radiusMeters: radius,
        }),
      });
      showToast(
        `Raio de validação atualizado para ${radius} m ao redor do Passe Dourado!`
      );
    } catch {
      showToast(`Raio ajustado para ${radius} m.`);
    }
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingStore(true);
    try {
      const slug = newStoreName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const res = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStoreName,
          slug: slug || `loja-${Date.now()}`,
          category: newStoreCategory,
          floor: newStoreFloor,
          unitNumber: newStoreUnit,
          description:
            'Estabelecimento parceiro oficial do programa Passe Dourado.',
          checkInPoints: Number(newStorePoints),
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.store) {
        setStores((prev) => [json.data.store, ...prev]);
        setShowNewStoreModal(false);
        setNewStoreName('');
        showToast(
          `Loja "${json.data.store.name}" cadastrada com QR Token ${json.data.store.qrCodeToken}!`
        );
      } else {
        showToast(json.error?.message ?? 'Verifique os dados da loja.');
      }
    } finally {
      setIsSavingStore(false);
    }
  }

  function handleSwapBanners() {
    setBannersOrder((prev) => [...prev].reverse());
    showToast('Ordem dos banners do app reordenada com sucesso!');
  }

  const filteredStores = stores.filter((s) => {
    if (!storeSearch.trim()) return true;
    const q = storeSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.floor.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl pb-12 text-[#1E1914]">
      {/* TOAST DE FEEDBACK */}
      {toastMsg && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-[#256B30]/30 bg-[#EBF5ED] px-4 py-3 text-xs font-bold text-[#256B30] shadow-sm">
          <span>✓ {toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[#256B30]/70 hover:text-[#256B30]"
          >
            ✕
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DESKTOP VIEW (adm/Passe-Dourado-desktop-admin-visao-geral.png)        */}
      {/* ===================================================================== */}
      <div className="hidden lg:block">
        {/* Top Header Desktop */}
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-headline text-4xl font-bold text-[#1E1914]">
                Visão geral
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EBF5ED] px-3 py-1 text-xs font-bold text-[#256B30]">
                <span className="h-2 w-2 rounded-full bg-[#256B30]" />
                Sistema no ar
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-[#7A7065]">
              Gestão do Passe Dourado · Palmas/TO
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-[#E6DFD3] bg-[#F3ECE0] p-1">
              {(
                [
                  { id: 'TODAY', label: 'Hoje' },
                  { id: '7D', label: '7 dias' },
                  { id: 'MONTH', label: 'Este mês' },
                  { id: 'YEAR', label: 'Este ano' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    period === p.id
                      ? 'bg-white text-[#1E1914] shadow-sm'
                      : 'text-[#5A5248] hover:text-[#1E1914]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <a
              href="/api/admin/audit/export"
              download
              onClick={() =>
                showToast('Gerando e baixando relatório executivo (CSV)...')
              }
              className="inline-flex items-center gap-2 rounded-full bg-[#74520B] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#5E4108]"
            >
              <span className="material-symbols-outlined text-[16px]">
                download
              </span>
              Exportar relatório
            </a>
          </div>
        </header>

        {/* 5 KPI Cards Desktop */}
        <section className="mb-6 grid grid-cols-5 gap-4">
          <div className="rounded-[24px] border border-[#EAE3D5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#5A5248]">
              <span>Cadastrados</span>
              <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                person
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-[#1E1914]">
                14.280
              </span>
              <span className="text-[11px] font-bold text-[#256B30]">
                ↗ 12%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#7A7065]">
              +1.520 novos passaportes
            </p>
            <svg viewBox="0 0 120 28" className="mt-3 h-7 w-full">
              <path
                d="M2 24 L25 22 L48 16 L72 18 L96 10 L118 4 L118 28 L2 28 Z"
                fill="#EBF5ED"
              />
              <path
                d="M2 24 L25 22 L48 16 L72 18 L96 10 L118 4"
                fill="none"
                stroke="#256B30"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="rounded-[24px] border border-[#EAE3D5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#5A5248]">
              <span>Ativos em 7 dias</span>
              <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                sensors
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-[#1E1914]">
                4.890
              </span>
              <span className="text-[11px] font-bold text-[#256B30]">
                ↗ 8,4%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#7A7065]">
              34,2% da base total
            </p>
            <svg viewBox="0 0 120 28" className="mt-3 h-7 w-full">
              <path
                d="M2 22 L28 24 L52 17 L76 14 L98 11 L118 5 L118 28 L2 28 Z"
                fill="#F5EFE4"
              />
              <path
                d="M2 22 L28 24 L52 17 L76 14 L98 11 L118 5"
                fill="none"
                stroke="#85601A"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="rounded-[24px] border border-[#EAE3D5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#5A5248]">
              <span>Taxa de retorno</span>
              <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                login
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-[#1E1914]">
                64,2%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#7A7065]">
              Média de 2,8 visitas por mês
            </p>
            <svg viewBox="0 0 120 28" className="mt-3 h-7 w-full">
              <path
                d="M2 23 L26 20 L52 21 L76 13 L98 10 L118 4 L118 28 L2 28 Z"
                fill="#EBF5ED"
              />
              <path
                d="M2 23 L26 20 L52 21 L76 13 L98 10 L118 4"
                fill="none"
                stroke="#256B30"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="rounded-[24px] border border-[#EAE3D5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#5A5248]">
              <span>Check-ins hoje</span>
              <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                location_on
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-[#1E1914]">
                1.240
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#7A7065]">
              Leituras em totens e balcões
            </p>
            <svg viewBox="0 0 120 28" className="mt-3 h-7 w-full">
              <path
                d="M2 25 L26 14 L50 20 L74 12 L96 5 L118 14 L118 28 L2 28 Z"
                fill="#F5EFE4"
              />
              <path
                d="M2 25 L26 14 L50 20 L74 12 L96 5 L118 14"
                fill="none"
                stroke="#C59B40"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="rounded-[24px] border border-[#EAE3D5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#5A5248]">
              <span>Cupons baixados</span>
              <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                sell
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-[#1E1914]">
                2.910
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#7A7065]">de 3.820 emitidos</p>
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-[#EFE9DC]">
              <div
                className="h-full rounded-full bg-[#256B30]"
                style={{ width: '76.1%' }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] font-bold">
              <span className="text-[#7A7065]">Conversão no caixa</span>
              <span className="text-[#256B30]">76,1%</span>
            </div>
          </div>
        </section>

        {/* Fluxo por horário + Lojas mais engajadas */}
        <div className="mb-8 grid grid-cols-12 gap-5">
          <section className="col-span-7 rounded-[28px] border border-[#EAE3D5] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-headline text-2xl font-bold text-[#1E1914]">
                  Fluxo por horário
                </h2>
                <p className="mt-1 text-xs text-[#7A7065]">
                  Hoje: 1.240 check-ins e 1.041 resgates no caixa. Veja as janelas de pico da praça de alimentação.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-[#5A5248]">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-[#C89C42]" />
                  Check-ins
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-[#2F6C3B]" />
                  Resgates no caixa
                </span>
              </div>
            </div>

            <div className="mt-8 flex h-52 items-end justify-between gap-2 border-b border-[#EFE9DC] pb-2 pt-6">
              {DESKTOP_HOURLY_FLOW.map((b) => (
                <div
                  key={b.hour}
                  className="relative flex flex-1 flex-col items-center"
                >
                  {b.tag && (
                    <span className="mb-1 rounded-full bg-[#F3E9D2] px-2 py-0.5 text-[10px] font-bold text-[#74520B]">
                      {b.tag}
                    </span>
                  )}
                  {b.isPeak && (
                    <span className="mb-1 text-[10px] font-bold text-[#1E1914]">
                      {b.checkIns}
                    </span>
                  )}
                  <div className="flex h-36 w-full items-end justify-center gap-1">
                    <div
                      className="w-3 rounded-t-md bg-[#C89C42]"
                      style={{ height: `${Math.round((b.checkIns / 180) * 100)}%` }}
                    />
                    <div
                      className="w-3 rounded-t-md bg-[#2F6C3B]"
                      style={{
                        height: `${Math.round((b.redemptions / 180) * 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={`mt-2 text-[11px] ${
                      b.isPeak
                        ? 'font-bold text-[#1E1914]'
                        : 'font-medium text-[#7A7065]'
                    }`}
                  >
                    {b.hour}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#FAF6EE] px-4 py-3 text-xs">
              <span className="text-[#4E463E]">
                💡 <strong>Insight:</strong> às 19h há 2,4× mais resgates de ofertas gastronômicas que a média do dia.
              </span>
              <button
                type="button"
                onClick={() =>
                  showToast('Relatório detalhado de horários de pico carregado.')
                }
                className="font-bold text-[#74520B] hover:underline"
              >
                Ver detalhes ›
              </button>
            </div>
          </section>

          <section className="col-span-5 rounded-[28px] border border-[#EAE3D5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-2xl font-bold text-[#1E1914]">
                Lojas mais engajadas
              </h2>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#5A5248]">
                TOP 4
              </span>
            </div>
            <p className="mt-1 text-xs text-[#7A7065]">
              Leituras do passaporte e faturamento atribuído, por loja.
            </p>

            <div className="mt-5 space-y-3">
              {DESKTOP_ENGAGED_STORES.map((st) => (
                <div
                  key={st.rank}
                  className="flex items-center justify-between rounded-2xl bg-[#FAF6EE] px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                        st.isTop
                          ? 'bg-[#F3E2BA] text-[#74520B]'
                          : 'bg-[#E9E2D6] text-[#4E463E]'
                      }`}
                    >
                      {st.rank}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#1E1914]">
                        {st.name}
                      </p>
                      <p className="text-[11px] text-[#7A7065]">{st.sub}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#1E1914]">
                      {st.checkIns}
                    </p>
                    <p className="text-[11px] font-bold text-[#256B30]">
                      {st.coupons}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="text-[#7A7065]">
                Total de 118 operações ativas
              </span>
              <button
                type="button"
                onClick={() => setAdminTab('STORES')}
                className="font-bold text-[#74520B] hover:underline"
              >
                Ver todas as lojas ›
              </button>
            </div>
          </section>
        </div>

        {/* Seção Inferior: Gestão Operacional */}
        <section>
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-[#74520B]">
            <span className="h-2 w-2 rounded-full bg-[#74520B]" />
            GESTÃO OPERACIONAL
          </div>
          <h2 className="mt-1 font-headline text-3xl font-bold text-[#1E1914]">
            Lojas, totens e moderação
          </h2>
          <p className="mt-1 text-xs text-[#7A7065]">
            Credenciamento, QR codes dos totens e fila de moderação.
          </p>

          {/* 4 Abas Operacionais */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setAdminTab('STORES')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition ${
                adminTab === 'STORES'
                  ? 'bg-[#74520B] text-white shadow-sm'
                  : 'border border-[#E6DFD3] bg-white text-[#4E463E]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                storefront
              </span>
              Lojas e caixas
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('QR')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition ${
                adminTab === 'QR'
                  ? 'bg-[#74520B] text-white shadow-sm'
                  : 'border border-[#E6DFD3] bg-white text-[#4E463E]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                qr_code_2
              </span>
              Gerador de QR code
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('MODERATION')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition ${
                adminTab === 'MODERATION'
                  ? 'bg-[#74520B] text-white shadow-sm'
                  : 'border border-[#E6DFD3] bg-white text-[#4E463E]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                shield
              </span>
              Fila de moderação
              <span className="ml-1 rounded-full bg-[#C92A2A] px-2 py-0.5 text-[10px] font-extrabold text-white">
                {pendingCampaigns.length || 2}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('RULES')}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition ${
                adminTab === 'RULES'
                  ? 'bg-[#74520B] text-white shadow-sm'
                  : 'border border-[#E6DFD3] bg-white text-[#4E463E]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                tune
              </span>
              Regras de pontuação
            </button>
          </div>

          {/* Conteúdo da Aba Selecionada no Desktop */}
          {adminTab === 'STORES' && (
            <div className="mt-5 rounded-[28px] border border-[#EAE3D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F3E9D2] text-[#74520B]">
                    <span className="material-symbols-outlined text-[20px]">
                      badge
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline text-xl font-bold text-[#1E1914]">
                      Credenciamento de lojistas e operadores de caixa
                    </h3>
                    <p className="text-xs text-[#7A7065]">
                      Libere o acesso de leitura de pontos aos caixas das lojas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewStoreModal(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#74520B] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#5E4108]"
                >
                  + Cadastrar novo lojista
                </button>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#EFE9DC]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6EE] text-[10px] font-extrabold uppercase tracking-wider text-[#7A7065]">
                    <tr>
                      <th className="px-5 py-3.5">LOJA / RAZÃO SOCIAL</th>
                      <th className="px-5 py-3.5">CNPJ · LOCALIZAÇÃO</th>
                      <th className="px-5 py-3.5">CAIXAS</th>
                      <th className="px-5 py-3.5">SITUAÇÃO</th>
                      <th className="px-5 py-3.5 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE9DC] bg-white">
                    <tr>
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#1E1914]">
                          Café Exemplo Palmas Ltda.
                        </p>
                        <p className="text-[11px] text-[#7A7065]">
                          cafe-exemplo.palmas@shopping.com.br
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#1E1914]">
                          12.345.678/0001-90
                        </p>
                        <p className="text-[11px] text-[#7A7065]">
                          Piso L2 · Loja 114
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#1E1914]">
                        🏪 4 caixas
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#EBF5ED] px-3 py-1 text-[11px] font-bold text-[#256B30]">
                          ✓ CNPJ validado
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              'Credenciais POS de Café Exemplo redefinidas!'
                            )
                          }
                          className="rounded-full border border-[#D8CEBE] px-4 py-1.5 text-xs font-bold text-[#1E1914] hover:bg-[#FAF6EE]"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#1E1914]">
                          Restaurante Grill Exemplo S.A.
                        </p>
                        <p className="text-[11px] text-[#7A7065]">
                          operacao@exemplo.com.br
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#1E1914]">
                          12.345.678/0002-71
                        </p>
                        <p className="text-[11px] text-[#7A7065]">
                          Piso L2 · Espaço Gourmet 01
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#1E1914]">
                        🏪 8 caixas
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#EBF5ED] px-3 py-1 text-[11px] font-bold text-[#256B30]">
                          ✓ CNPJ validado
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              'Credenciais POS de Grill Exemplo redefinidas!'
                            )
                          }
                          className="rounded-full border border-[#D8CEBE] px-4 py-1.5 text-xs font-bold text-[#1E1914] hover:bg-[#FAF6EE]"
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#1E1914]">
                          Joalheria Exemplo Ltda.
                        </p>
                        <p className="text-[11px] text-[#7A7065]">
                          joias@exemplo.com.br
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#1E1914]">
                          12.345.678/0003-52
                        </p>
                        <p className="text-[11px] text-[#7A7065]">
                          Piso L1 · Quiosque Q-09
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#1E1914]">
                        🏪 2 caixas
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#FBF2DA] px-3 py-1 text-[11px] font-bold text-[#8A5A00]">
                          🕒 Aguardando contrato
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            showToast(
                              'Contrato de Joalheria Exemplo aprovado e caixas liberados!'
                            )
                          }
                          className="rounded-full border border-[#74520B] px-4 py-1.5 text-xs font-bold text-[#74520B] hover:bg-[#FAF6EE]"
                        >
                          Revisar contrato
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {adminTab === 'QR' && (
            <div className="mt-5 grid grid-cols-2 gap-6 rounded-[28px] border border-[#EAE3D5] bg-white p-6 shadow-sm">
              <div className="rounded-3xl bg-[#F2EBDD] p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#74520B] font-headline text-lg font-bold text-white">
                  PD
                </div>
                <p className="mt-2 font-headline text-2xl font-bold text-[#74520B]">
                  Passe Dourado
                </p>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#6E655A]">
                  TOTEM OFICIAL DE PRESENÇA
                </p>
                <div className="mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
                  <PasseDouradoLogo size={64} variant="badge" />
                </div>
                <p className="mt-3 text-xs font-bold text-[#256B30]">
                  ☆ Escaneie e ganhe +10 pts
                </p>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="font-headline text-xl font-bold text-[#1E1914]">
                    Configuração de Raio & Impressão A4
                  </h3>
                  <p className="mt-1 text-xs text-[#7A7065]">
                    Defina a distância máxima permitida a partir do totem físico.
                  </p>
                  <select
                    value={geofenceRadius}
                    onChange={(e) =>
                      handleUpdateGeofence(Number(e.target.value))
                    }
                    className="mt-4 w-full rounded-xl border border-[#DFD7C8] bg-[#FAF6EE] px-4 py-3 text-sm font-bold text-[#1E1914]"
                  >
                    <option value={150}>150 m (restrito)</option>
                    <option value={250}>250 m (padrão)</option>
                    <option value={400}>400 m (estacionamento)</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 rounded-full bg-[#74520B] py-3 text-xs font-bold text-white"
                  >
                    📄 Baixar PDF (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      showToast('Arte PNG em alta resolução baixada!')
                    }
                    className="flex-1 rounded-full border border-[#74520B] py-3 text-xs font-bold text-[#74520B]"
                  >
                    🖼️ Baixar PNG
                  </button>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'MODERATION' && (
            <div className="mt-5 rounded-[28px] border border-[#EAE3D5] bg-white p-6 shadow-sm">
              <h3 className="font-headline text-xl font-bold text-[#1E1914]">
                Fila de aprovação ({pendingCampaigns.length} pendentes)
              </h3>
              <div className="mt-4 space-y-3">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="flex items-center justify-between rounded-2xl border border-[#EAE3D5] bg-[#FAF6EE] p-4"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#74520B]">
                        {camp.storeName ?? 'BLACK FRIDAY ANTECIPADA'}
                      </span>
                      <p className="font-headline text-base font-bold text-[#1E1914]">
                        {camp.title}
                      </p>
                      <p className="text-xs text-[#7A7065]">
                        {camp.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleModerateCampaign(camp.id, 'APPROVED')
                        }
                        className="rounded-full bg-[#256B30] px-4 py-2 text-xs font-bold text-white"
                      >
                        ✓ Aprovar oferta
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleModerateCampaign(camp.id, 'REJECTED')
                        }
                        className="rounded-full border border-[#C92A2A] px-4 py-2 text-xs font-bold text-[#C92A2A]"
                      >
                        ✕ Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminTab === 'RULES' && (
            <div className="mt-5 rounded-[28px] border border-[#EAE3D5] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-xl font-bold text-[#1E1914]">
                  Banners do app & Regras de Pontos
                </h3>
                <button
                  type="button"
                  onClick={handleSwapBanners}
                  className="text-xs font-bold text-[#74520B] underline"
                >
                  Reordenar
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {bannersOrder.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 rounded-2xl bg-[#FAF6EE] p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#74520B] text-xs font-bold text-white">
                      {b.id}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#1E1914]">
                        {b.title}
                      </p>
                      <p className="text-xs text-[#256B30]">{b.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ===================================================================== */}
      {/* MOBILE VIEW (adm/Passe-Dourado-admin.png)                             */}
      {/* ===================================================================== */}
      <div className="lg:hidden space-y-6">
        {/* Cabeçalho Mobile */}
        <header>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#74520B]">
                PASSE DOURADO · ADMIN GERAL
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#5A5248]">
                <span className="h-2 w-2 rounded-full bg-[#256B30]" />
                Sistema operacional · tempo real
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                showToast('Central de alertas operacionais sincronizada.')
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EAE3D5] bg-white text-[#1E1914] shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">
                notifications
              </span>
            </button>
          </div>

          <h1 className="mt-3 font-headline text-3xl font-bold text-[#1E1914]">
            Supervisão do Shopping
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-[#6E655A]">
            Fidelidade, check-ins nos totens e movimento das lojas em um só lugar.
          </p>

          {/* Seletor Hoje / 7 dias / Mês */}
          <div className="mt-4 grid grid-cols-3 rounded-full border border-[#EAE3D5] bg-white p-1 shadow-sm">
            {(
              [
                { id: 'TODAY', label: 'Hoje' },
                { id: '7D', label: '7 dias' },
                { id: 'MONTH', label: 'Mês' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`rounded-full py-2 text-xs font-bold transition ${
                  period === p.id
                    ? 'bg-[#74520B] text-white shadow-sm'
                    : 'text-[#1E1914]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </header>

        {/* 4 KPI Cards + Barra de Cupons usados no caixa */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A5248]">
                CADASTRADOS
              </p>
              <p className="mt-1 font-headline text-3xl font-bold text-[#1E1914]">
                14.820
              </p>
              <p className="mt-1 text-[11px] font-bold text-[#256B30]">
                +12% no mês
              </p>
            </div>

            <div className="rounded-[22px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A5248]">
                ATIVOS (70 DIAS)
              </p>
              <p className="mt-1 font-headline text-3xl font-bold text-[#1E1914]">
                3.490
              </p>
              <p className="mt-1 text-[11px] text-[#6E655A]">
                Retorno: <strong className="text-[#74520B]">41%</strong>
              </p>
            </div>

            <div className="rounded-[22px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A5248]">
                CHECK-INS DO DIA
              </p>
              <p className="mt-1 font-headline text-3xl font-bold text-[#1E1914]">
                684
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[#6E655A]">
                Leituras em totens e lojas
              </p>
            </div>

            <div className="rounded-[22px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A5248]">
                CONVERSÃO
              </p>
              <p className="mt-1 font-headline text-3xl font-bold text-[#256B30]">
                77,7%
              </p>
              <p className="mt-1 text-[11px] text-[#6E655A]">
                692 de 890 cupons
              </p>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1E1914]">Cupons usados no caixa</span>
              <span className="text-[#256B30]">692 usados</span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#EFE9DC]">
              <div
                className="h-full rounded-full bg-[#256B30]"
                style={{ width: '77.7%' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[#6E655A]">890 emitidos no app</span>
              <span className="font-bold text-[#74520B]">198 em aberto</span>
            </div>
          </div>
        </section>

        {/* Check-ins por horário */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold text-[#1E1914]">
              Check-ins por horário
            </h2>
            <span className="rounded-full bg-[#F3E9D2] px-3 py-1 text-[11px] font-bold text-[#74520B]">
              Hoje
            </span>
          </div>

          <div className="rounded-[24px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
            <div className="flex h-36 items-end justify-between gap-2 pt-4">
              {MOBILE_HOURLY_BARS.map((bar) => (
                <div
                  key={bar.hour}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <span
                    className={`text-[10px] font-bold ${
                      bar.isPeak ? 'text-[#74520B]' : 'text-[#6E655A]'
                    }`}
                  >
                    {bar.count}
                  </span>
                  <div className="flex h-24 w-full items-end">
                    <div
                      className={`w-full rounded-xl ${
                        bar.isPeak ? 'bg-[#74520B]' : 'bg-[#E5DEC9]'
                      }`}
                      style={{ height: `${bar.pct}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] ${
                      bar.isPeak
                        ? 'font-extrabold text-[#1E1914]'
                        : 'font-medium text-[#6E655A]'
                    }`}
                  >
                    {bar.hour}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl bg-[#F5F0E6] p-3 text-xs text-[#4E463E]">
              <p>
                Horários de pico: <strong className="text-[#1E1914]">12h–14h</strong> e{' '}
                <strong className="text-[#1E1914]">19h–21h</strong>
              </p>
              <p className="mt-0.5">
                Totens ativos: <strong className="text-[#256B30]">100%</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Locais mais visitados */}
        <section>
          <h2 className="font-headline text-xl font-bold text-[#1E1914]">
            Locais mais visitados
          </h2>
          <p className="text-xs text-[#6E655A]">Check-ins nos totens</p>

          <div className="mt-3 space-y-2.5 rounded-[24px] border border-[#EAE3D5] bg-white p-3.5 shadow-sm">
            {MOBILE_TOP_LOCATIONS.map((loc) => (
              <div
                key={loc.rank}
                className="flex items-center justify-between rounded-2xl bg-[#F5F0E6] px-3.5 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      loc.isTop
                        ? 'bg-[#F3E2BA] text-[#74520B]'
                        : 'bg-[#E6DFD3] text-[#4E463E]'
                    }`}
                  >
                    {loc.rank}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#1E1914]">
                      {loc.name}
                    </p>
                    <p className="text-[11px] text-[#6E655A]">{loc.sub}</p>
                  </div>
                </div>
                <span
                  className={`font-headline text-lg font-bold ${
                    loc.isTop ? 'text-[#74520B]' : 'text-[#1E1914]'
                  }`}
                >
                  {loc.count}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Fila de aprovação */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold text-[#1E1914]">
              Fila de aprovação
            </h2>
            <span className="rounded-full bg-[#F3E9D2] px-3 py-1 text-[11px] font-bold text-[#74520B]">
              {pendingCampaigns.length || 2} pendentes
            </span>
          </div>

          {activeModerationCampaign && (
            <div className="rounded-[24px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#BA9446] text-white">
                  <span className="material-symbols-outlined text-[24px]">
                    image
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#74520B]">
                    BLACK FRIDAY ANTECIPADA
                  </p>
                  <p className="font-headline text-base font-bold text-[#1E1914]">
                    Café Exemplo · 20% OFF
                  </p>
                  <p className="text-xs text-[#6E655A]">
                    Combo Doce de Leite + Cappuccino
                  </p>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-2 rounded-2xl bg-[#F5F0E6] p-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#6E655A]">Válido até</span>
                  <p className="font-bold text-[#1E1914]">30/nov</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#6E655A]">Estoque</span>
                  <p className="font-bold text-[#1E1914]">250 vouchers</p>
                </div>
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleModerateCampaign(
                      activeModerationCampaign.id,
                      'APPROVED'
                    )
                  }
                  className="flex items-center justify-center gap-1.5 rounded-full bg-[#256B30] py-3 text-xs font-bold text-white shadow-sm"
                >
                  ✓ Aprovar oferta
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleModerateCampaign(
                      activeModerationCampaign.id,
                      'REJECTED'
                    )
                  }
                  className="flex items-center justify-center gap-1.5 rounded-full border border-[#C92A2A] bg-white py-3 text-xs font-bold text-[#C92A2A]"
                >
                  ✕ Recusar
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() =>
                showToast(
                  `${campaigns.length} campanhas registradas no histórico de moderação.`
                )
              }
              className="text-xs font-bold text-[#74520B] underline"
            >
              Ver histórico ›
            </button>
          </div>
        </section>

        {/* Banners do app */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold text-[#1E1914]">
              Banners do app
            </h2>
            <button
              type="button"
              onClick={handleSwapBanners}
              className="text-xs font-bold text-[#74520B] underline"
            >
              Reordenar
            </button>
          </div>

          <div className="space-y-2.5 rounded-[24px] border border-[#EAE3D5] bg-white p-3.5 shadow-sm">
            {bannersOrder.map((b, idx) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-2xl bg-[#F5F0E6] p-3.5"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${
                    idx === 0
                      ? 'bg-[#74520B] text-white'
                      : 'bg-[#DFD7C8] text-[#1E1914]'
                  }`}
                >
                  {b.id}
                </span>
                <div>
                  <p className="text-xs font-bold text-[#1E1914]">{b.title}</p>
                  <p
                    className={`text-[11px] ${
                      idx === 0
                        ? 'font-bold text-[#256B30]'
                        : 'text-[#6E655A]'
                    }`}
                  >
                    {b.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lojas e credenciais */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold text-[#1E1914]">
              Lojas e credenciais
            </h2>
            <button
              type="button"
              onClick={() => setShowNewStoreModal(true)}
              className="rounded-full bg-[#74520B] px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              + Nova loja
            </button>
          </div>

          <div className="relative mb-3">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-[#7A7065]">
              search
            </span>
            <input
              type="search"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              placeholder="Buscar loja, piso ou login"
              className="w-full rounded-2xl border border-[#EAE3D5] bg-white py-3 pl-10 pr-4 text-xs text-[#1E1914] placeholder:text-[#8C8275]"
            />
          </div>

          <div className="space-y-3">
            {[
              {
                initial: 'C',
                name: 'Café Exemplo',
                sub: 'Piso L2 · 3 caixas operando',
                user: 'lojista_cafe',
              },
              {
                initial: 'G',
                name: 'Grill Exemplo',
                sub: 'Piso L1 · 6 caixas operando',
                user: 'lojista_grill',
              },
              {
                initial: 'C',
                name: 'Choco Exemplo',
                sub: 'Piso L1 · 2 caixas operando',
                user: 'lojista_choco',
              },
            ]
              .filter((st) => {
                if (!storeSearch.trim()) return true;
                const q = storeSearch.toLowerCase();
                return (
                  st.name.toLowerCase().includes(q) ||
                  st.sub.toLowerCase().includes(q) ||
                  st.user.toLowerCase().includes(q)
                );
              })
              .map((st) => (
                <div
                  key={st.user}
                  className="rounded-[24px] border border-[#EAE3D5] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E2BA] font-headline text-base font-bold text-[#74520B]">
                        {st.initial}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#1E1914]">
                          {st.name}
                        </p>
                        <p className="text-[11px] text-[#6E655A]">{st.sub}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#EBF5ED] px-2.5 py-0.5 text-[10px] font-bold text-[#256B30]">
                      Ativo
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#F5F0E6] px-3.5 py-2.5">
                    <div>
                      <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[#6E655A]">
                        USUÁRIO
                      </span>
                      <code className="font-mono text-xs font-bold text-[#1E1914]">
                        {st.user}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        showToast(
                          `Nova senha de acesso enviada para ${st.name} (${st.user})!`
                        )
                      }
                      className="rounded-full border border-[#74520B] bg-white px-3.5 py-1.5 text-[11px] font-bold text-[#74520B]"
                    >
                      🔑 Redefinir acesso
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Totens e QR Codes */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-headline text-xl font-bold text-[#1E1914]">
              Totens e QR Codes
            </h2>
            <span className="rounded-full bg-[#F3E9D2] px-3 py-1 text-[11px] font-bold text-[#74520B]">
              Totem físico
            </span>
          </div>

          <div className="rounded-[26px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
            {/* Cartão Bege do Totem */}
            <div className="rounded-[22px] bg-[#EFE8D8] p-5 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#74520B] font-headline text-base font-bold text-white">
                PD
              </div>
              <p className="mt-2 font-headline text-2xl font-bold text-[#74520B]">
                Passe Dourado
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#5A5248]">
                TOTEM OFICIAL DE PRESENÇA
              </p>

              {/* QR Code estilizado com estrela central */}
              <div className="mx-auto mt-4 flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
                <svg viewBox="0 0 120 120" className="h-full w-full">
                  <rect
                    x="8"
                    y="8"
                    width="32"
                    height="32"
                    rx="4"
                    fill="none"
                    stroke="#74520B"
                    strokeWidth="6"
                  />
                  <rect
                    x="18"
                    y="18"
                    width="12"
                    height="12"
                    rx="2"
                    fill="#74520B"
                  />
                  <rect
                    x="80"
                    y="8"
                    width="32"
                    height="32"
                    rx="4"
                    fill="none"
                    stroke="#74520B"
                    strokeWidth="6"
                  />
                  <rect
                    x="90"
                    y="18"
                    width="12"
                    height="12"
                    rx="2"
                    fill="#74520B"
                  />
                  <rect
                    x="8"
                    y="80"
                    width="32"
                    height="32"
                    rx="4"
                    fill="none"
                    stroke="#74520B"
                    strokeWidth="6"
                  />
                  <rect
                    x="18"
                    y="90"
                    width="12"
                    height="12"
                    rx="2"
                    fill="#74520B"
                  />
                  {/* Pontos de dados */}
                  <rect x="48" y="12" width="6" height="6" fill="#1E1914" />
                  <rect x="60" y="18" width="6" height="6" fill="#74520B" />
                  <rect x="48" y="28" width="6" height="6" fill="#74520B" />
                  <rect x="14" y="48" width="6" height="6" fill="#1E1914" />
                  <rect x="26" y="54" width="6" height="6" fill="#74520B" />
                  <rect x="86" y="48" width="6" height="6" fill="#74520B" />
                  <rect x="98" y="60" width="6" height="6" fill="#1E1914" />
                  <rect x="52" y="86" width="6" height="6" fill="#74520B" />
                  <rect x="66" y="94" width="6" height="6" fill="#1E1914" />
                  <rect x="84" y="84" width="10" height="10" fill="#74520B" />
                  <rect x="98" y="96" width="8" height="8" fill="#1E1914" />
                  {/* Estrela central */}
                  <circle
                    cx="60"
                    cy="60"
                    r="15"
                    fill="#FAF6EE"
                    stroke="#C89C42"
                    strokeWidth="2"
                  />
                  <path
                    d="M60 49 L63 56 L71 56 L65 61 L67 68 L60 64 L53 68 L55 61 L49 56 L57 56 Z"
                    fill="#74520B"
                  />
                </svg>
              </div>

              <p className="mt-4 text-xs font-bold text-[#256B30]">
                ☆ Escaneie e ganhe +10 pts
              </p>
              <p className="mt-0.5 text-[11px] text-[#6E655A]">
                Válido apenas dentro do perímetro do shopping
              </p>
            </div>

            {/* Raio de validação */}
            <div className="mt-3 rounded-2xl bg-[#F5F0E6] p-3.5">
              <p className="text-xs font-bold text-[#1E1914]">
                Raio de validação
              </p>
              <p className="text-[11px] text-[#6E655A]">
                Distância máxima permitida a partir do totem
              </p>
              <select
                value={geofenceRadius}
                onChange={(e) => handleUpdateGeofence(Number(e.target.value))}
                className="mt-2.5 w-full rounded-xl border border-[#EAE3D5] bg-white px-3.5 py-2.5 text-xs font-bold text-[#1E1914]"
              >
                <option value={150}>150 m (restrito)</option>
                <option value={250}>250 m (padrão)</option>
                <option value={400}>400 m (ampliado)</option>
              </select>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#74520B] py-3 text-xs font-bold text-white shadow-sm"
              >
                📄 Baixar PDF (A4)
              </button>
              <button
                type="button"
                onClick={() =>
                  showToast('Arte PNG do totem oficial baixada!')
                }
                className="flex items-center justify-center gap-1.5 rounded-full border border-[#74520B] bg-white py-3 text-xs font-bold text-[#74520B]"
              >
                🖼️ Baixar PNG
              </button>
            </div>
          </div>
        </section>

        {/* Exportação de auditoria */}
        <section className="rounded-[24px] border border-[#EAE3D5] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3E2BA] text-[#74520B]">
              <span className="material-symbols-outlined text-[20px]">
                receipt_long
              </span>
            </span>
            <div>
              <h2 className="font-headline text-base font-bold text-[#1E1914]">
                Exportação de auditoria
              </h2>
              <p className="text-[11px] text-[#6E655A]">
                Histórico protegido contra fraude
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#6E655A]">
            Gere relatórios completos de cupons usados, check-ins e pontos concedidos para conciliação fiscal e de marketing.
          </p>

          <a
            href="/api/admin/audit/export"
            download
            onClick={() =>
              showToast('Baixando relatório de cupons (CSV)...')
            }
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full border border-[#74520B] bg-white py-3 text-xs font-bold text-[#74520B]"
          >
            ↓ Exportar relatório de cupons (CSV)
          </a>
        </section>
      </div>

      {/* MODAL DE CRIAÇÃO DE NOVA LOJA PARCEIRA */}
      {showNewStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#EAE3D5] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-lg font-extrabold text-[#1E1914]">
                Cadastrar Nova Loja Parceira
              </h3>
              <button
                type="button"
                onClick={() => setShowNewStoreModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF6EE]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#1E1914]">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Ex.: Empório Gourmet Exemplo"
                  className="mt-1 w-full rounded-xl border border-[#DFD7C8] bg-[#FAF6EE] px-3.5 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1914]">
                    Segmento
                  </label>
                  <select
                    value={newStoreCategory}
                    onChange={(e) =>
                      setNewStoreCategory(e.target.value as StoreCategory)
                    }
                    className="mt-1 w-full rounded-xl border border-[#DFD7C8] bg-[#FAF6EE] px-3 py-2.5 text-sm"
                  >
                    <option value="GASTRONOMIA">Gastronomia</option>
                    <option value="MODA">Moda</option>
                    <option value="LAZER">Lazer</option>
                    <option value="BELEZA">Beleza</option>
                    <option value="SERVICOS">Serviços</option>
                    <option value="TECNOLOGIA">Tecnologia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1914]">
                    Pontos por Check-in
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={newStorePoints}
                    onChange={(e) => setNewStorePoints(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#DFD7C8] bg-[#FAF6EE] px-3.5 py-2.5 text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E1914]">
                    Piso
                  </label>
                  <input
                    type="text"
                    value={newStoreFloor}
                    onChange={(e) => setNewStoreFloor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DFD7C8] bg-[#FAF6EE] px-3.5 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E1914]">
                    LUC / Unidade
                  </label>
                  <input
                    type="text"
                    value={newStoreUnit}
                    onChange={(e) => setNewStoreUnit(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DFD7C8] bg-[#FAF6EE] px-3.5 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isSavingStore}
                  className="flex-1 rounded-full bg-[#74520B] py-3 text-xs font-extrabold text-white"
                >
                  {isSavingStore
                    ? 'Gerando QR Token...'
                    : 'Cadastrar & Gerar Token QR'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewStoreModal(false)}
                  className="rounded-full border border-[#DFD7C8] px-4 py-3 text-xs font-bold text-[#6E655A]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IMPRESSÃO DO TOTEM QR CODE */}
      {selectedTotemStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-[#EAE3D5] bg-white p-6 text-center shadow-2xl">
            <span className="rounded-full bg-[#F3E9D2] px-3 py-1 text-[10px] font-extrabold uppercase text-[#74520B]">
              Totem Oficial de Balcão • Passe Dourado
            </span>
            <h3 className="mt-2 font-headline text-xl font-black text-[#1E1914]">
              {selectedTotemStore.name}
            </h3>
            <p className="text-xs text-[#6E655A]">
              {selectedTotemStore.floor} • LUC {selectedTotemStore.unitNumber}
            </p>

            <div className="mx-auto my-5 flex h-48 w-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#74520B] bg-[#FAF6EE] p-4">
              <PasseDouradoLogo size={64} variant="badge" />
              <code className="mt-2 font-mono text-xs font-extrabold text-[#1E1914]">
                {selectedTotemStore.qrCodeToken}
              </code>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 rounded-full bg-[#74520B] py-2.5 text-xs font-extrabold text-white"
              >
                Imprimir Placa A4
              </button>
              <button
                type="button"
                onClick={() => setSelectedTotemStore(null)}
                className="rounded-full border border-[#DFD7C8] px-4 py-2.5 text-xs font-bold text-[#6E655A]"
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
