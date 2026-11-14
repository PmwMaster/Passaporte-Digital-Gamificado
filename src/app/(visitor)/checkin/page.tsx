'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  mockCheckIns,
  mockStores,
} from '@/infrastructure/database/mock-data';
import { CheckIn, Mission, Stamp } from '@/shared/types/domain';

interface CheckInSuccessResult {
  checkIn: CheckIn;
  stampEarned: Stamp;
  completedMissions: Mission[];
  newBalance: number;
}

interface LiveGpsPosition {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: number;
}

function CheckInPageContent() {
  const searchParams = useSearchParams();
  const qrParam = searchParams?.get('qr');

  const [scannedToken, setScannedToken] = useState<string | null>(
    qrParam && mockStores.some((s) => s.qrCodeToken === qrParam)
      ? qrParam
      : null
  );
  const [liveGps, setLiveGps] = useState<LiveGpsPosition | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
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
    if (qrParam && mockStores.some((s) => s.qrCodeToken === qrParam)) {
      setScannedToken(qrParam);
    }
  }, [qrParam]);

  function requestFreshGpsPosition(): Promise<LiveGpsPosition> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(
          new Error(
            'Geolocalização não suportada neste navegador. O uso da localização em tempo real é obrigatório para realizar o check-in.'
          )
        );
        return;
      }

      setIsCapturingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsCapturingGps(false);
          const fresh: LiveGpsPosition = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            accuracyMeters: Math.round(pos.coords.accuracy || 15),
            capturedAt: Date.now(),
          };
          setLiveGps(fresh);
          resolve(fresh);
        },
        () => {
          setIsCapturingGps(false);
          setLiveGps(null);
          reject(
            new Error(
              'Permissão de localização GPS negada ou desativada. É obrigatório permitir o acesso à localização no momento do check-in.'
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  }

  useEffect(() => {
    fetch('/api/checkins', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data?.checkIns)) {
          setRecentHistory(json.data.checkIns);
        }
      })
      .catch(() => undefined);

    requestFreshGpsPosition().catch((err: Error) => {
      setIsError(true);
      setStatusMessage(err.message);
    });

    return () => {
      if (scannerInstanceRef.current) {
        scannerInstanceRef.current.stop().catch(() => undefined);
      }
    };
  }, []);

  async function submitCheckInWithFreshGps(qrTokenToSubmit: string) {
    setIsSubmitting(true);
    setIsError(false);
    setStatusMessage('Coletando localização GPS em tempo real e validando presença...');

    try {
      const freshGps = await requestFreshGpsPosition();

      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeToken: qrTokenToSubmit,
          latitude: freshGps.latitude,
          longitude: freshGps.longitude,
          accuracyMeters: freshGps.accuracyMeters,
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
    } catch (err) {
      setIsError(true);
      setLastResult(null);
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível validar sua localização GPS no momento do check-in.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStartCameraScanner() {
    setIsError(false);
    setStatusMessage(
      'Verificando permissão obrigatória de localização GPS antes de abrir o leitor...'
    );

    try {
      await requestFreshGpsPosition();
    } catch (err) {
      setIsError(true);
      setStatusMessage(
        err instanceof Error
          ? err.message
          : 'Ative a localização GPS do dispositivo para escanear o QR Code.'
      );
      return;
    }

    setIsCameraOpen(true);
    setStatusMessage(
      'Aponte a câmera para o QR Code oficial no totem ou balcão da loja...'
    );

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const qr = new Html5Qrcode('capim-qr-reader');
      scannerInstanceRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          const cleanToken = decodedText.trim();
          setScannedToken(cleanToken);
          qr.stop()
            .then(() => {
              qr.clear();
              setIsCameraOpen(false);
              void submitCheckInWithFreshGps(cleanToken);
            })
            .catch(() => {
              setIsCameraOpen(false);
              void submitCheckInWithFreshGps(cleanToken);
            });
        },
        () => undefined
      );
    } catch {
      setIsCameraOpen(false);
      setIsError(true);
      setStatusMessage(
        'Não foi possível acessar a câmera neste dispositivo. Permita o uso da câmera e da localização para escanear o QR Code.'
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

  const scannedStore = scannedToken
    ? mockStores.find(
        (s) => s.qrCodeToken.toUpperCase() === scannedToken.toUpperCase()
      ) ?? null
    : null;

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
              Check-in Presencial • QR Code + GPS em Tempo Real Obrigatório
            </span>
            <h1 className="font-headline text-xl font-extrabold text-on-surface">
              Check-in na Loja
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
        {/* Coluna Principal: Scanner QR Code + Status de Localização Obrigatória */}
        <div className="lg:col-span-7 space-y-5">
          <section className="rounded-3xl border border-outline-variant/25 bg-surface-container-lowest p-6 shadow-card space-y-5">
            <div>
              <h2 className="font-headline text-lg font-extrabold text-on-surface">
                Escanear QR Code da Loja
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Para aprovar seu check-in e pontuar, é obrigatório estar com a
                localização ativa no momento da leitura do QR Code no balcão.
              </p>
            </div>

            {/* Indicador de Requisito de Localização em Tempo Real */}
            <div
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs ${
                liveGps
                  ? 'border-secondary/30 bg-secondary-container/30 text-on-secondary-container'
                  : 'border-error/30 bg-error-container/40 text-on-error-container'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[22px]">
                  {liveGps ? 'my_location' : 'location_disabled'}
                </span>
                <div>
                  <p className="font-extrabold">
                    {isCapturingGps
                      ? 'Coletando localização GPS atual...'
                      : liveGps
                      ? 'Localização GPS ativa e verificada na hora'
                      : 'Localização GPS obrigatória pendente'}
                  </p>
                  <p className="mt-0.5 text-[11px] opacity-90">
                    {liveGps
                      ? `Precisão atual: ±${liveGps.accuracyMeters}m • Coletada às ${new Date(
                          liveGps.capturedAt
                        ).toLocaleTimeString('pt-BR')}`
                      : 'Ative o GPS do celular/navegador para liberar a leitura e aprovação do check-in.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isCapturingGps}
                onClick={() => {
                  setIsError(false);
                  requestFreshGpsPosition()
                    .then(() => {
                      setStatusMessage(
                        'Localização em tempo real confirmada! Agora escaneie o QR Code da loja.'
                      );
                    })
                    .catch((err: Error) => {
                      setIsError(true);
                      setStatusMessage(err.message);
                    });
                }}
                className="shrink-0 rounded-xl border border-current/25 bg-white/80 px-3 py-2 text-[11px] font-extrabold text-on-surface shadow-sm transition hover:bg-white"
              >
                {isCapturingGps ? 'Obtendo...' : 'Atualizar GPS'}
              </button>
            </div>

            {/* Área da Câmera quando aberta */}
            {isCameraOpen && (
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-primary bg-surface-container-low p-4">
                <div id="capim-qr-reader" className="mx-auto max-w-xs" />
              </div>
            )}

            {/* Caso tenha vindo de um link com QR Code ou acabado de ler um QR Code */}
            {scannedStore && (
              <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    QR Code Identificado
                  </span>
                  <code className="font-mono text-[11px] font-bold text-primary">
                    {scannedStore.qrCodeToken}
                  </code>
                </div>
                <p className="mt-1 font-headline text-sm font-extrabold text-on-surface">
                  {scannedStore.name} ({scannedStore.floor}) — +
                  {scannedStore.checkInPoints} pontos + 1 Carimbo
                </p>

                <button
                  type="button"
                  disabled={isSubmitting || isCapturingGps}
                  onClick={() =>
                    submitCheckInWithFreshGps(scannedStore.qrCodeToken)
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    verified_user
                  </span>
                  {isSubmitting
                    ? 'Coletando GPS e Validando...'
                    : `Confirmar Check-in com Localização Atual (+${scannedStore.checkInPoints} pts)`}
                </button>
              </div>
            )}

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
                  Distância validada na hora:{' '}
                  {lastResult.checkIn.distanceMeters}m • Novo Saldo:{' '}
                  <strong>{lastResult.newBalance} pts</strong>
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

            {/* Botão Único Principal para Escanear o QR Code */}
            {!isCameraOpen ? (
              <button
                type="button"
                disabled={isSubmitting || isCapturingGps}
                onClick={handleStartCameraScanner}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-secondary py-4 text-sm font-extrabold text-white shadow-md transition hover:opacity-95 active:scale-98 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[22px]">
                  qr_code_scanner
                </span>
                {isSubmitting
                  ? 'Validando Presença...'
                  : 'Escanear QR Code da Loja'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopCameraScanner}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-error py-4 text-sm font-extrabold text-white shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
                Fechar Câmera
              </button>
            )}
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
              Requisito Antifraude de Localização
            </h3>
            <ul className="mt-3 space-y-2 text-xs text-on-surface-variant">
              <li>
                <strong className="text-on-surface">
                  1. GPS Coletado na Hora:
                </strong>{' '}
                A posição geográfica é capturada em tempo real pelo navegador no
                instante do check-in (sem coordenadas manuais).
              </li>
              <li>
                <strong className="text-on-surface">2. Geocerca 250m:</strong>{' '}
                Fórmula esférica de Haversine calculada no servidor.
              </li>
              <li>
                <strong className="text-on-surface">
                  3. Precisão GPS &le; 150m:
                </strong>{' '}
                Sinais degradados ou ausentes são bloqueados automaticamente.
              </li>
              <li>
                <strong className="text-on-surface">
                  4. 1 Check-in / Loja / Dia:
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
