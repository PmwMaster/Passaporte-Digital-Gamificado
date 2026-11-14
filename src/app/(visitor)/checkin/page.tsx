'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  mockCheckIns,
  mockStores,
} from '@/infrastructure/database/mock-data';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { CheckIn, Mission, Stamp } from '@/shared/types/domain';

interface CheckInSuccessResult {
  checkIn: CheckIn;
  stampEarned: Stamp;
  completedMissions: Mission[];
  newBalance: number;
}

function CheckInPageContent() {
  const searchParams = useSearchParams();
  const qrParam = searchParams?.get('qr');

  const [selectedToken, setSelectedToken] = useState(
    qrParam && mockStores.some((s) => s.qrCodeToken === qrParam)
      ? qrParam
      : mockStores[0].qrCodeToken
  );

  useEffect(() => {
    if (qrParam && mockStores.some((s) => s.qrCodeToken === qrParam)) {
      setSelectedToken(qrParam);
    }
  }, [qrParam]);

  const [latitude, setLatitude] = useState<number>(
    SHOPPING_CONFIG.defaultCoordinates.latitude
  );
  const [longitude, setLongitude] = useState<number>(
    SHOPPING_CONFIG.defaultCoordinates.longitude
  );
  const [accuracyMeters, setAccuracyMeters] = useState<number>(15);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInSuccessResult | null>(
    null
  );
  const [recentHistory, setRecentHistory] = useState<CheckIn[]>(mockCheckIns);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scannerInstanceRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);

  useEffect(() => {
    fetch('/api/checkins', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.checkIns)) {
          setRecentHistory(json.data.checkIns);
        }
      })
      .catch(() => undefined);

    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => undefined);
      }
    };
  }, []);

  async function handleStartCameraScanner() {
    setIsCameraOpen(true);
    setIsError(false);
    setStatusMessage(
      'Aponte a câmera para o QR Code oficial do balcão da loja...'
    );

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const qr = new Html5Qrcode('capim-qr-reader');
      scannerInstanceRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          setSelectedToken(decodedText.trim());
          setStatusMessage(`QR Code lido pela câmera: ${decodedText.trim()}`);
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
      setIsError(true);
      setStatusMessage(
        'Câmera indisponível ou sem HTTPS neste dispositivo. Selecione a loja abaixo para validar seu check-in.'
      );
    }
  }

  async function handleStopCameraScanner() {
    if (scannerInstanceRef.current) {
      await scannerInstanceRef.current.stop().catch(() => undefined);
      scannerInstanceRef.current.clear();
      scannerInstanceRef.current = null;
    }
    setIsCameraOpen(false);
  }

  function handleCaptureBrowserGps() {
    if (!navigator.geolocation) {
      setIsError(true);
      setStatusMessage('Geolocalização não suportada neste navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setAccuracyMeters(Math.round(pos.coords.accuracy || 15));
        setIsError(false);
        setStatusMessage('Coordenadas GPS reais capturadas pelo navegador!');
      },
      () => {
        setIsError(true);
        setStatusMessage(
          'Permissão de GPS negada ou sem HTTPS na rede local. Use os botões de simulação rápida abaixo.'
        );
      }
    );
  }

  async function handleCheckInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeToken: selectedToken,
          latitude: Number(latitude),
          longitude: Number(longitude),
          accuracyMeters: Number(accuracyMeters),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsError(false);
        setLastResult(json.data as CheckInSuccessResult);
        window.dispatchEvent(new Event('passport:points-updated'));
        const bonusMsg =
          json.data.completedMissions?.length > 0
            ? ` + Bônus de ${json.data.completedMissions.length} missão(ões) concluída(s)!`
            : '';
        setStatusMessage(
          `✓ Check-in APROVADO em ${json.data.checkIn.storeName}! Distância Haversine: ${json.data.checkIn.distanceMeters}m (<= 250m). +${json.data.checkIn.pointsAwarded} pts creditados${bonusMsg} (Novo saldo: ${json.data.newBalance} pts).`
        );
      } else {
        setIsError(true);
        setLastResult(null);
        setStatusMessage(`${json.error?.code}: ${json.error?.message}`);
      }

      const historyRes = await fetch('/api/checkins', { cache: 'no-store' });
      const historyJson = await historyRes.json();
      if (historyJson.success) {
        setRecentHistory(historyJson.data.checkIns);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedStore =
    mockStores.find((s) => s.qrCodeToken === selectedToken) ?? mockStores[0];

  return (
    <div className="mx-auto max-w-4xl pb-12">
      {/* Cabeçalho Aura Dourada */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <Link
            href="/passaporte"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Check-in Presencial • QR Code + Geofence Haversine 250m
            </span>
            <h1 className="font-headline text-xl font-extrabold text-on-surface">
              Escanear QR & Validar Presença
            </h1>
          </div>
        </div>

        <Link
          href="/passaporte?tab=stamps"
          className="flex items-center gap-1.5 rounded-xl bg-primary-fixed px-3.5 py-2 text-xs font-extrabold text-on-primary-fixed"
        >
          <span className="material-symbols-outlined text-[16px] text-primary icon-filled">
            approval
          </span>
          Ver Meus Carimbos
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coluna Principal: Scanner + Seletor + Validação */}
        <div className="lg:col-span-7 space-y-5">
          <section className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-headline text-lg font-extrabold text-on-surface">
                  1. Leitor de QR Code da Loja
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Escaneie o totem no balcão ou selecione a loja parceira abaixo.
                </p>
              </div>

              {!isCameraOpen ? (
                <button
                  type="button"
                  onClick={handleStartCameraScanner}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-95"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    photo_camera
                  </span>
                  Abrir Câmera QR
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopCameraScanner}
                  className="flex items-center gap-1.5 rounded-xl bg-error px-4 py-2.5 text-xs font-bold text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                  Fechar Câmera
                </button>
              )}
            </div>

            {isCameraOpen && (
              <div className="mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-primary bg-surface-container-low p-4">
                <div id="capim-qr-reader" className="mx-auto max-w-xs" />
              </div>
            )}

            {/* Grade Rápida de Lojas para Simulação/Seleção */}
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {mockStores.map((store) => {
                const isSelected = store.qrCodeToken === selectedToken;
                return (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setSelectedToken(store.qrCodeToken)}
                    className={`flex flex-col items-start justify-between rounded-2xl border p-3 text-left transition ${
                      isSelected
                        ? 'border-primary bg-primary-fixed/40 shadow-sm'
                        : 'border-outline-variant/30 bg-surface-container-low hover:border-primary/40'
                    }`}
                  >
                    <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-primary">
                      +{store.checkInPoints} pts
                    </span>
                    <p className="mt-1.5 font-headline text-xs font-extrabold text-on-surface line-clamp-1">
                      {store.name}
                    </p>
                    <span className="text-[10px] text-on-surface-variant">
                      {store.floor}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleCheckInSubmit} className="mt-5 space-y-4">
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Loja Selecionada no Leitor
                  </span>
                  <code className="font-mono text-[11px] font-bold text-primary">
                    {selectedStore.qrCodeToken}
                  </code>
                </div>
                <p className="mt-1 font-headline text-sm font-extrabold text-on-surface">
                  {selectedStore.name} ({selectedStore.floor}) — +
                  {selectedStore.checkInPoints} pontos + 1 Carimbo
                </p>
              </div>

              {/* Coordenadas GPS */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-on-surface">
                    2. Posição GPS (Geocerca Haversine &le; 250m)
                  </span>
                  <span className="text-[10px] text-on-surface-variant">
                    Centro: -10.18448, -48.33368
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-on-surface-variant">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.00001"
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-on-surface-variant">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.00001"
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-on-surface-variant">
                      Precisão (m)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={accuracyMeters}
                      onChange={(e) =>
                        setAccuracyMeters(Number(e.target.value))
                      }
                      className="mt-1 w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-on-surface"
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(-10.18442);
                      setLongitude(-48.33365);
                      setAccuracyMeters(12);
                      setIsError(false);
                      setStatusMessage(
                        'Coordenada ajustada para dentro do Passe Dourado Shopping (~12m do centro).'
                      );
                    }}
                    className="rounded-xl bg-secondary-container px-3 py-1.5 text-[11px] font-bold text-on-secondary-container"
                  >
                    📍 Dentro do Shopping (~12m)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(-10.2125);
                      setLongitude(-48.355);
                      setAccuracyMeters(15);
                      setIsError(false);
                      setStatusMessage(
                        'Coordenada ajustada para fora do raio (> 250m) para testar bloqueio antifraude.'
                      );
                    }}
                    className="rounded-xl bg-error-container px-3 py-1.5 text-[11px] font-bold text-on-error-container"
                  >
                    🚫 Simular Fora do Raio (&gt;250m)
                  </button>
                  <button
                    type="button"
                    onClick={handleCaptureBrowserGps}
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-[11px] font-bold text-on-surface"
                  >
                    🛰️ GPS do Dispositivo
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div
                  className={`rounded-2xl p-4 text-xs font-bold ${
                    isError
                      ? 'border border-error/30 bg-error-container/50 text-on-error-container'
                      : 'border border-secondary/30 bg-secondary-container/40 text-on-secondary-container'
                  }`}
                >
                  {statusMessage}
                </div>
              )}

              {lastResult && !isError && (
                <div className="rounded-2xl border-2 border-primary/40 bg-primary-fixed/25 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-headline text-base font-extrabold text-primary">
                      ✦ Carimbo Conquistado: {lastResult.stampEarned.badgeTitle}
                    </span>
                    <span className="rounded-full bg-secondary px-3 py-1 font-extrabold text-white">
                      +{lastResult.checkIn.pointsAwarded} pts
                    </span>
                  </div>
                  <p className="mt-1 text-on-surface-variant">
                    Distância validada: {lastResult.checkIn.distanceMeters}m •
                    Novo Saldo: <strong>{lastResult.newBalance} pts</strong>
                  </p>

                  {lastResult.completedMissions.length > 0 && (
                    <div className="mt-3 rounded-xl bg-secondary-container/60 p-3 text-on-secondary-container">
                      <p className="font-extrabold">
                        🎉 Missão Concluída Automaticamente:
                      </p>
                      {lastResult.completedMissions.map((m) => (
                        <p key={m.id} className="mt-0.5">
                          • <strong>{m.title}</strong> (+{m.rewardPoints} pts
                          bônus creditados)
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3.5 text-sm font-extrabold text-white shadow-md transition hover:opacity-95 active:scale-98 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  verified_user
                </span>
                {isSubmitting
                  ? 'Validando Presença...'
                  : `Confirmar Check-in (+${selectedStore.checkInPoints} pts)`}
              </button>
            </form>
          </section>
        </div>

        {/* Coluna Lateral: Histórico de Check-ins e Regras */}
        <div className="lg:col-span-5 space-y-5">
          <section className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-card">
            <h3 className="font-headline text-base font-extrabold text-on-surface">
              Últimos Check-ins Validados
            </h3>
            <div className="mt-3 space-y-2.5">
              {recentHistory.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <p className="font-bold text-on-surface">
                      {item.storeName}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">
                      {item.checkInDate} • {item.distanceMeters}m do centro
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      item.status === 'VALID'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {item.status === 'VALID'
                      ? `+${item.pointsAwarded} pts`
                      : item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-5 shadow-card">
            <h3 className="font-headline text-base font-extrabold text-on-surface">
              Motor Antifraude Ativo
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-on-surface-variant">
              <li>
                <strong className="text-on-surface">1. Geocerca 250m:</strong>{' '}
                Fórmula esférica de Haversine calculada no servidor.
              </li>
              <li>
                <strong className="text-on-surface">
                  2. Precisão GPS &le; 150m:
                </strong>{' '}
                Sinais degradados são bloqueados automaticamente.
              </li>
              <li>
                <strong className="text-on-surface">
                  3. 1 Check-in / Loja / Dia:
                </strong>{' '}
                Controle diário no fuso de Palmas (`America/Araguaina`).
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-sm text-on-surface-variant">
          Carregando Leitor QR & GPS...
        </div>
      }
    >
      <CheckInPageContent />
    </Suspense>
  );
}
