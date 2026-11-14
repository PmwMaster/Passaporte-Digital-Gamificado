'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  mockMissions,
  mockRewards,
  mockStores,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { Reward, Voucher } from '@/shared/types/domain';

interface HighlightOffer {
  id: string;
  rewardId: string;
  storeName: string;
  storeSlug: string;
  floor: string;
  badgeText: string;
  pointsCost: number;
  title: string;
  description: string;
  priceNow: string;
  priceOld: string;
  pointsHint: string;
}

const HIGHLIGHT_OFFERS: HighlightOffer[] = [
  {
    id: 'hl_01',
    rewardId: 'rew_01',
    storeName: 'Café Exemplo',
    storeSlug: 'cafe-jalapao-gourmet',
    floor: 'Piso L2 · Quiosque',
    badgeText: 'Até 18h · restam 12',
    pointsCost: 80,
    title: 'Café Doce de Leite + Alfajor',
    description:
      'Compre um alfajor de doce de leite 50 g e ganhe o segundo apresentando o seu passaporte digital no balcão.',
    priceNow: 'R$ 22,90',
    priceOld: 'R$ 34,90',
    pointsHint: 'Use 80 pontos e economize R$ 12',
  },
  {
    id: 'hl_02',
    rewardId: 'rew_02',
    storeName: 'Grill Exemplo',
    storeSlug: 'tech-house-palmas',
    floor: 'Piso L2 · Gourmet',
    badgeText: 'Cortesia especial · 80 pts',
    pointsCost: 60,
    title: 'Cebola Crocante ou Asinhas Grelhadas',
    description:
      'Na compra de qualquer prato principal, ganhe uma entrada icônica cortesia pelo passaporte digital.',
    priceNow: 'R$ 29,90',
    priceOld: 'R$ 54,90',
    pointsHint: 'Use 60 pontos e economize R$ 25',
  },
  {
    id: 'hl_03',
    rewardId: 'rew_04',
    storeName: 'Cinema Lumière',
    storeSlug: 'cine-capim-dourado-vip',
    floor: 'Piso L3 · Lazer',
    badgeText: 'Upgrade VIP · 60 pts',
    pointsCost: 60,
    title: 'Pipoca Grande Trufada + refil',
    description:
      'Resgate 50% de desconto no combo premium com pipoca com azeite trufado para qualquer sessão 2D/3D.',
    priceNow: 'R$ 19,90',
    priceOld: 'R$ 39,80',
    pointsHint: 'Use 60 pontos e economize R$ 19,90',
  },
];

