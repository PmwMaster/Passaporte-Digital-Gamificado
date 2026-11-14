'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { mockStores } from '@/infrastructure/database/mock-data';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { EditorialCard } from '@/components/ui/EditorialCard';
import { StoreQrTotem } from '@/components/shared/StoreQrTotem';
import { CameraQrScanner } from '@/components/shared/CameraQrScanner';

function CheckInContent() {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token') || searchParams.get('store');

  const [activeTab, setActiveTab] = useState<'camera' | 'totem' | 'manual'>('camera');
  const [selectedToken, setSelectedToken] = useState<string>(() => {
    if (urlToken) {
      const found = mockStores.find(
        (s) => s.qrCodeToken.toUpperCase() === urlToken.trim().toUpperCase()
      );
      if (found) return found.qrCodeToken;
    }
    return mockStores[0].qrCodeToken;
  });

  const [latitude, setLatitude] = useState<number>(SHOPPING_CONFIG.defaultCoordinates.latitude);
  const [longitude, setLongitude] = useState<number>(SHOPPING_CONFIG.defaultCoordinates.longitude);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Se veio token na URL, seleciona a loja e notifica o visitante
  useEffect(() => {
    if (urlToken) {
      const found = mockStores.find(
        (s) => s.qrCodeToken.toUpperCase() === urlToken.trim().toUpperCase()
      );
      if (found) {
        setSelectedToken(found.qrCodeToken);
        setStatusMessage(`Loja ${found.name} identificada pelo QR Code! Confirme seu check-in.`);
        setIsError(false);
      }
    }
  }, [urlToken]);

  const selectedStore = mockStores.find((s) => s.qrCodeToken === selectedToken) || mockStores[0];

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
        setIsError(false);
        setStatusMessage('Sua localização foi capturada com sucesso pelo GPS.');
      },
      () => {
        setIsError(true);
        setStatusMessage('Permissão de GPS não concedida. Usando coordenadas padrão do shopping.');
      }
    );
  }

  async function executeCheckIn(tokenToUse: string) {
    setIsSubmitting(true);
    setNeedsLogin(false);
    setStatusMessage('Validando QR Code e geolocalização no Passe Dourado...');

    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeToken: tokenToUse,
          latitude: Number(latitude),
          longitude: Number(longitude),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsError(false);
        setShowCamera(false);
        setStatusMessage(
          `🎉 Check-in confirmado em ${json.data.checkIn.storeName}! +${json.data.checkIn.pointsAwarded} pts adicionados ao seu passaporte. (Novo saldo: ${json.data.newBalance} pts)`
        );
      } else {
        setIsError(true);
        if (res.status === 401) {
          setNeedsLogin(true);
          setStatusMessage('Você precisa estar logado na sua conta para pontuar no check-in.');
        } else {
          setStatusMessage(json.error?.message ?? 'Erro ao realizar check-in.');
        }
      }
    } catch {
      setIsError(true);
      setStatusMessage('Erro de conexão ao validar check-in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleScanSuccess(scannedRaw: string) {
    // Pode vir como token puro "QR-CD-STORE-01-VERIFIED" ou link "https://.../checkin?token=QR-CD-STORE-01-VERIFIED"
    let token = scannedRaw.trim();
    try {
      if (scannedRaw.includes('token=')) {
        const url = new URL(scannedRaw);
        const t = url.searchParams.get('token');
        if (t) token = t;
      }
    } catch {
      // Ignora erro de parse de URL se for string simples
    }

    const store = mockStores.find(
      (s) => s.qrCodeToken.toUpperCase() === token.toUpperCase()
    );

    if (store) {
      setSelectedToken(store.qrCodeToken);
      setShowCamera(false);
      executeCheckIn(store.qrCodeToken);
    } else {
      setIsError(true);
      setStatusMessage(`QR Code lido ("${token.slice(0, 30)}..."), mas não pertence a uma loja parceira cadastrada.`);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <EditorialCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold text-brand-ink">
              Check-in Presencial
            </h1>
            <p className="mt-1 text-xs text-brand-muted">
              Pontue visitando as lojas parceiras do Passe Dourado Shopping.
            </p>
          </div>
          <span className="self-start rounded-full bg-brand-emerald/15 px-3 py-1 text-[11px] font-bold text-brand-emerald">
            Cerca Virtual 250m
          </span>
        </div>

        {/* Seletor de Modo */}
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-surface-container-high p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              setShowCamera(true);
            }}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'camera'
                ? 'bg-white text-brand-ink shadow-sm'
                : 'text-brand-muted hover:text-brand-ink'
            }`}
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
            <span>Escanear QR</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('totem');
              setShowCamera(false);
            }}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'totem'
                ? 'bg-white text-brand-ink shadow-sm'
                : 'text-brand-muted hover:text-brand-ink'
            }`}
          >
            <span className="material-symbols-outlined text-base">qr_code_2</span>
            <span>Totem da Loja</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setShowCamera(false);
            }}
            className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-brand-ink shadow-sm'
                : 'text-brand-muted hover:text-brand-ink'
            }`}
          >
            <span className="material-symbols-outlined text-base">touch_app</span>
            <span>Simulador</span>
          </button>
        </div>

        {/* FEEDBACK DE STATUS */}
        {statusMessage && (
          <div
            className={`mt-5 rounded-xl p-4 text-xs font-semibold ${
              isError
                ? 'border border-red-300 bg-red-50 text-red-800'
                : 'border border-emerald-300 bg-emerald-50 text-emerald-900'
            }`}
          >
            <p>{statusMessage}</p>
            {needsLogin && (
              <div className="mt-3 flex gap-2">
                <Link
                  href="/login?redirectTo=/checkin"
                  className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-on-primary shadow-sm"
                >
                  Entrar na Conta
                </Link>
                <Link
                  href="/cadastro?redirectTo=/checkin"
                  className="rounded-lg bg-primary-fixed px-3.5 py-1.5 text-xs font-bold text-on-primary-fixed"
                >
                  Criar Conta (+50 pts)
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ABA 1: CÂMERA SCANNER */}
        {activeTab === 'camera' && (
          <div className="mt-5 space-y-4">
            {showCamera ? (
              <CameraQrScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setShowCamera(false)}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-brand-border bg-brand-ivory p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-goldDark text-white shadow-md">
                  <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
                </div>
                <h3 className="mt-4 font-serif text-base font-bold text-brand-ink">
                  Leitor de QR Code pela Câmera
                </h3>
                <p className="mt-1 text-xs text-brand-muted max-w-sm mx-auto">
                  Aponte a câmera do seu celular para a plaquinha no balcão da loja para pontuar instantaneamente.
                </p>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-goldDark hover:bg-brand-goldLight px-5 py-3 text-xs font-bold text-white shadow-md transition"
                >
                  <span className="material-symbols-outlined text-base">photo_camera</span>
                  <span>Abrir Câmera para Escanear</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ABA 2: TOTEM / PLAQUINHA VISUAL DA LOJA */}
        {activeTab === 'totem' && (
          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Selecione a Loja para Exibir o Totem Oficial:
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm font-semibold text-brand-ink"
              >
                {mockStores.map((store) => (
                  <option key={store.id} value={store.qrCodeToken}>
                    {store.name} (+{store.checkInPoints} pts) • {store.category}
                  </option>
                ))}
              </select>
            </div>

            <StoreQrTotem store={selectedStore} />

            <div className="text-center">
              <button
                type="button"
                onClick={() => executeCheckIn(selectedStore.qrCodeToken)}
                disabled={isSubmitting}
                className="rounded-xl bg-brand-emerald hover:bg-emerald-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Validando...' : `Confirmar Check-in em ${selectedStore.name}`}
              </button>
            </div>
          </div>
        )}

        {/* ABA 3: SIMULADOR / MANUAL */}
        {activeTab === 'manual' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeCheckIn(selectedToken);
            }}
            className="mt-5 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Loja Parceira
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
              >
                {mockStores.map((store) => (
                  <option key={store.id} value={store.qrCodeToken}>
                    {store.name} (+{store.checkInPoints} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCaptureBrowserGps}
                className="rounded-lg border border-brand-border bg-brand-ivory px-3 py-1.5 text-xs font-semibold text-brand-ink hover:border-brand-goldDark"
              >
                Usar Meu GPS Real
              </button>
              <button
                type="button"
                onClick={() => {
                  setLatitude(SHOPPING_CONFIG.defaultCoordinates.latitude);
                  setLongitude(SHOPPING_CONFIG.defaultCoordinates.longitude);
                }}
                className="rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 px-3 py-1.5 text-xs font-semibold text-brand-emerald"
              >
                Posição no Shopping (Palmas - TO)
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-emerald py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Validando...' : 'Confirmar Check-in Manual'}
            </button>
          </form>
        )}
      </EditorialCard>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-brand-muted">
          Carregando módulo de Check-in...
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}
