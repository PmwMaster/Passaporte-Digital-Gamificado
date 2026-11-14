'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { mockStores } from '@/infrastructure/database/mock-data';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function CheckInPage() {
  const [selectedToken, setSelectedToken] = useState(mockStores[0].qrCodeToken);
  const [latitude, setLatitude] = useState<number>(SHOPPING_CONFIG.defaultCoordinates.latitude);
  const [longitude, setLongitude] = useState<number>(SHOPPING_CONFIG.defaultCoordinates.longitude);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

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
        setStatusMessage('Localização capturada com sucesso.');
      },
      () => {
        setIsError(true);
        setStatusMessage('Permissão de GPS negada. Ative a localização ou utilize a posição no shopping.');
      }
    );
  }

  async function handleCheckInSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNeedsLogin(false);

    const res = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCodeToken: selectedToken,
        latitude: Number(latitude),
        longitude: Number(longitude),
      }),
    });

    const json = await res.json();
    if (json.success) {
      setIsError(false);
      setStatusMessage(
        `Check-in confirmado em ${json.data.checkIn.storeName}! +${json.data.checkIn.pointsAwarded} pts creditados (Saldo: ${json.data.newBalance} pts).`
      );
    } else {
      setIsError(true);
      if (res.status === 401) {
        setNeedsLogin(true);
        setStatusMessage('Você precisa entrar na sua conta para pontuar no check-in.');
      } else {
        setStatusMessage(json.error?.message ?? 'Erro ao realizar check-in.');
      }
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <EditorialCard>
        <h1 className="font-serif text-2xl font-bold text-brand-ink">
          Check-in na Loja
        </h1>
        <p className="mt-1 text-xs text-brand-muted">
          Selecione a loja parceira e confirme sua localização para pontuar.
        </p>

        <form onSubmit={handleCheckInSubmit} className="mt-5 space-y-4">
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
              Usar Meu GPS
            </button>
            <button
              type="button"
              onClick={() => {
                setLatitude(-10.18442);
                setLongitude(-48.33365);
              }}
              className="rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 px-3 py-1.5 text-xs font-semibold text-brand-emerald"
            >
              No Shopping
            </button>
          </div>

          {statusMessage && (
            <div
              className={`rounded-xl p-3.5 text-xs font-semibold ${
                isError
                  ? 'border border-red-300 bg-red-50 text-red-800'
                  : 'border border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald'
              }`}
            >
              <p>{statusMessage}</p>
              {needsLogin && (
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/login?redirectTo=/checkin"
                    className="inline-block rounded-lg bg-primary px-3 py-1 text-xs font-bold text-on-primary"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro?redirectTo=/checkin"
                    className="inline-block rounded-lg bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed"
                  >
                    Criar Conta (+50 pts)
                  </Link>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-emerald py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Confirmar Check-in
          </button>
        </form>
      </EditorialCard>
    </div>
  );
}
