'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  mockCheckIns,
  mockRewards,
  mockStores,
  mockVisitorProfile,
} from '@/infrastructure/database/mock-data';
import { Reward, Voucher } from '@/shared/types/domain';

interface StoreExclusiveOffer {
  id: string;
  badgeText: string;
  categoryLabel: string;
  title: string;
  description: string;
  priceNow: string;
  priceOld: string;
  pointsHint: string;
  promoCode: string;
}

const STORE_OFFERS: StoreExclusiveOffer[] = [
  {
    id: 'so_01',
    badgeText: 'Até 18h · restam 12',
    categoryLabel: 'CONFEITARIA & CAFÉ',
    title: 'Café Doce de Leite + Alfajor',
    description:
      'Massa fina artesanal recheada com o autêntico doce de leite acompanhada de cappuccino.',
    priceNow: 'R$ 22,90',
    priceOld: 'R$ 34,90',
    pointsHint: 'Use 80 pontos e economize R$ 12',
    promoCode: 'PASSE-CAFE22',
  },
  {
    id: 'so_02',
    badgeText: 'Restam 9 vouchers',
    categoryLabel: 'SOBREMESA NOBRE',
    title: 'Torta Rogel de Doce de Leite',
    description:
      'Camadas crocantes de massa folhada com doce de leite e merengue italiano.',
    priceNow: 'R$ 22,00',
    priceOld: 'R$ 27,00',
    pointsHint: 'Oferta direta no caixa da loja',
    promoCode: 'PASSE-ROGEL',
  },
];

