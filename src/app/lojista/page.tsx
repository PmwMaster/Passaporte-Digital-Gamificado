'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MerchantPortalService } from '@/modules/merchant';
import { Reward, Voucher } from '@/shared/types/domain';

interface ShiftAttendance {
  id: string;
  code: string;
  customerName: string;
  rewardTitle: string;
  timeLabel: string;
}

export default function MerchantPortalPage() {
  const initialDashboard = MerchantPortalService.getStoreDashboard();

  const [viewMode, setViewMode] = useState<'POS' | 'CNPJ_LOGIN'>('POS');
  const [cnpjInput, setCnpjInput] = useState('12.345.678/0001-90');
  const [passwordInput, setPasswordInput] = useState('20262026');
  const [rememberDevice, setRememberDevice] = useState(true);

  const [voucherCode, setVoucherCode] = useState('PASSE-84920');
  const [validatedVoucher, setValidatedVoucher] = useState<Voucher | null>(
    () =>
      initialDashboard.recentVouchers.find(
        (v: Voucher) => v.code === 'PASSE-84920'
      ) ??
      initialDashboard.recentVouchers[0] ??
      null
  );
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [redeemedCount, setRedeemedCount] = useState(18);
  const [confirmedInPosCount, setConfirmedInPosCount] = useState(14);
  const [checkInsCount] = useState(42);
  const [campaignTab, setCampaignTab] = useState<
    'ACTIVE' | 'SCHEDULED' | 'ENDED'
  >('ACTIVE');
  const [storeRewards, setStoreRewards] = useState<Reward[]>(
    initialDashboard.rewards
  );

  const [recentAttendances, setRecentAttendances] = useState<ShiftAttendance[]>(
    [
      {
        id: 'att_1',
        code: 'PASSE-19302',
        customerName: 'Carlos M.',
        rewardTitle: 'Doce de Leite',
        timeLabel: '14:05',
      },
      {
        id: 'att_2',
        code: 'PASSE-77401',
        customerName: 'Ana Paula',
        rewardTitle: 'Espresso Duplo',
        timeLabel: '13:48',
      },
    ]
  );

  // Modal de Nova Oferta Express
  const [showNewOfferModal, setShowNewOfferModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPointsCost, setNewPointsCost] = useState(80);
  const [newStock, setNewStock] = useState(20);
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);

  // Scanner QR Câmera no PDV
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined);
      }
    };
  }, []);

  async function handleStartPosCamera() {
    setIsCameraOpen(true);
    setStatusMsg({
      type: 'info',
      text: 'Aponte a câmera do caixa para o QR Code na tela do cliente...',
    });
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const qr = new Html5Qrcode('merchant-pos-qr-reader');
      scannerRef.current = qr;
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const clean = decodedText
            .replace('PASSE-DOURADO:VOUCHER:', '')
            .replace('PASSAPORTE-CD:VOUCHER:', '')
            .trim();
          setVoucherCode(clean);
          setStatusMsg({
            type: 'success',
            text: `QR Code lido com sucesso: ${clean}`,
          });
          qr.stop()
            .then(() => {
              qr.clear();
              setIsCameraOpen(false);
            })
            .catch(() => setIsCameraOpen(false));
        },
        () => undefined
      );
    } catch {
      setIsCameraOpen(false);
      setStatusMsg({
        type: 'error',
        text: 'Câmera indisponível neste dispositivo. Digite ou selecione o código abaixo.',
      });
    }
  }

  async function handleStopPosCamera() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => undefined);
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsCameraOpen(false);
  }

  async function handleValidate(e?: React.FormEvent, codeOverride?: string) {
    if (e) e.preventDefault();
    const targetCode = (codeOverride ?? voucherCode).trim().toUpperCase();
    setVoucherCode(targetCode);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/merchant/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: targetCode }),
      });
      const json = await res.json();
      if (json.success) {
        setValidatedVoucher(json.data.voucher);
        setStatusMsg({
          type: 'success',
          text: `✓ Voucher ${json.data.voucher.code} válido e pronto para baixa!`,
        });
      } else {
        setValidatedVoucher(null);
        setStatusMsg({
          type: 'error',
          text: `${json.error?.code}: ${json.error?.message}`,
        });
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Falha ao consultar validade do voucher.',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleConfirmRedemption() {
    if (!voucherCode) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/merchant/vouchers/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (json.success) {
        const burned: Voucher = json.data.voucher;
        setValidatedVoucher(burned);
        setRedeemedCount((prev) => prev + 1);
        setConfirmedInPosCount((prev) => prev + 1);
        const nowTime = new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setRecentAttendances((prev) => [
          {
            id: `att_${Date.now()}`,
            code: burned.code,
            customerName: burned.visitorName,
            rewardTitle: burned.rewardTitle,
            timeLabel: nowTime,
          },
          ...prev,
        ]);
        setStatusMsg({
          type: 'success',
          text: `⚡ Baixa confirmada! O voucher ${burned.code} mudou para "Utilizado" no celular de ${burned.visitorName} na hora.`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `${json.error?.code}: ${json.error?.message}`,
        });
      }
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Falha de rede ao confirmar baixa no caixa.',
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleCreateExpressOffer(e: React.FormEvent) {
    e.preventDefault();
    setIsCreatingOffer(true);
    try {
      const res = await fetch('/api/merchant/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description:
            newDescription ||
            'Oferta exclusiva para membros do Passe Dourado.',
          pointsCost: Number(newPointsCost),
          initialStock: Number(newStock),
          voucherValidityHours: 48,
          rules:
            'Apresente o QR Code no caixa antes do pagamento. Limite de 1 uso por CPF.',
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.reward) {
        setStoreRewards((prev) => [json.data.reward, ...prev]);
        setShowNewOfferModal(false);
        setNewTitle('');
        setNewDescription('');
        setStatusMsg({
          type: 'success',
          text: `Oferta "${json.data.reward.title}" publicada com sucesso!`,
        });
      }
    } finally {
      setIsCreatingOffer(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {viewMode === 'CNPJ_LOGIN' ? (
        /* ====================================================================
           SUBTELA 04.1 — ACESSO DO LOJISTA (Conforme Passe-Dourado-lojista-acesso.png)
           ==================================================================== */
        <div className="mx-auto max-w-md space-y-5">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE4C8] px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#74520B]">
              <span className="material-symbols-outlined text-[15px]">
                shield
              </span>
              PORTAL DO LOJISTA E CAIXA
            </span>

            <h1 className="mt-4 font-serif text-3xl font-bold text-[#1F1A11]">
              Acesso do Lojista
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-[#5A5243]">
              Gerencie cupons, publique ofertas e valide vouchers de clientes em
              tempo real no caixa.
            </p>

            <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#EFE4C8] bg-[#74520B] text-white shadow-md">
              <span className="material-symbols-outlined text-3xl">
                storefront
              </span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setViewMode('POS');
              setStatusMsg({
                type: 'success',
                text: `Terminal autenticado para CNPJ ${cnpjInput}.`,
              });
            }}
            className="rounded-3xl border border-[#E6DFCE] bg-white p-6 shadow-sm space-y-4"
          >
            <div>
              <label className="block text-sm font-extrabold text-[#1F1A11]">
                CNPJ da loja
              </label>
              <div className="relative mt-1.5">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#74520B]">
                  receipt_long
                </span>
                <input
                  type="text"
                  value={cnpjInput}
                  onChange={(e) => setCnpjInput(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="w-full rounded-2xl border border-[#E2DAC6] bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-[#1F1A11]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-[#1F1A11]">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setStatusMsg({
                      type: 'info',
                      text: 'Solicitação de redefinição enviada à Administração do Shopping.',
                    })
                  }
                  className="text-xs font-extrabold text-[#74520B] underline"
                >
                  Esqueci a senha
                </button>
              </div>
              <div className="relative mt-1.5">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#74520B]">
                  lock
                </span>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full rounded-2xl border border-[#E2DAC6] bg-white py-3.5 pl-12 pr-10 text-sm font-medium text-[#1F1A11]"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs font-medium text-[#1F1A11]">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="h-5 w-5 rounded accent-[#74520B]"
              />
              <span>Lembrar este dispositivo no caixa</span>
            </label>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#74520B] py-4 text-sm font-extrabold text-white shadow-md hover:bg-[#5E4108]"
            >
              <span className="material-symbols-outlined text-[18px]">
                login
              </span>
              Acessar painel do lojista
            </button>

            <button
              type="button"
              onClick={() => setViewMode('POS')}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#D8CEB8] bg-white py-3.5 text-sm font-extrabold text-[#1F1A11]"
            >
              <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                fingerprint
              </span>
              Entrar com Touch ID / Face ID
            </button>
          </form>

          {/* Card Credenciamento Comercial (Conforme Passe-Dourado-lojista-acesso.png) */}
          <div className="rounded-3xl border border-[#E6DFCE] bg-white p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                <span className="material-symbols-outlined text-[20px]">
                  verified_user
                </span>
              </div>
              <h2 className="font-serif text-xl font-bold text-[#1F1A11]">
                Credenciamento comercial
              </h2>
            </div>

            <p className="text-xs leading-relaxed text-[#5A5243]">
              Sua loja ainda não tem acesso? As credenciais são emitidas pela{' '}
              <strong className="text-[#1F1A11]">
                Administração do Shopping
              </strong>{' '}
              (Gestão de Lojas e Contratos).
            </p>

            <div className="flex items-center justify-between rounded-2xl border border-[#E6DFCE] bg-[#F7F3EA] px-4 py-3 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-[#1F1A11]">
                <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                  call
                </span>
                (63) 3000-0000
              </div>
              <span className="text-[#6E6556]">ramal 204</span>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E6DFCE] bg-[#F7F3EA] px-4 py-3 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-[#1F1A11]">
                <span className="material-symbols-outlined text-[18px] text-[#74520B]">
                  mail
                </span>
                admin@exemplo.com.br
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#6E6556]">
                chevron_right
              </span>
            </div>
          </div>

          <div className="text-center text-xs">
            <span className="inline-flex items-center gap-1 font-extrabold text-[#256B30]">
              <span className="material-symbols-outlined text-[15px]">
                lock
              </span>
              Conexão segura
            </span>
            <p className="mt-2 text-[#5A5243]">
              É cliente ou visitante?{' '}
              <Link
                href="/passaporte"
                className="font-extrabold text-[#74520B] underline"
              >
                ← Voltar ao Passaporte
              </Link>
            </p>
          </div>
        </div>
      ) : (
        /* ====================================================================
           TELA 04 — PAINEL DO LOJISTA / VALIDAÇÃO DE CAIXA (Conforme Passe-Dourado-lojista-painel.png)
           ==================================================================== */
        <div className="space-y-6">
          {/* Header Café Exemplo */}
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#E6DFCE] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                <span className="material-symbols-outlined text-2xl">
                  storefront
                </span>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl font-bold text-[#1F1A11]">
                    {initialDashboard.store.name}
                  </h1>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E1F3E4] px-3 py-1 text-xs font-extrabold text-[#1D6329]">
                    <span className="h-2 w-2 rounded-full bg-[#256B30]" />
                    Caixa ativo e sincronizado
                  </span>
                </div>
                <p className="text-xs text-[#5A5243]">
                  Piso L2 · Caixa 01 · Lucas R. · CNPJ 12.345.678/0001-90
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('CNPJ_LOGIN')}
              className="flex items-center gap-1.5 rounded-full border border-[#D8CEB8] bg-[#FAF6EE] px-4 py-2 text-xs font-extrabold text-[#1F1A11] hover:bg-[#EFE4C8]"
            >
              <span className="material-symbols-outlined text-[16px] text-[#74520B]">
                badge
              </span>
              Acesso CNPJ / Trocar Caixa
            </button>
          </header>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* COLUNA ESQUERDA: VALIDAR CUPOM + RESULTADO VOUCHER VÁLIDO */}
            <div className="lg:col-span-6 space-y-5">
              {/* Card Validar cupom */}
              <section className="rounded-3xl border border-[#E6DFCE] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                    <span className="material-symbols-outlined text-[22px]">
                      point_of_sale
                    </span>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#1F1A11]">
                      Validar cupom
                    </h2>
                    <p className="text-xs text-[#5A5243]">
                      Use o leitor ou digite o código do cliente
                    </p>
                  </div>
                </div>

                {!isCameraOpen ? (
                  <button
                    type="button"
                    onClick={handleStartPosCamera}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#74520B] py-4 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#5E4108]"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      qr_code_scanner
                    </span>
                    Escanear QR Code do cliente
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopPosCamera}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-red-700 py-3.5 text-sm font-extrabold text-white"
                  >
                    ✕ Fechar câmera do leitor
                  </button>
                )}

                {isCameraOpen && (
                  <div className="mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-[#74520B] bg-[#FAF6EE] p-4">
                    <div
                      id="merchant-pos-qr-reader"
                      className="mx-auto max-w-xs"
                    />
                  </div>
                )}

                <div className="my-4 flex items-center gap-2">
                  <div className="h-px flex-1 bg-[#E6DFCE]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A5243]">
                    OU DIGITE O CÓDIGO DE 6 DÍGITOS
                  </span>
                  <div className="h-px flex-1 bg-[#E6DFCE]" />
                </div>

                <form
                  onSubmit={(e) => handleValidate(e)}
                  className="flex items-center gap-2.5"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) =>
                        setVoucherCode(e.target.value.toUpperCase())
                      }
                      placeholder="PASSE-84920"
                      className="w-full rounded-2xl border border-[#E2DAC6] bg-[#FAF6EE] py-3.5 pl-4 pr-10 font-sans text-base font-black uppercase tracking-wider text-[#1F1A11] focus:border-[#74520B] focus:bg-white focus:outline-none"
                    />
                    {voucherCode && (
                      <button
                        type="button"
                        onClick={() => setVoucherCode('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6556] hover:text-[#1F1A11]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 rounded-full border-2 border-[#74520B] bg-white px-5 py-3.5 text-sm font-extrabold text-[#74520B] transition hover:bg-[#EFE4C8]"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      bolt
                    </span>
                    Verificar
                  </button>
                </form>

                {/* Pílulas de Teste Rápido */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#6E6556]">
                    Códigos ativos:
                  </span>
                  {['PASSE-84920', 'PASSE-3091', 'CAPIM-84920'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleValidate(undefined, c)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        voucherCode === c
                          ? 'bg-[#74520B] text-white'
                          : 'bg-[#EFE4C8] text-[#74520B]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {statusMsg && (
                  <div
                    className={`mt-4 rounded-2xl p-3.5 text-xs font-bold ${
                      statusMsg.type === 'error'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-[#E5F2E7] text-[#194E22] border border-[#C5E2CA]'
                    }`}
                  >
                    {statusMsg.text}
                  </div>
                )}
              </section>

              {/* Card Verde: Voucher válido (Conforme Passe-Dourado-lojista-painel.png) */}
              {validatedVoucher && (
                <section className="overflow-hidden rounded-3xl border border-[#256B30]/40 bg-white shadow-md">
                  <div
                    className={`flex items-center gap-3 px-5 py-4 text-white ${
                      validatedVoucher.status === 'ACTIVE'
                        ? 'bg-[#256B30]'
                        : 'bg-[#5A5243]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      check_circle
                    </span>
                    <div>
                      <h3 className="font-sans text-base font-extrabold leading-tight">
                        {validatedVoucher.status === 'ACTIVE'
                          ? 'Voucher válido'
                          : 'Voucher já utilizado'}
                      </h3>
                      <p className="text-xs text-white/90">
                        {validatedVoucher.status === 'ACTIVE'
                          ? 'Pronto para dar baixa no caixa'
                          : 'Este código já teve baixa confirmada no PDV'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D6AF60] to-[#9E7422] text-white">
                        <span className="material-symbols-outlined text-2xl text-white/80">
                          image
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#74520B]">
                          CORTESIA RESGATADA
                        </span>
                        <h4 className="font-sans text-base font-extrabold text-[#1F1A11]">
                          {validatedVoucher.rewardTitle}
                        </h4>
                        <span className="mt-1 inline-block rounded-full bg-[#EFE4C8] px-3 py-0.5 text-[11px] font-extrabold text-[#74520B]">
                          {validatedVoucher.pointsSpent} pontos usados
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E6DFCE] bg-[#F8F5EE] p-4 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-[#E6DFCE] pb-2.5">
                        <div>
                          <span className="block text-[10px] font-extrabold uppercase text-[#6E6556]">
                            CLIENTE
                          </span>
                          <strong className="text-sm font-extrabold text-[#1F1A11]">
                            {validatedVoucher.visitorName}
                          </strong>
                        </div>
                        <span className="text-xs font-bold text-[#74520B]">
                          ☆ Nível Ouro
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] font-extrabold uppercase text-[#6E6556]">
                            VALIDADE
                          </span>
                          <strong className="text-sm font-extrabold text-[#1F1A11]">
                            Expira em 48min
                          </strong>
                        </div>
                        <span className="text-right text-[11px] text-[#5A5243]">
                          Gerado hoje
                          <br />
                          às 14:12
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-2xl border border-[#C5E2CA] bg-[#E5F2E7] p-3.5 text-xs text-[#194E22]">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#256B30] text-white">
                        <span className="material-symbols-outlined text-[14px]">
                          bolt
                        </span>
                      </div>
                      <p>
                        Ao confirmar, o voucher da{' '}
                        <strong>{validatedVoucher.visitorName}</strong> muda
                        para &ldquo;Utilizado&rdquo; no celular dela na hora.
                      </p>
                    </div>

                    {validatedVoucher.status === 'ACTIVE' && (
                      <div className="space-y-2.5 pt-1">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handleConfirmRedemption}
                          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#256B30] py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-[#1E5827] active:scale-98 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            check_circle
                          </span>
                          {isProcessing
                            ? 'Confirmando baixa...'
                            : 'Confirmar uso e baixar cupom'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setValidatedVoucher(null)}
                          className="w-full rounded-full border border-[#D8CEB8] bg-white py-3.5 text-xs font-extrabold text-[#1F1A11]"
                        >
                          Cancelar verificação
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* COLUNA DIREITA: KPIs + CAMPANHAS NA LOJA + ÚLTIMOS ATENDIMENTOS */}
            <div className="lg:col-span-6 space-y-5">
              {/* 3 KPIs de Turno (Conforme Passe-Dourado-lojista-painel.png) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-3xl border border-[#E6DFCE] bg-white p-4 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase text-[#5A5243]">
                    RESGATADOS
                  </span>
                  <p className="mt-1 font-serif text-3xl font-bold text-[#1F1A11]">
                    {redeemedCount}
                  </p>
                  <span className="text-[11px] text-[#5A5243]">
                    hoje no shopping
                  </span>
                </div>

                <div className="rounded-3xl border border-[#E6DFCE] bg-white p-4 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase text-[#5A5243]">
                    NO CAIXA
                  </span>
                  <p className="mt-1 font-serif text-3xl font-bold text-[#1F1A11]">
                    {confirmedInPosCount}
                  </p>
                  <span className="text-[11px] font-bold text-[#256B30]">
                    78% com baixa
                  </span>
                </div>

                <div className="rounded-3xl border border-[#E6DFCE] bg-white p-4 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase text-[#5A5243]">
                    CHECK-INS
                  </span>
                  <p className="mt-1 font-serif text-3xl font-bold text-[#1F1A11]">
                    {checkInsCount}
                  </p>
                  <span className="text-[11px] text-[#5A5243]">
                    QR na bancada
                  </span>
                </div>
              </div>

              {/* Card Campanhas na loja */}
              <section className="rounded-3xl border border-[#E6DFCE] bg-white p-6 shadow-sm">
                <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                  Campanhas na loja
                </h2>
                <p className="text-xs text-[#5A5243]">
                  Estoque atualizado na hora
                </p>

                <button
                  type="button"
                  onClick={() => setShowNewOfferModal(true)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#74520B] bg-white py-3 text-xs font-extrabold text-[#74520B] hover:bg-[#EFE4C8]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    add
                  </span>
                  Oferta Express
                </button>

                {/* Pílulas Ativas (3) | Agendadas (1) | Encerradas */}
                <div className="mt-4 flex rounded-full bg-[#F5F1E8] p-1">
                  {[
                    {
                      id: 'ACTIVE',
                      label: `Ativas (${storeRewards.length})`,
                    },
                    { id: 'SCHEDULED', label: 'Agendadas (1)' },
                    { id: 'ENDED', label: 'Encerradas' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setCampaignTab(
                          t.id as 'ACTIVE' | 'SCHEDULED' | 'ENDED'
                        )
                      }
                      className={`flex-1 rounded-full py-2 text-xs font-extrabold transition ${
                        campaignTab === t.id
                          ? 'bg-[#74520B] text-white shadow-sm'
                          : 'text-[#1F1A11]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {storeRewards.slice(0, 3).map((rew, idx) => (
                    <div
                      key={rew.id}
                      className="flex items-center justify-between rounded-2xl border border-[#E6DFCE] bg-[#F8F5EE] p-3.5"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D6AF60] to-[#9E7422] text-white">
                          <span className="material-symbols-outlined text-2xl text-white/80">
                            image
                          </span>
                        </div>
                        <div>
                          <h3 className="font-sans text-sm font-extrabold text-[#1F1A11]">
                            {rew.title}
                          </h3>
                          <p
                            className={`text-xs ${
                              idx === 1
                                ? 'font-bold text-red-700'
                                : 'text-[#5A5243]'
                            }`}
                          >
                            {idx === 1
                              ? `Apenas ${rew.availableStock} unidades disponíveis`
                              : `${rew.availableStock} unidades restantes`}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              idx === 1
                                ? 'bg-red-100 text-red-800'
                                : 'bg-[#E1F3E4] text-[#256B30]'
                            }`}
                          >
                            {idx === 1 ? 'Esgotando' : 'No ar'}
                          </span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[#5A5243]">
                        more_vert
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Card Últimos atendimentos */}
              <section className="rounded-3xl border border-[#E6DFCE] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-serif text-2xl font-bold text-[#1F1A11]">
                    Últimos atendimentos
                  </h2>
                  <span className="text-xs font-extrabold text-[#74520B] underline">
                    Histórico completo ›
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {recentAttendances.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-[#E6DFCE] bg-[#F8F5EE] p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E1F3E4] text-[#256B30]">
                          <span className="material-symbols-outlined text-[18px]">
                            check
                          </span>
                        </div>
                        <div>
                          <strong className="block text-sm font-extrabold text-[#1F1A11]">
                            {item.customerName}
                          </strong>
                          <span className="text-xs text-[#5A5243]">
                            {item.rewardTitle} · Voucher #{item.code}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <strong className="block text-sm font-extrabold text-[#1F1A11]">
                          {item.timeLabel}
                        </strong>
                        <span className="text-xs font-extrabold text-[#256B30]">
                          Concluído
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#EFE4C8] px-4 py-3">
                  <span className="text-xs font-bold text-[#5A5243]">
                    Valor a compensar hoje (vouchers validados)
                  </span>
                  <span className="font-serif text-xl font-bold text-[#74520B]">
                    R$ 518,40
                  </span>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVA OFERTA EXPRESS */}
      {showNewOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-bold text-[#1F1A11]">
                Nova Oferta Express
              </h3>
              <button
                type="button"
                onClick={() => setShowNewOfferModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#5A5243]"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleCreateExpressOffer}
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-bold text-[#1F1A11]">
                  Título da Oferta
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex.: Combo Cappuccino + Alfajor"
                  className="mt-1 w-full rounded-xl border border-[#E2DAC6] bg-white px-3.5 py-2.5 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F1A11]">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Ex.: Válido todos os dias até as 20h"
                  className="mt-1 w-full rounded-xl border border-[#E2DAC6] bg-white px-3.5 py-2.5 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1F1A11]">
                    Pontos
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={newPointsCost}
                    onChange={(e) => setNewPointsCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#E2DAC6] bg-white px-3.5 py-2.5 text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1F1A11]">
                    Lote (unidades)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#E2DAC6] bg-white px-3.5 py-2.5 text-sm font-bold"
                    required
                  />
                </div>
              </div>

              <div className="mt-5 flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={isCreatingOffer}
                  className="flex-1 rounded-full bg-[#74520B] py-3 text-xs font-extrabold text-white"
                >
                  {isCreatingOffer ? 'Salvando...' : 'Publicar Oferta'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewOfferModal(false)}
                  className="rounded-full border border-[#D8CEB8] bg-white px-5 py-3 text-xs font-bold text-[#5A5243]"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
