'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  mockMissions,
  mockPointTransactions,
  mockRewards,
  mockStamps,
  mockStores,
  mockUsers,
  mockVisitorProfile,
  mockVouchers,
} from '@/infrastructure/database/mock-data';
import { PasseDouradoLogo } from '@/components/shared/PasseDouradoLogo';
import {
  Mission,
  PointTransaction,
  Reward,
  Stamp,
  Voucher,
} from '@/shared/types/domain';

type PassportTab = 'wallet' | 'stamps' | 'missions' | 'redeem' | 'statement';

interface StampSlot {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeFloor: string;
  category: string;
  checkInPoints: number;
  qrCodeToken: string;
  collected: boolean;
  stamp: Stamp | null;
}

function VisitorPassportContent() {
  const searchParams = useSearchParams();
  const initialTabParam = searchParams?.get('tab') as PassportTab | null;

  const [activeTab, setActiveTab] = useState<PassportTab>(
    initialTabParam &&
      ['wallet', 'stamps', 'missions', 'redeem', 'statement'].includes(
        initialTabParam
      )
      ? initialTabParam
      : 'wallet'
  );

  useEffect(() => {
    if (
      initialTabParam &&
      ['wallet', 'stamps', 'missions', 'redeem', 'statement'].includes(
        initialTabParam
      )
    ) {
      setActiveTab(initialTabParam);
    }
  }, [initialTabParam]);

  const [currentPoints, setCurrentPoints] = useState<number>(
    mockVisitorProfile.currentPoints
  );
  const [stampBook, setStampBook] = useState<StampSlot[]>(() =>
    mockStores.map((store) => {
      const found = mockStamps.find((s) => s.storeId === store.id) ?? null;
      return {
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        storeFloor: store.floor,
        category: store.category,
        checkInPoints: store.checkInPoints,
        qrCodeToken: store.qrCodeToken,
        collected: Boolean(found),
        stamp: found,
      };
    })
  );

  const [missions, setMissions] = useState<Mission[]>(mockMissions);
  const [rewards, setRewards] = useState<Reward[]>(mockRewards);
  const [isRedeemingId, setIsRedeemingId] = useState<string | null>(null);

  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [selectedActiveVoucherIndex, setSelectedActiveVoucherIndex] =
    useState(0);
  const [isSimulatingPos, setIsSimulatingPos] = useState(false);
  const [posConfirmedVoucher, setPosConfirmedVoucher] =
    useState<Voucher | null>(null);

  const [transactions, setTransactions] = useState<PointTransaction[]>(
    mockPointTransactions
  );
  const [txFilter, setTxFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  async function refreshAllPassportData() {
    try {
      const [missionsRes, pointsRes, rewardsRes, passportRes] =
        await Promise.all([
          fetch('/api/visitor/missions', { cache: 'no-store' }),
          fetch('/api/visitor/points', { cache: 'no-store' }),
          fetch('/api/rewards', { cache: 'no-store' }),
          fetch('/api/visitor/passport', { cache: 'no-store' }),
        ]);

      const missionsJson = await missionsRes.json();
      if (missionsJson?.success && missionsJson.data) {
        if (Array.isArray(missionsJson.data.missions)) {
          setMissions(missionsJson.data.missions);
        }
        if (Array.isArray(missionsJson.data.stampBook)) {
          const enriched = missionsJson.data.stampBook.map(
            (slot: {
              storeId: string;
              storeName: string;
              storeFloor: string;
              category: string;
              checkInPoints: number;
              collected: boolean;
              stamp: Stamp | null;
            }) => {
              const storeRef = mockStores.find((s) => s.id === slot.storeId);
              return {
                ...slot,
                storeSlug: storeRef?.slug ?? 'cafe-jalapao-gourmet',
                qrCodeToken:
                  storeRef?.qrCodeToken ?? 'QR-CD-STORE-01-VERIFIED',
              };
            }
          );
          setStampBook(enriched);
        }
      }

      const pointsJson = await pointsRes.json();
      if (pointsJson?.success && pointsJson.data) {
        setCurrentPoints(pointsJson.data.currentPoints);
        if (Array.isArray(pointsJson.data.transactions)) {
          setTransactions(pointsJson.data.transactions);
        }
      }

      const rewardsJson = await rewardsRes.json();
      if (rewardsJson?.success && Array.isArray(rewardsJson.data?.rewards)) {
        setRewards(rewardsJson.data.rewards);
      }

      const passportJson = await passportRes.json();
      if (
        passportJson?.success &&
        Array.isArray(passportJson.data?.activeVouchers)
      ) {
        const activeList: Voucher[] = passportJson.data.activeVouchers;
        setVouchers((prev) => {
          const usedOnes = prev.filter((v) => v.status === 'USED');
          const mergedIds = new Set(activeList.map((a) => a.code));
          return [
            ...activeList,
            ...usedOnes.filter((u) => !mergedIds.has(u.code)),
          ];
        });
      }
    } catch {
      // Fallback local
    }
  }

  useEffect(() => {
    refreshAllPassportData();
  }, []);

  const activeVouchers = useMemo(
    () => vouchers.filter((v) => v.status === 'ACTIVE'),
    [vouchers]
  );
  const usedVouchers = useMemo(
    () => vouchers.filter((v) => v.status !== 'ACTIVE'),
    [vouchers]
  );

  const currentActiveVoucher =
    activeVouchers[selectedActiveVoucherIndex] ?? activeVouchers[0] ?? null;

  // Conexão Server-Sent Events (SSE) para o voucher ativo selecionado
  useEffect(() => {
    if (!currentActiveVoucher) return;

    const es = new EventSource(
      `/api/realtime/vouchers?code=${encodeURIComponent(
        currentActiveVoucher.code
      )}`
    );

    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload.type === 'VOUCHER_USED') {
          setVouchers((prev) =>
            prev.map((item) =>
              item.code === payload.code
                ? {
                    ...item,
                    status: 'USED',
                    usedAt: payload.usedAt ?? new Date().toISOString(),
                  }
                : item
            )
          );
          setPosConfirmedVoucher(
            (prev) =>
              prev ?? {
                ...currentActiveVoucher,
                status: 'USED',
                usedAt: payload.usedAt ?? new Date().toISOString(),
              }
          );
        }
      } catch {
        // Keep-alive
      }
    };

    return () => {
      es.close();
    };
  }, [currentActiveVoucher]);

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
          idempotencyKey: `idem_pass_${reward.id}_${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const newVoucher: Voucher = json.data.voucher;
        setCurrentPoints(json.data.remainingPoints);
        setRewards((prev) =>
          prev.map((r) =>
            r.id === reward.id
              ? { ...r, availableStock: Math.max(0, r.availableStock - 1) }
              : r
          )
        );
        setVouchers((prev) => [newVoucher, ...prev]);
        setSelectedActiveVoucherIndex(0);
        window.dispatchEvent(new Event('passport:points-updated'));
        await refreshAllPassportData();
        setActiveTab('wallet');
        showToast(
          `🎉 Voucher ${newVoucher.code} gerado! Apresente o QR Code no caixa.`
        );
      } else {
        showToast(json.error?.message ?? 'Erro ao resgatar recompensa.');
      }
    } catch {
      showToast('Falha de comunicação ao emitir voucher.');
    } finally {
      setIsRedeemingId(null);
    }
  }

  async function handleSimulateCashierValidation(voucher: Voucher) {
    if (isSimulatingPos) return;
    setIsSimulatingPos(true);
    try {
      const res = await fetch('/api/merchant/vouchers/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucher.code }),
      });
      const json = await res.json();
      if (json.success) {
        const updatedVoucher: Voucher = json.data.voucher;
        setVouchers((prev) =>
          prev.map((item) =>
            item.code === updatedVoucher.code ? updatedVoucher : item
          )
        );
        setPosConfirmedVoucher(updatedVoucher);
      } else {
        const fallbackUsed: Voucher = {
          ...voucher,
          status: 'USED',
          usedAt: new Date().toISOString(),
        };
        setVouchers((prev) =>
          prev.map((item) =>
            item.code === voucher.code ? fallbackUsed : item
          )
        );
        setPosConfirmedVoucher(fallbackUsed);
      }
    } catch {
      showToast('Erro ao simular validação no caixa.');
    } finally {
      setIsSimulatingPos(false);
    }
  }

  const collectedStampsCount = stampBook.filter((s) => s.collected).length;
  const filteredTransactions = useMemo(() => {
    if (txFilter === 'ALL') return transactions;
    return transactions.filter((tx) => tx.type === txFilter);
  }, [transactions, txFilter]);

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {/* Toast Flutuante */}
      {toastMessage && (
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#256B30]/30 bg-[#E6F2E8] px-4 py-3 text-xs font-bold text-[#1D5726]">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Cabeçalho Desktop (Conforme Passe-Dourado-desktop-cliente-4-meu-passaporte.png) */}
      <div className="mb-6 hidden lg:flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#74520B]">
              PASSAPORTE DOURADO
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E1F3E4] px-2.5 py-0.5 text-[10px] font-bold text-[#1D6329]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#256B30]" />
              Conta sincronizada
            </span>
          </div>
          <h1 className="mt-1 font-serif text-4xl font-bold text-[#1F1A11]">
            Meu passaporte
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/checkin"
            className="flex items-center gap-2 rounded-full bg-[#74520B] px-6 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-[#5E4108]"
          >
            <span className="material-symbols-outlined text-[18px]">
              photo_camera
            </span>
            Escanear QR code no caixa
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* ====================================================================
            COLUNA ESQUERDA: CARTÃO DOURADO + NAVEGAÇÃO + EXTRATO RÁPIDO
            ==================================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* CARTÃO DE MEMBRO DOURADO (Conforme 6-meu-passaporte.png) */}
          <section className="rounded-3xl bg-[#74520B] p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white/90">
                <span className="material-symbols-outlined text-[16px]">
                  star
                </span>
                <span>MEU PASSAPORTE</span>
              </div>
              <span className="rounded-full bg-white/15 px-3.5 py-1 text-xs font-extrabold text-white">
                Nível Ouro
              </span>
            </div>

            <div className="mt-4">
              <span className="block text-xs text-white/80">
                Membro titular
              </span>
              <h2 className="font-serif text-3xl font-bold leading-tight text-white">
                {mockUsers[0].name}
              </h2>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl font-bold leading-none">
                  {currentPoints}
                </span>
                <span className="text-base font-medium text-white/90">
                  pontos
                </span>
              </div>

              <Link
                href="/checkin"
                className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-extrabold text-[#74520B] shadow-md transition active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">
                  qr_code_scanner
                </span>
                Escanear QR
              </Link>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-3.5 text-xs text-white/90">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  trending_up
                </span>
                <span>+80 pontos ganhos esta semana</span>
              </div>
              <span className="font-mono text-[10px] text-white/75">
                {mockVisitorProfile.memberCode}
              </span>
            </div>
          </section>

          {/* GRADE 2x2 DE BOTÕES DE ABAS (Conforme 6-meu-passaporte.png) */}
          <nav aria-label="Abas do Passaporte" className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('stamps')}
                className={`rounded-full py-3.5 text-xs font-extrabold transition ${
                  activeTab === 'stamps'
                    ? 'bg-[#74520B] text-white shadow-sm'
                    : 'border border-[#E6DFCE] bg-white text-[#1F1A11] hover:bg-[#F3ECE0]'
                }`}
              >
                Carimbos ({collectedStampsCount}/{stampBook.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('missions')}
                className={`rounded-full py-3.5 text-xs font-extrabold transition ${
                  activeTab === 'missions'
                    ? 'bg-[#74520B] text-white shadow-sm'
                    : 'border border-[#E6DFCE] bg-white text-[#1F1A11] hover:bg-[#F3ECE0]'
                }`}
              >
                Missões ({missions.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('redeem')}
                className={`rounded-full py-3.5 text-xs font-extrabold transition ${
                  activeTab === 'redeem'
                    ? 'bg-[#74520B] text-white shadow-sm'
                    : 'border border-[#E6DFCE] bg-white text-[#1F1A11] hover:bg-[#F3ECE0]'
                }`}
              >
                Trocar pontos
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`rounded-full py-3.5 text-xs font-extrabold transition ${
                  activeTab === 'wallet'
                    ? 'bg-[#74520B] text-white shadow-sm'
                    : 'border border-[#E6DFCE] bg-white text-[#1F1A11] hover:bg-[#F3ECE0]'
                }`}
              >
                Meus vouchers ({activeVouchers.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              className={`w-full rounded-full py-2.5 text-xs font-extrabold transition ${
                activeTab === 'statement'
                  ? 'bg-[#74520B] text-white shadow-sm'
                  : 'border border-[#E6DFCE] bg-white text-[#5A5243] hover:text-[#1F1A11]'
              }`}
            >
              Ver extrato completo de pontos →
            </button>
          </nav>

          {/* Card Extrato Rápido (Desktop Conforme Passe-Dourado-desktop-cliente-4-meu-passaporte.png) */}
          <div className="hidden lg:block rounded-3xl border border-[#E6DFCE] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-[#1F1A11]">
                Extrato rápido
              </h3>
              <span className="text-xs font-extrabold text-[#256B30]">
                +80 pts esta semana
              </span>
            </div>

            <div className="mt-3.5 space-y-3">
              {transactions.slice(0, 3).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b border-[#F2ECE0] pb-2.5 text-xs last:border-none last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                      <span className="material-symbols-outlined text-[18px]">
                        {tx.type === 'CREDIT' ? 'local_cafe' : 'redeem'}
                      </span>
                    </div>
                    <div>
                      <p className="font-extrabold text-[#1F1A11]">
                        {tx.description.split('•')[0]}
                      </p>
                      <span className="text-[11px] text-[#6E6556]">
                        {tx.description.split('•').slice(1).join('•') ||
                          'Passaporte Digital'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-extrabold ${
                      tx.type === 'CREDIT' ? 'text-[#256B30]' : 'text-red-700'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? `+${tx.amount}` : `-${tx.amount}`}{' '}
                    pts
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('statement')}
              className="mt-3 text-xs font-extrabold text-[#74520B] hover:underline"
            >
              Ver extrato completo ›
            </button>
          </div>
        </div>

        {/* ====================================================================
            COLUNA DIREITA: CONTEÚDO DA ABA ATIVA
            ==================================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {/* ABA 1: MEUS VOUCHERS (CARTEIRA + SSE EM TEMPO REAL — Conforme 6-meu-passaporte.png) */}
          {activeTab === 'wallet' && (
            <section className="space-y-5">
              {/* Box Verde SSE (Conforme 6-meu-passaporte.png) */}
              <div className="flex items-start gap-3.5 rounded-3xl border border-[#C5E2CA] bg-[#E5F2E7] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#256B30] text-white">
                  <span className="material-symbols-outlined text-[18px]">
                    bolt
                  </span>
                </div>
                <div>
                  <h3 className="font-sans text-sm font-extrabold text-[#194E22]">
                    Conectado ao caixa em tempo real
                  </h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#233D27]">
                    Mostre o código abaixo ao atendente. Quando o caixa validar,
                    este voucher será confirmado e baixado automaticamente aqui.
                  </p>
                </div>
              </div>

              {/* Seletor caso haja múltiplos vouchers ativos */}
              {activeVouchers.length > 1 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {activeVouchers.map((v, idx) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedActiveVoucherIndex(idx)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition ${
                        idx === selectedActiveVoucherIndex
                          ? 'bg-[#74520B] text-white shadow-sm'
                          : 'border border-[#E6DFCE] bg-white text-[#1F1A11]'
                      }`}
                    >
                      {v.code} · {v.rewardTitle.slice(0, 22)}...
                    </button>
                  ))}
                </div>
              )}

              {/* Ticket Principal do Voucher Ativo (Conforme 6-meu-passaporte.png) */}
              {currentActiveVoucher ? (
                <div className="overflow-hidden rounded-3xl border border-[#E6DFCE] bg-white shadow-md">
                  {/* Capa Dourada Escura do Voucher */}
                  <div className="relative bg-gradient-to-b from-[#CAA455] via-[#7A5915] to-[#1D1505] p-5 pt-16 text-white">
                    {/* Pílula Esquerda: ✓ Pronto para uso */}
                    <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-[#256B30] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-sm">
                      <span className="material-symbols-outlined text-[15px]">
                        check_circle
                      </span>
                      Pronto para uso
                    </div>

                    {/* Pílula Direita: Expira em 48min */}
                    <div className="absolute right-4 top-4 rounded-full bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#1F1A11] shadow-sm">
                      Expira em 48min
                    </div>

                    <span className="block text-[11px] font-extrabold uppercase tracking-wider text-white/90">
                      {currentActiveVoucher.storeName} ·{' '}
                      {currentActiveVoucher.storeFloor}
                    </span>
                    <h3 className="mt-1 font-sans text-xl font-extrabold text-white">
                      {currentActiveVoucher.rewardTitle}
                    </h3>
                  </div>

                  {/* Linha Tracejada Perfurada */}
                  <div className="relative flex items-center justify-between border-b-2 border-dashed border-[#DFD6C3] px-4 py-2">
                    <div className="-ml-7 h-6 w-6 rounded-full bg-[#FAF6EE]" />
                    <div className="-mr-7 h-6 w-6 rounded-full bg-[#FAF6EE]" />
                  </div>

                  {/* Corpo do QR Code + Código PASSE-84920 */}
                  <div className="flex flex-col items-center p-6 text-center">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#74520B]">
                      <span className="material-symbols-outlined text-[18px]">
                        contactless
                      </span>
                      <span>Apresente no caixa</span>
                    </div>

                    {/* QR Code com Logo Feixe no Centro */}
                    <div className="relative mt-4 flex h-56 w-56 items-center justify-center rounded-3xl border border-[#E6DFCE] bg-[#F6F3EC] p-5">
                      <div className="grid h-full w-full grid-cols-7 gap-1.5">
                        {Array.from({ length: 49 }).map((_, idx) => {
                          const isCorner =
                            idx === 0 ||
                            idx === 1 ||
                            idx === 5 ||
                            idx === 6 ||
                            idx === 7 ||
                            idx === 13 ||
                            idx === 35 ||
                            idx === 42 ||
                            idx === 43 ||
                            idx % 3 === 0;
                          return (
                            <div
                              key={idx}
                              className={
                                isCorner
                                  ? 'rounded-[3px] bg-[#181510]'
                                  : 'bg-transparent'
                              }
                            />
                          );
                        })}
                      </div>

                      {/* Emblema Central Dourado (1 · Feixe) */}
                      <div className="absolute flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#74520B] shadow-md">
                        <PasseDouradoLogo variant="white-circle" size={36} />
                      </div>
                    </div>

                    {/* Pílula do Código Copiável */}
                    <div className="mt-5 flex w-full max-w-xs items-center justify-between rounded-full border border-[#E6DFCE] bg-[#F5F1E8] px-5 py-3">
                      <code className="font-sans text-lg font-black tracking-wider text-[#1F1A11]">
                        {currentActiveVoucher.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            typeof navigator !== 'undefined' &&
                            navigator.clipboard
                          ) {
                            navigator.clipboard.writeText(
                              currentActiveVoucher.code
                            );
                          }
                          showToast(
                            `Código ${currentActiveVoucher.code} copiado!`
                          );
                        }}
                        className="flex items-center gap-1 text-xs font-extrabold text-[#74520B]"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          content_copy
                        </span>
                        Copiar
                      </button>
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-xs text-[#5A5243]">
                      <span className="material-symbols-outlined text-[16px]">
                        sync
                      </span>
                      Aguardando o caixa ler o código
                    </p>

                    {/* Botão Verde: Simular validação instantânea no caixa */}
                    <button
                      type="button"
                      disabled={isSimulatingPos}
                      onClick={() =>
                        handleSimulateCashierValidation(currentActiveVoucher)
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-full bg-[#256B30] py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-[#1E5827] active:scale-98 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        verified
                      </span>
                      <span>
                        {isSimulatingPos
                          ? 'Validando no caixa...'
                          : 'Simular validação instantânea no caixa'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-[#D8CEB8] bg-white p-8 text-center">
                  <p className="font-serif text-lg font-bold text-[#1F1A11]">
                    Nenhum voucher ativo no momento
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('redeem')}
                    className="mt-3 rounded-full bg-[#74520B] px-5 py-2.5 text-xs font-extrabold text-white"
                  >
                    Trocar pontos por novo cupom
                  </button>
                </div>
              )}

              {/* Seção Já utilizados (Conforme 6-meu-passaporte.png) */}
              {usedVouchers.length > 0 && (
                <div className="pt-2">
                  <h3 className="mb-3 font-sans text-base font-extrabold text-[#1F1A11]">
                    Já utilizados
                  </h3>
                  <div className="space-y-2.5">
                    {usedVouchers.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-3xl border border-[#E6DFCE] bg-[#EFECE4] p-4"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E2DDD0] text-[#5A5243]">
                            <span className="material-symbols-outlined text-[22px]">
                              movie
                            </span>
                          </div>
                          <div>
                            <h4 className="font-sans text-sm font-extrabold text-[#1F1A11]">
                              {v.rewardTitle}
                            </h4>
                            <p className="text-xs text-[#5A5243]">
                              Utilizado em{' '}
                              {v.usedAt
                                ? new Date(v.usedAt).toLocaleDateString(
                                    'pt-BR',
                                    { day: '2-digit', month: '2-digit' }
                                  )
                                : '14/10'}
                            </p>
                            <p className="text-xs text-[#5A5243]">
                              Código: {v.code}
                            </p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[#5A5243]">
                          chevron_right
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ABA 2: CARIMBOS */}
          {activeTab === 'stamps' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                  Caderneta de Carimbos
                </h2>
                <span className="rounded-full bg-[#EFE4C8] px-3.5 py-1 text-xs font-extrabold text-[#74520B]">
                  {collectedStampsCount}/{stampBook.length} Coletados
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                {stampBook.map((slot) => (
                  <div
                    key={slot.storeId}
                    className={`flex flex-col items-center justify-between rounded-3xl border p-4 text-center ${
                      slot.collected
                        ? 'border-[#74520B]/40 bg-white shadow-sm'
                        : 'border-dashed border-[#D8CEB8] bg-[#F5F1E8]'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold text-[#74520B]">
                      +{slot.checkInPoints} pts
                    </span>

                    <div
                      className={`my-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed ${
                        slot.collected
                          ? 'border-[#74520B] bg-[#EFE4C8] text-[#74520B]'
                          : 'border-[#C8BFA8] bg-white text-[#8C8270]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-2xl">
                        {slot.collected ? 'verified' : 'lock'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-sans text-xs font-extrabold text-[#1F1A11]">
                        {slot.storeName}
                      </h3>
                      <p className="text-[10px] text-[#6E6556]">
                        {slot.storeFloor}
                      </p>
                    </div>

                    {slot.collected ? (
                      <span className="mt-2.5 w-full rounded-full bg-[#E1F3E4] py-1 text-[10px] font-extrabold text-[#256B30]">
                        ✓ Carimbado
                      </span>
                    ) : (
                      <Link
                        href={`/checkin?qr=${encodeURIComponent(
                          slot.qrCodeToken
                        )}`}
                        className="mt-2.5 w-full rounded-full bg-[#74520B] py-1.5 text-[10px] font-extrabold text-white"
                      >
                        Carimbar agora
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ABA 3: MISSÕES */}
          {activeTab === 'missions' && (
            <section className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                Missões do Passaporte
              </h2>
              <div className="space-y-3.5">
                {missions.map((mission) => {
                  const pct = Math.min(
                    100,
                    Math.round(
                      (mission.currentCount / mission.targetCount) * 100
                    )
                  );
                  const isCompleted = mission.status === 'COMPLETED';
                  return (
                    <article
                      key={mission.id}
                      className="rounded-3xl border border-[#E6DFCE] bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="rounded-full bg-[#EFE4C8] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#74520B]">
                            {mission.frequency}
                          </span>
                          <h3 className="mt-1.5 font-sans text-base font-extrabold text-[#1F1A11]">
                            {mission.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-[#5A5243]">
                            {mission.description}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#E1F3E4] px-3 py-1 text-xs font-extrabold text-[#256B30]">
                          +{mission.rewardPoints} pts
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold">
                          <span>
                            {mission.currentCount} de {mission.targetCount}
                          </span>
                          <span>{isCompleted ? 'Concluída ✓' : `${pct}%`}</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#EFE9DA]">
                          <div
                            className="h-full rounded-full bg-[#256B30]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ABA 4: TROCAR PONTOS */}
          {activeTab === 'redeem' && (
            <section className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                Trocar pontos por cupons
              </h2>
              <div className="space-y-3.5">
                {rewards.map((reward) => {
                  const canAfford =
                    currentPoints >= reward.pointsCost &&
                    reward.availableStock > 0;
                  return (
                    <article
                      key={reward.id}
                      className="flex items-center justify-between gap-4 rounded-3xl border border-[#E6DFCE] bg-white p-4 shadow-sm"
                    >
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[#74520B]">
                          {reward.storeName} · {reward.pointsCost} pontos
                        </span>
                        <h3 className="font-sans text-base font-extrabold text-[#1F1A11]">
                          {reward.title}
                        </h3>
                        <p className="text-xs text-[#5A5243]">
                          {reward.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canAfford || isRedeemingId === reward.id}
                        onClick={() => handleRedeemReward(reward)}
                        className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold ${
                          canAfford
                            ? 'bg-[#256B30] text-white'
                            : 'bg-[#E5DEC9] text-[#5A5243]'
                        }`}
                      >
                        {isRedeemingId === reward.id
                          ? 'Gerando...'
                          : canAfford
                          ? 'Resgatar'
                          : 'Bloqueado'}
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ABA 5: EXTRATO COMPLETO */}
          {activeTab === 'statement' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                  Extrato de Pontos
                </h2>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 'ALL', label: 'Todas' },
                      { id: 'CREDIT', label: '+ Entradas' },
                      { id: 'DEBIT', label: '- Saídas' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTxFilter(f.id)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                        txFilter === f.id
                          ? 'bg-[#74520B] text-white'
                          : 'border border-[#E6DFCE] bg-white text-[#1F1A11]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-3xl border border-[#E6DFCE] bg-white p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-sans text-sm font-extrabold text-[#1F1A11]">
                        {tx.description}
                      </p>
                      <span className="text-xs text-[#6E6556]">
                        Saldo após: {tx.balanceAfter} pts
                      </span>
                    </div>
                    <span
                      className={`font-sans text-base font-black ${
                        tx.type === 'CREDIT' ? 'text-[#256B30]' : 'text-red-700'
                      }`}
                    >
                      {tx.type === 'CREDIT' ? `+${tx.amount}` : `-${tx.amount}`}{' '}
                      pts
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* MODAL CELEBRATÓRIO DE VALIDAÇÃO EM TEMPO REAL NO CAIXA */}
      {posConfirmedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#256B30]/40 bg-[#FAF6EE] p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#256B30] text-white shadow-lg">
              <span className="material-symbols-outlined text-4xl">
                verified
              </span>
            </div>

            <span className="mt-3 inline-block rounded-full bg-[#E1F3E4] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#194E22]">
              ⚡ Baixa Confirmada no Caixa (SSE)
            </span>

            <h3 className="mt-2 font-serif text-2xl font-bold text-[#1F1A11]">
              Validação Confirmada! Bom Apetite!
            </h3>
            <p className="mt-1 text-xs text-[#5A5243]">
              O operador do <strong>{posConfirmedVoucher.storeName}</strong>{' '}
              acabou de validar seu voucher{' '}
              <code>{posConfirmedVoucher.code}</code>.
            </p>

            <button
              type="button"
              onClick={() => setPosConfirmedVoucher(null)}
              className="mt-5 w-full rounded-full bg-[#256B30] py-3.5 text-xs font-extrabold text-white shadow-md"
            >
              Concluir e Voltar ao Passaporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisitorPassportPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-[#5A5243]">
          Carregando Passaporte Dourado...
        </div>
      }
    >
      <VisitorPassportContent />
    </Suspense>
  );
}