export default function PublicStorefrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentPoints, setCurrentPoints] = useState<number>(
    mockVisitorProfile.currentPoints
  );
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);
  const [selectedOfferModal, setSelectedOfferModal] =
    useState<HighlightOffer | null>(null);
  const [emittedVoucher, setEmittedVoucher] = useState<Voucher | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [infoModal, setInfoModal] = useState<'EVENTS' | 'HOW_IT_WORKS' | null>(
    null
  );
  const [showPwaPrompt, setShowPwaPrompt] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadLive() {
      try {
        const [ptsRes, rewRes] = await Promise.all([
          fetch('/api/visitor/points', { cache: 'no-store' }),
          fetch('/api/rewards', { cache: 'no-store' }),
        ]);
        const ptsJson = await ptsRes.json();
        if (ptsJson?.success && typeof ptsJson.data?.currentPoints === 'number') {
          setCurrentPoints(ptsJson.data.currentPoints);
        }
        const rewJson = await rewRes.json();
        if (rewJson?.success && Array.isArray(rewJson.data?.rewards)) {
          setRewards(rewJson.data.rewards);
        }
      } catch {
        // Fallback local
      }
    }
    loadLive();
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 4000);
  }

  async function handleConfirmRedeem(offer: HighlightOffer) {
    setIsRedeeming(true);
    try {
      const targetReward =
        rewards.find((r) => r.id === offer.rewardId) ?? rewards[0];
      const res = await fetch(`/api/rewards/${targetReward.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: `idem_home_${offer.id}_${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentPoints(json.data.remainingPoints);
        window.dispatchEvent(new Event('passport:points-updated'));
        setSelectedOfferModal(null);
        setEmittedVoucher(json.data.voucher);
      } else {
        showToast(json.error?.message ?? 'Saldo insuficiente para resgate.');
      }
    } catch {
      showToast('Erro de comunicação ao gerar voucher.');
    } finally {
      setIsRedeeming(false);
    }
  }

  const filteredStores = useMemo(() => {
    return mockStores.filter((store) => {
      const matchesCat =
        selectedCategory === 'ALL' || store.category === selectedCategory;
      const matchesQuery =
        !searchQuery.trim() ||
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.floor.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const activeMission =
    mockMissions.find((m) => m.status === 'IN_PROGRESS') ?? mockMissions[0];
  const missionPct = Math.min(
    100,
    Math.round((activeMission.currentCount / activeMission.targetCount) * 100)
  );
  const pointsProgressPct = Math.min(
    100,
    Math.round((currentPoints / 200) * 100)
  );
  const missingPoints = Math.max(0, 200 - currentPoints);

  return (
    <div className="space-y-7 pb-8">
      {/* Toast Flutuante */}
      {toastMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-[#256B30]/30 bg-[#E6F2E8] px-4 py-3 text-xs font-bold text-[#1D5726]">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)}>
            ✕
          </button>
        </div>
      )}

      {/* ====================================================================
          MOBILE HERO: SAUDAÇÃO + CARTÃO DOURADO SÓLIDO (Conforme 1-inicio.png)
          ==================================================================== */}
      <section className="lg:hidden space-y-3">
        <div>
          <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#74520B]">
            PASSE DOURADO
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1F1A11]">
            Olá, Mariana
          </h1>
        </div>

        <div className="rounded-3xl bg-[#74520B] p-5 text-white shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white/90">Seus pontos</span>
            <Link
              href="/passaporte?tab=statement"
              className="font-bold underline underline-offset-4 hover:text-[#EFE4C8]"
            >
              Extrato
            </Link>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-5xl font-bold leading-none">
              {currentPoints}
            </span>
            <span className="text-lg font-medium text-white/90">pontos</span>
          </div>

          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${pointsProgressPct}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-white/90">
            {missingPoints > 0
              ? `Faltam ${missingPoints} pontos para o próximo prêmio`
              : 'Você já pode resgatar qualquer prêmio do catálogo!'}
          </p>

          <Link
            href="/checkin"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-extrabold text-[#74520B] shadow-sm active:scale-98 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">
              qr_code_scanner
            </span>
            Escanear QR Code
          </Link>
        </div>
      </section>

      {/* ====================================================================
          DESKTOP HERO: DOCE NATAL & MOMENTOS EXCLUSIVOS (Conforme Desktop 1-inicio)
          ==================================================================== */}
      <section className="hidden lg:block space-y-6">
        {/* Faixa de Campanha no Topo */}
        <div className="flex items-center justify-between rounded-2xl bg-[#EFE4C8]/75 px-5 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-[#4A3810]">
            <span className="material-symbols-outlined text-[16px] text-[#74520B]">
              campaign
            </span>
            <span>
              <strong>Campanha especial:</strong> visite 3 lojas hoje no piso L1
              e desbloqueie um voucher cortesia no Café Exemplo.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E1F3E4] px-3 py-1 text-[11px] font-bold text-[#1D6329]">
              <span className="h-2 w-2 rounded-full bg-[#256B30]" />
              Check-in disponível agora
            </span>
            <span className="text-[#5A5243] font-medium">
              🕒 Aberto hoje até 22h
            </span>
          </div>
        </div>

        {/* Grid Hero Desktop */}
        <div className="grid grid-cols-12 items-center gap-8 rounded-3xl border border-[#E6DFCE] bg-[#F6F1E5] p-8">
          <div className="col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE4C8] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#74520B]">
              ☆ Temporada Ouro · Passaporte Digital
            </span>
            <h1 className="font-serif text-5xl font-bold leading-[1.1] text-[#1F1A11]">
               Sabores &{' '}
              <span className="text-[#74520B]">Momentos Exclusivos</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-[#5A5243]">
              Viva a elegância do cerrado com recompensas reais. Faça check-in
              pelo celular, acumule selos dourados a cada visita e transforme
              pontos em experiências gastronômicas exclusivas.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/checkin"
                className="flex items-center gap-2 rounded-full bg-[#74520B] px-6 py-3.5 text-xs font-extrabold text-white shadow-sm hover:opacity-95"
              >
                <span className="material-symbols-outlined text-[18px]">
                  qr_code_scanner
                </span>
                Escanear QR nas lojas
              </Link>
              <a
                href="#ofertas-do-dia"
                className="flex items-center gap-2 rounded-full border border-[#D8CEB8] bg-white px-6 py-3.5 text-xs font-extrabold text-[#1F1A11] hover:bg-[#FAF6EE]"
              >
                <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                  sell
                </span>
                Ver ofertas do dia
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="rounded-2xl border border-[#E6DFCE] bg-white p-3">
                <span className="block text-xs font-extrabold text-[#1F1A11]">
                  ⚡ +50 pts
                </span>
                <span className="text-[11px] text-[#6E6556]">
                  no cadastro inicial
                </span>
              </div>
              <div className="rounded-2xl border border-[#E6DFCE] bg-white p-3">
                <span className="block text-xs font-extrabold text-[#1F1A11]">
                  📍 Até 250 m
                </span>
                <span className="text-[11px] text-[#6E6556]">
                  raio de check-in
                </span>
              </div>
              <div className="rounded-2xl border border-[#E6DFCE] bg-white p-3">
                <span className="block text-xs font-extrabold text-[#1F1A11]">
                  % Até 40% OFF
                </span>
                <span className="text-[11px] text-[#6E6556]">
                  resgate imediato
                </span>
              </div>
            </div>
          </div>

          {/* Card Dourado à Direita */}
          <div className="col-span-5">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#C8A25A] via-[#B48838] to-[#74520B] p-6 shadow-lg">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#1F1A11] shadow-sm">
                <span className="text-[#74520B]">☆</span> Membro Ouro · Mariana
                Silva ({currentPoints} pts)
              </div>

              <div className="my-8 flex h-28 items-center justify-center">
                <div className="flex h-20 w-24 items-center justify-center rounded-2xl border-2 border-white/35 bg-white/15 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-4xl text-white/80">
                    image
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#74520B] text-white">
                    <span className="material-symbols-outlined text-[20px]">
                      redeem
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-extrabold uppercase tracking-wider text-[#74520B]">
                      Destaque da Confeitaria
                    </span>
                    <p className="font-sans text-xs font-extrabold text-[#1F1A11]">
                      Petit Gâteau · Choco Exemplo
                    </p>
                    <span className="text-[11px] text-[#6E6556]">
                      Resgate cortesia com 120 pontos
                    </span>
                  </div>
                </div>
                <Link
                  href="/lojas/gelateria-sol-de-palmas"
                  className="rounded-full bg-[#EFE4C8] px-3.5 py-2 text-[11px] font-extrabold text-[#74520B] hover:bg-[#E5D4AD]"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SEÇÃO: OFERTAS DO DIA (Conforme 1-inicio.png e Desktop)
          ==================================================================== */}
      <section id="ofertas-do-dia" className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="hidden lg:block text-[10px] font-extrabold uppercase tracking-widest text-[#74520B]">
              ● Resgates mais procurados
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
              Ofertas do dia
            </h2>
          </div>
          <Link
            href="/recompensas"
            className="text-xs font-extrabold text-[#74520B] underline underline-offset-4"
          >
            Ver todas as ofertas
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {HIGHLIGHT_OFFERS.map((offer) => (
            <article
              key={offer.id}
              className="overflow-hidden rounded-3xl border border-[#E6DFCE] bg-white shadow-sm transition hover:shadow-md flex flex-col justify-between"
            >
              {/* Cabeçalho Dourado Ilustrativo (Conforme 1-inicio.png) */}
              <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-[#DFB766] via-[#CEA045] to-[#B07E20]">
                <div className="flex h-16 w-20 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/15">
                  <span className="material-symbols-outlined text-4xl text-white/75">
                    image
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-[#3A2907]/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[14px]">
                    schedule
                  </span>
                  {offer.badgeText}
                </div>
                <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-extrabold text-[#74520B] shadow-sm">
                  ☆ {offer.pointsCost} pts
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6E6556]">
                    <span className="font-semibold">{offer.storeName}</span>
                    <span className="text-[11px]">{offer.floor}</span>
                  </div>
                  <h3 className="mt-1 font-sans text-base font-extrabold text-[#1F1A11]">
                    {offer.title}
                  </h3>
                  <p className="mt-1 hidden lg:block text-xs text-[#6E6556] line-clamp-2">
                    {offer.description}
                  </p>
                </div>

                <div className="mt-3 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-xl font-black text-[#74520B]">
                        {offer.priceNow}
                      </span>
                      <span className="text-xs text-[#8C8270] line-through">
                        {offer.priceOld}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOfferModal(offer)}
                      className="rounded-full bg-[#256B30] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#1E5827] active:scale-95"
                    >
                      Resgatar
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-[#5A5243]">
                    {offer.pointsHint}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ====================================================================
          BOTÕES DUPLOS MOBILE: EVENTOS & COMO FUNCIONA (Conforme 1-inicio.png)
          ==================================================================== */}
      <section className="grid grid-cols-2 gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setInfoModal('EVENTS')}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#E6DFCE] bg-white py-3.5 text-xs font-bold text-[#1F1A11] shadow-sm active:scale-98"
        >
          <span className="material-symbols-outlined text-[20px] text-[#74520B]">
            calendar_today
          </span>
          Eventos
        </button>
        <button
          type="button"
          onClick={() => setInfoModal('HOW_IT_WORKS')}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#E6DFCE] bg-white py-3.5 text-xs font-bold text-[#1F1A11] shadow-sm active:scale-98"
        >
          <span className="material-symbols-outlined text-[20px] text-[#74520B]">
            info
          </span>
          Como funciona
        </button>
      </section>

      {/* ====================================================================
          BUSCA + FILTROS DE CATEGORIA + LOJAS PARCEIRAS (Conforme 1-inicio.png)
          ==================================================================== */}
      <section className="space-y-4">
        {/* Barra de Busca */}
        <div className="relative">
          <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#6E6556]">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar loja ou cupom"
            className="w-full rounded-full border border-[#E2DAC6] bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-[#1F1A11] placeholder-[#8C8270] shadow-sm focus:border-[#74520B] focus:outline-none"
          />
        </div>

        {/* Pílulas de Categoria */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'GASTRONOMIA', label: 'Comer' },
            { id: 'MODA', label: 'Moda' },
            { id: 'LAZER', label: 'Lazer' },
            { id: 'BELEZA', label: 'Serviços' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold transition ${
                selectedCategory === cat.id
                  ? 'bg-[#74520B] text-white shadow-sm'
                  : 'border border-[#E2DAC6] bg-white text-[#1F1A11] hover:bg-[#F3ECE0]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lojas Parceiras (Círculos Conforme 1-inicio.png) */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
              Lojas parceiras
            </h2>
            <Link
              href="/lojas/cafe-jalapao-gourmet"
              className="text-xs font-extrabold text-[#74520B] underline underline-offset-4"
            >
              Ver todas as lojas
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-7">
            {filteredStores.map((store, index) => {
              const initials = store.name
                .split(' ')
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const isHighlighted = index === 0;
              return (
                <Link
                  key={store.id}
                  href={`/lojas/${store.slug}`}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative">
                    <span className="absolute -top-1.5 right-0 z-10 rounded-full bg-[#256B30] px-2 py-0.5 text-[9px] font-extrabold text-white shadow-sm">
                      +{store.checkInPoints} pts
                    </span>
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition group-hover:scale-105 ${
                        isHighlighted
                          ? 'border-[#74520B] bg-gradient-to-b from-[#B48838] to-[#74520B] text-white shadow-md'
                          : 'border-[#E6DFCE] bg-white text-[#74520B] shadow-sm'
                      }`}
                    >
                      {isHighlighted ? (
                        <span className="font-serif text-base font-bold">
                          {initials}
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[24px]">
                          storefront
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="mt-2 text-xs font-bold text-[#1F1A11] leading-tight">
                    {store.name}
                  </span>
                </Link>
              );
            })}

            <Link
              href="/checkin"
              className="flex flex-col items-center text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFE4C8] font-sans text-sm font-extrabold text-[#74520B]">
                140+
              </div>
              <span className="mt-2 text-xs font-bold text-[#1F1A11]">
                Todas
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ====================================================================
          BANNER DE MISSÕES DO PASSAPORTE (Desktop & Mobile)
          ==================================================================== */}
      <section className="rounded-3xl bg-[#74520B] p-6 text-white shadow-md lg:p-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-[#EFE4C8]">
              ● Você está no shopping · check-in liberado
            </span>
            <h2 className="font-serif text-2xl font-bold leading-snug sm:text-3xl">
              Ganhe pontos visitando o shopping agora mesmo!
            </h2>
            <p className="text-xs text-white/85 leading-relaxed">
              Aponte a câmera para os totens dourados nos corredores ou apresente o leitor nos caixas parceiros. Cada check-in valida sua presença e libera novos benefícios.
            </p>
            <div className="pt-1">
              <Link
                href="/checkin"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-extrabold text-[#74520B] shadow-sm hover:bg-[#FAF6EE]"
              >
                <span className="material-symbols-outlined text-[18px]">
                  photo_camera
                </span>
                Escanear QR code com a câmera
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#EFE4C8]">
                🏆 Missões de Hoje
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold text-[#74520B]">
                +{activeMission.rewardPoints} pts de bônus
              </span>
            </div>
            <div className="mt-3 rounded-xl bg-white/10 p-3.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{activeMission.title}</span>
                <span>
                  {activeMission.currentCount} de {activeMission.targetCount}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-white/80">
                {activeMission.description}
              </p>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-black/25">
                <div
                  className="h-full rounded-full bg-[#4ADE80]"
                  style={{ width: `${missionPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          BANNER PWA: ADICIONE À TELA INICIAL (Conforme 1-inicio.png)
          ==================================================================== */}
      {showPwaPrompt && (
        <section className="relative flex items-center justify-between gap-3 rounded-3xl border border-[#E2D6B5] bg-[#EFE4C8]/80 p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setShowPwaPrompt(false)}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#E2D6B5] bg-white text-xs font-bold text-[#5A5243] shadow"
            aria-label="Fechar aviso"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#74520B]/30 bg-white text-[#74520B]">
              <span className="material-symbols-outlined text-[22px]">
                add_to_home_screen
              </span>
            </div>
            <div>
              <h3 className="font-sans text-sm font-extrabold text-[#1F1A11]">
                Adicione à tela inicial
              </h3>
              <p className="text-xs text-[#5A5243]">Abra com um toque</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              showToast(
                'Passe Dourado configurado para acesso rápido na tela inicial!'
              );
              setShowPwaPrompt(false);
            }}
            className="rounded-full border border-[#74520B] bg-[#EFE4C8] px-4 py-2 text-xs font-extrabold text-[#74520B] hover:bg-[#74520B] hover:text-white transition"
          >
            Adicionar
          </button>
        </section>
      )}

      {/* ====================================================================
          MODAL DE CONFIRMAÇÃO DE RESGATE DE OFERTA
          ==================================================================== */}
      {selectedOfferModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-[#EFE4C8] px-3 py-0.5 text-[10px] font-extrabold uppercase text-[#74520B]">
                  {selectedOfferModal.storeName} • {selectedOfferModal.floor}
                </span>
                <h3 className="mt-2 font-serif text-2xl font-bold text-[#1F1A11]">
                  {selectedOfferModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOfferModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#5A5243]"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-[#5A5243]">
              {selectedOfferModal.description}
            </p>

            <div className="my-4 rounded-2xl border border-[#E6DFCE] bg-white p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#5A5243]">Custo em pontos:</span>
                <strong className="text-[#74520B]">
                  {selectedOfferModal.pointsCost} pontos
                </strong>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-[#5A5243]">Seu saldo atual:</span>
                <strong className="text-[#1F1A11]">
                  {currentPoints} pontos
                </strong>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={isRedeeming}
                onClick={() => handleConfirmRedeem(selectedOfferModal)}
                className="flex-1 rounded-full bg-[#256B30] py-3.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#1E5827] disabled:opacity-50"
              >
                {isRedeeming
                  ? 'Gerando Voucher...'
                  : `Confirmar Resgate (${selectedOfferModal.pointsCost} pts)`}
              </button>
              <button
                type="button"
                onClick={() => setSelectedOfferModal(null)}
                className="rounded-full border border-[#D8CEB8] bg-white px-5 py-3.5 text-xs font-bold text-[#5A5243]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VOUCHER GERADO */}
      {emittedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E1F3E4] text-[#256B30]">
              <span className="material-symbols-outlined text-3xl">
                verified
              </span>
            </div>
            <h3 className="mt-3 font-serif text-2xl font-bold text-[#1F1A11]">
              Voucher Gerado!
            </h3>
            <p className="mt-1 text-xs text-[#5A5243]">
              Apresente o código abaixo no caixa de{' '}
              <strong>{emittedVoucher.storeName}</strong>
            </p>
            <div className="my-4 rounded-2xl border-2 border-dashed border-[#74520B]/40 bg-white p-4">
              <p className="font-mono text-2xl font-black tracking-widest text-[#74520B]">
                {emittedVoucher.code}
              </p>
            </div>
            <div className="flex gap-2.5">
              <Link
                href="/passaporte?tab=wallet"
                className="flex-1 rounded-full bg-[#74520B] py-3.5 text-xs font-extrabold text-white"
              >
                Abrir QR Code no Passaporte
              </Link>
              <button
                type="button"
                onClick={() => setEmittedVoucher(null)}
                className="rounded-full border border-[#D8CEB8] bg-white px-5 py-3.5 text-xs font-bold text-[#5A5243]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EVENTOS / COMO FUNCIONA */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-bold text-[#1F1A11]">
                {infoModal === 'EVENTS'
                  ? 'Eventos Passe Dourado'
                  : 'Como funciona o Passe Dourado'}
              </h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#5A5243]"
              >
                ✕
              </button>
            </div>

            {infoModal === 'EVENTS' ? (
              <div className="mt-4 space-y-3 text-xs text-[#5A5243]">
                <div className="rounded-2xl border border-[#E6DFCE] bg-white p-3.5">
                  <span className="font-extrabold text-[#74520B]">
                    Hoje · 18h às 21h
                  </span>
                  <p className="mt-0.5 font-bold text-[#1F1A11]">
                    Festival Gastronômico Alameda Gourmet (Pontos em Dobro)
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E6DFCE] bg-white p-3.5">
                  <span className="font-extrabold text-[#256B30]">
                    Sábado e Domingo · Piso L2
                  </span>
                  <p className="mt-0.5 font-bold text-[#1F1A11]">
                    Degustação Especial Café & Chocolates Artesanais
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs text-[#5A5243]">
                <p>
                  <strong>1. Escaneie:</strong> Leia o QR Code nos totens ou balcões das lojas parceiras (validação GPS de 250m).
                </p>
                <p>
                  <strong>2. Acumule:</strong> Ganhe pontos e carimbos oficiais na sua caderneta digital.
                </p>
                <p>
                  <strong>3. Troque:</strong> Emita vouchers no celular e valide em tempo real no caixa.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setInfoModal(null)}
              className="mt-5 w-full rounded-full bg-[#74520B] py-3 text-xs font-extrabold text-white"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