export default function StoreDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? '';

  const store = useMemo(
    () => mockStores.find((s) => s.slug === slug) ?? mockStores[0],
    [slug]
  );

  const storeInitials = useMemo(
    () =>
      store.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [store.name]
  );

  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'OFFERS' | 'REWARDS'
  >('ALL');
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState<number>(
    mockVisitorProfile.currentPoints
  );
  const [allRewards, setAllRewards] = useState<Reward[]>(mockRewards);
  const [checkedInToday] = useState<boolean>(() =>
    mockCheckIns.some((c) => c.storeId === store.id && c.status === 'VALID')
  );
  const [selectedOfferModal, setSelectedOfferModal] =
    useState<StoreExclusiveOffer | null>(null);
  const [redeemedVoucherModal, setRedeemedVoucherModal] =
    useState<Voucher | null>(null);
  const [isRedeemingId, setIsRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadLiveState() {
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
          setAllRewards(rewJson.data.rewards);
        }
      } catch {
        // Fallback local
      }
    }
    loadLiveState();
  }, []);

  const storeRewards = useMemo(() => {
    const direct = allRewards.filter((r) => r.storeId === store.id);
    if (direct.length >= 3) return direct;
    const others = allRewards.filter((r) => r.storeId !== store.id);
    return [...direct, ...others].slice(0, 3);
  }, [allRewards, store.id]);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  }

  async function handleRedeemReward(reward: Reward) {
    if (currentPoints < reward.pointsCost || reward.availableStock <= 0) return;
    setIsRedeemingId(reward.id);
    try {
      const res = await fetch(`/api/rewards/${reward.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: `idem_store_${reward.id}_${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentPoints(json.data.remainingPoints);
        setAllRewards((prev) =>
          prev.map((item) =>
            item.id === reward.id
              ? { ...item, availableStock: Math.max(0, item.availableStock - 1) }
              : item
          )
        );
        window.dispatchEvent(new Event('passport:points-updated'));
        setRedeemedVoucherModal(json.data.voucher);
      } else {
        showToast(
          json.error?.message ?? 'Não foi possível resgatar a recompensa.'
        );
      }
    } catch {
      showToast('Falha ao comunicar com o servidor de vouchers.');
    } finally {
      setIsRedeemingId(null);
    }
  }

  function handleShareStore() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: `${store.name} — Passe Dourado`,
          text: `Confira as vantagens de ${store.name} no Passe Dourado!`,
          url: window.location.href,
        })
        .catch(() => undefined);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link da loja copiado para a área de transferência!');
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {/* Barra de Topo Mobile & Breadcrumb Desktop (Conforme 2-loja-havanna-cafe.png) */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6DFCE] bg-white text-[#1F1A11] shadow-sm transition hover:bg-[#F3ECE0] active:scale-95"
            aria-label="Voltar"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#6E6556]">
            <Link href="/" className="hover:underline">
              Início
            </Link>
            <span>›</span>
            <span>Gastronomia e cafés</span>
            <span>›</span>
            <strong className="text-[#74520B]">{store.name}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsFavorite((prev) => !prev);
              showToast(
                !isFavorite
                  ? 'Loja adicionada aos favoritos!'
                  : 'Loja removida dos favoritos.'
              );
            }}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition active:scale-95 ${
              isFavorite
                ? 'border-[#74520B] bg-[#EFE4C8] text-[#74520B]'
                : 'border-[#E6DFCE] bg-white text-[#1F1A11]'
            }`}
            aria-label="Favoritar"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isFavorite ? 'icon-filled' : ''
              }`}
            >
              {isFavorite ? 'bookmark' : 'bookmark_border'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleShareStore}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6DFCE] bg-white text-[#1F1A11] transition active:scale-95"
            aria-label="Compartilhar"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#256B30]/30 bg-[#E6F2E8] px-4 py-3 text-xs font-bold text-[#1D5726]">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)}>
            ✕
          </button>
        </div>
      )}

      {/* ====================================================================
          HERO CARD DA LOJA PARCEIRA (Conforme 2-loja-havanna-cafe.png)
          ==================================================================== */}
      <section className="overflow-hidden rounded-3xl border border-[#E6DFCE] bg-white shadow-sm">
        {/* Capa Dourada */}
        <div className="relative flex h-44 w-full items-center justify-center bg-gradient-to-br from-[#C89D48] via-[#9D7322] to-[#5E4108] sm:h-56">
          <div className="flex h-20 w-24 items-center justify-center rounded-2xl border-2 border-white/35 bg-white/10">
            <span className="material-symbols-outlined text-5xl text-white/60">
              image
            </span>
          </div>

          {/* Nota ★ 4,9 no Canto Superior Esquerdo */}
          <div className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#1F1A11] shadow-sm">
            <span className="text-[#74520B]">★</span>
            <span>4,9</span>
          </div>

          {/* Status ● Aberto agora no Canto Superior Direito */}
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-[#1F1A11] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#256B30]" />
            <span>Aberto agora</span>
          </div>

          {/* Emblema Circular CE Sobreposto */}
          <div className="absolute -bottom-8 left-5 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-[#C89D48] to-[#8C6518] text-white shadow-md">
            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border border-white/50">
              <span className="font-serif text-xl font-bold leading-none">
                {storeInitials}
              </span>
              <span className="mt-0.5 text-[7px] font-bold uppercase tracking-widest text-white/90">
                {store.name.slice(0, 10)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 pt-10">
          <h1 className="font-serif text-3xl font-bold text-[#1F1A11]">
            {store.name}
          </h1>
          <p className="mt-1 text-xs font-medium text-[#5A5243]">
            {store.floor} · Gastronomia & Cafeteria
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5A5243]">
            <span className="material-symbols-outlined text-[16px]">
              schedule
            </span>
            Segunda a Domingo: 10h às 22h
          </p>

          {/* Box Creme Interno: Loja do Passaporte + Redirecionamento para Escanear QR Code */}
          <div className="mt-4 rounded-2xl bg-[#EFE4C8]/85 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#74520B] shadow-sm">
                <span className="material-symbols-outlined text-[22px]">
                  qr_code_scanner
                </span>
              </div>
              <div>
                <h2 className="font-sans text-sm font-extrabold text-[#1F1A11]">
                  Loja do Passaporte
                </h2>
                <p className="text-xs text-[#5A5243]">
                  +{store.checkInPoints} pontos • Escaneie o QR Code com GPS ativo na hora
                </p>
              </div>
            </div>

            {checkedInToday ? (
              <div className="mt-3.5 w-full rounded-full bg-[#256B30] py-3.5 text-center text-xs font-extrabold text-white shadow-sm">
                ✓ Check-in realizado hoje
              </div>
            ) : (
              <Link
                href="/checkin"
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-full bg-[#74520B] py-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#5E4108] active:scale-98"
              >
                <span className="material-symbols-outlined text-[18px]">
                  qr_code_scanner
                </span>
                Escanear QR Code para Check-in
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* PÍLULAS DE FILTRO: Todas | Ofertas do dia | Trocar por pontos */}
      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'ALL', label: 'Todas' },
          { id: 'OFFERS', label: 'Ofertas do dia' },
          { id: 'REWARDS', label: 'Trocar por pontos' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() =>
              setActiveFilter(tab.id as 'ALL' | 'OFFERS' | 'REWARDS')
            }
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold transition ${
              activeFilter === tab.id
                ? 'bg-[#74520B] text-white shadow-sm'
                : 'border border-[#E2DAC6] bg-white text-[#1F1A11]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* GRID PRINCIPAL (Conteúdo à esquerda + Sidebar no Desktop) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* SEÇÃO 1: OFERTAS DO DIA */}
          {(activeFilter === 'ALL' || activeFilter === 'OFFERS') && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                  Ofertas do dia
                </h2>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#74520B]">
                  EXCLUSIVO NA LOJA
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {STORE_OFFERS.map((offer) => (
                  <article
                    key={offer.id}
                    className="overflow-hidden rounded-3xl border border-[#E6DFCE] bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-[#DFB766] via-[#CEA045] to-[#B07E20]">
                      <div className="flex h-14 w-18 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/15">
                        <span className="material-symbols-outlined text-3xl text-white/75">
                          image
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-[#3A2907]/85 px-3 py-1 text-[10px] font-bold text-white">
                        <span className="material-symbols-outlined text-[13px]">
                          schedule
                        </span>
                        {offer.badgeText}
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#74520B]">
                          {offer.categoryLabel}
                        </span>
                        <h3 className="mt-0.5 font-sans text-base font-extrabold text-[#1F1A11]">
                          {offer.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#6E6556] line-clamp-2">
                          {offer.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
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
                            className="rounded-full bg-[#256B30] px-5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-[#1E5827]"
                          >
                            Resgatar
                          </button>
                        </div>
                        <p className="mt-1.5 text-[11px] text-[#5A5243]">
                          {offer.pointsHint}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* FAIXA DOURADA DE SALDO DE PONTOS (Conforme 2-loja-havanna-cafe.png) */}
          <section className="rounded-3xl bg-[#74520B] p-5 text-white shadow-md">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/90">Seus pontos</span>
              <Link
                href="/passaporte?tab=statement"
                className="font-bold underline underline-offset-4"
              >
                Extrato
              </Link>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-serif text-4xl font-bold leading-none">
                {currentPoints}
              </span>
              <span className="text-base font-medium text-white/90">
                pontos
              </span>
            </div>
          </section>

          {/* SEÇÃO 2: TROCAR POR PONTOS (Conforme 2-loja-havanna-cafe.png) */}
          {(activeFilter === 'ALL' || activeFilter === 'REWARDS') && (
            <section className="space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                  Trocar por pontos
                </h2>
                <span className="text-xs font-medium text-[#6E6556]">
                  {storeRewards.length} opções
                </span>
              </div>

              <div className="space-y-3.5">
                {storeRewards.map((reward) => {
                  const canAfford =
                    currentPoints >= reward.pointsCost &&
                    reward.availableStock > 0;
                  const missingPts = Math.max(
                    0,
                    reward.pointsCost - currentPoints
                  );
                  const savingsReais = Math.round(reward.pointsCost * 0.15);

                  return (
                    <article
                      key={reward.id}
                      className={`rounded-3xl border p-4 shadow-sm transition ${
                        canAfford
                          ? 'border-[#E6DFCE] bg-white'
                          : 'border-[#E6DFCE] bg-[#F5F0E4]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Ícone Quadrado Dourado ou Cadeado */}
                        {canAfford ? (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D6AF60] to-[#9E7422] text-white shadow-inner">
                            <span className="material-symbols-outlined text-3xl text-white/80">
                              image
                            </span>
                          </div>
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#E5DEC9] text-[#5A5243]">
                            <span className="material-symbols-outlined text-3xl">
                              lock
                            </span>
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="font-sans text-base font-extrabold text-[#1F1A11]">
                            {reward.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-[#5A5243]">
                            {reward.description}
                          </p>
                          {canAfford ? (
                            <span className="mt-1 block text-xs font-extrabold text-[#74520B]">
                              {reward.availableStock} restantes
                            </span>
                          ) : (
                            <span className="mt-1 block text-xs font-extrabold text-[#74520B]">
                              Faltam {missingPts} pontos
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#EFE9DA] pt-3">
                        {canAfford ? (
                          <span className="text-xs text-[#5A5243]">
                            Use{' '}
                            <strong className="text-[#74520B]">
                              {reward.pointsCost} pontos
                            </strong>{' '}
                            e economize R$ {savingsReais}
                          </span>
                        ) : (
                          <span className="text-xs text-[#6E6556]">
                            Precisa de{' '}
                            <strong>{reward.pointsCost} pontos</strong>
                          </span>
                        )}

                        {canAfford ? (
                          <button
                            type="button"
                            disabled={isRedeemingId === reward.id}
                            onClick={() => handleRedeemReward(reward)}
                            className="rounded-full bg-[#256B30] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#1E5827] disabled:opacity-50"
                          >
                            {isRedeemingId === reward.id
                              ? 'Emitindo...'
                              : 'Resgatar'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="flex items-center gap-1.5 rounded-full bg-[#E5DEC9] px-4 py-2 text-xs font-bold text-[#5A5243]"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              lock
                            </span>
                            Bloqueado
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* Aviso de Validade no Rodapé da Loja */}
          <div className="flex items-start gap-3 rounded-2xl border border-[#E6DFCE] bg-white p-4 text-xs text-[#1F1A11]">
            <span className="material-symbols-outlined text-[18px] text-[#74520B]">
              info
            </span>
            <p className="leading-relaxed">
              <strong>Atenção:</strong> o voucher resgatado vale por{' '}
              <strong>2 horas</strong>. Ative e valide no caixa do {store.name}{' '}
              ({store.floor}). Não acumula com outras promoções.
            </p>
          </div>
        </div>

        {/* SIDEBAR DIREITA NO DESKTOP (Conforme Passe-Dourado-desktop-cliente-2-loja-havanna.png) */}
        <aside className="hidden lg:block lg:col-span-4 space-y-5">
          {/* Card Localização no Shopping */}
          <div className="rounded-3xl border border-[#E6DFCE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#1F1A11]">
                Localização no shopping
              </h3>
              <span className="rounded-full bg-[#EFE4C8] px-2.5 py-0.5 text-[10px] font-extrabold text-[#74520B]">
                {store.floor.split('•')[0]}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#F3EDE0] p-3 text-center text-[10px] font-semibold text-[#6E6556]">
              <div className="rounded-xl bg-[#E6DEC8] py-3">Livraria</div>
              <div className="rounded-xl bg-[#E6DEC8] py-3">Elevadores</div>
              <div className="rounded-xl border-2 border-[#74520B] bg-white py-3 font-extrabold text-[#1F1A11]">
                {store.name}
              </div>
              <div className="rounded-xl bg-[#E6DEC8] py-3">Cinema</div>
              <div className="rounded-xl bg-[#E6DEC8] py-3">Moda</div>
              <div className="rounded-xl bg-[#E6DEC8] py-3">Praça</div>
            </div>

            <p className="mt-3 text-xs text-[#5A5243]">
              📍 Alameda Gourmet, ao lado dos elevadores panorâmicos.
            </p>
            <p className="mt-1 text-xs text-[#5A5243]">
              📞 (63) 3000-0000 · WhatsApp do balcão
            </p>
          </div>

          {/* Card Passaporte Gourmet */}
          <div className="rounded-3xl bg-[#74520B] p-5 text-white shadow-md">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#EFE4C8]">
              ☆ Passaporte Gourmet
            </span>
            <p className="mt-2 text-xs leading-relaxed text-white/90">
              Visite 3 cafeterias participantes na Alameda Gourmet este mês para
              desbloquear o selo &ldquo;Mestre do Café&rdquo; e ganhar{' '}
              <strong>+50 pontos</strong> extras.
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full w-1/3 rounded-full bg-white" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-bold">
              <span>1 de 3 cafeterias</span>
              <span>Faltam 2</span>
            </div>
          </div>
        </aside>
      </div>

      {/* MODAL DE OFERTA DO DIA */}
      {selectedOfferModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-[#EFE4C8] px-3 py-0.5 text-[10px] font-extrabold uppercase text-[#74520B]">
                  {selectedOfferModal.categoryLabel}
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

            <div className="my-4 rounded-2xl border-2 border-dashed border-[#74520B]/40 bg-white p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6E6556]">
                Código no Caixa
              </span>
              <p className="mt-1 font-mono text-2xl font-black tracking-widest text-[#74520B]">
                {selectedOfferModal.promoCode}
              </p>
              <p className="mt-1 text-xs font-bold text-[#256B30]">
                {selectedOfferModal.priceNow} (antes{' '}
                {selectedOfferModal.priceOld})
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(selectedOfferModal.promoCode);
                }
                showToast(
                  `Código ${selectedOfferModal.promoCode} copiado! Apresente no caixa.`
                );
                setSelectedOfferModal(null);
              }}
              className="w-full rounded-full bg-[#256B30] py-3.5 text-xs font-extrabold text-white"
            >
              Copiar Código & Usar no Caixa
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE VOUCHER EMITIDO COM PONTOS */}
      {redeemedVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E1F3E4] text-[#256B30]">
              <span className="material-symbols-outlined text-3xl">
                confirmation_number
              </span>
            </div>
            <h3 className="mt-3 font-serif text-2xl font-bold text-[#1F1A11]">
              {redeemedVoucherModal.rewardTitle}
            </h3>
            <p className="mt-1 text-xs text-[#5A5243]">
              Apresente este código no caixa do{' '}
              <strong>{redeemedVoucherModal.storeName}</strong>
            </p>

            <div className="my-4 rounded-2xl border-2 border-dashed border-[#74520B]/40 bg-white p-4">
              <p className="font-mono text-2xl font-black tracking-widest text-[#74520B]">
                {redeemedVoucherModal.code}
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
                onClick={() => setRedeemedVoucherModal(null)}
                className="rounded-full border border-[#D8CEB8] bg-white px-5 py-3.5 text-xs font-bold text-[#5A5243]"
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
