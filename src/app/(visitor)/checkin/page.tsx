'use client';

import React, { useState } from 'react';
import { mockStores } from '@/infrastructure/database/mock-data';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function CheckInPage() {
  const [selectedToken, setSelectedToken] = useState(mockStores[0].qrCodeToken);
  const [latitude, setLatitude] = useState(SHOPPING_CONFIG.defaultCoordinates.latitude);
  const [longitude, setLongitude] = useState(SHOPPING_CONFIG.defaultCoordinates.longitude);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleCaptureBrowserGps() {
    if (!navigator.geolocation) {
      setIsError(true);
      setStatusMessage('HTML5 Geolocation API não suportada neste navegador.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setIsError(false);
        setStatusMessage('Coordenadas GPS reais capturadas pelo navegador!');
      },
      () => {
        setIsError(true);
        setStatusMessage(
          'Permissão de GPS negada ou indisponível. Use os botões de simulação de coordenada abaixo para testar o motor Haversine.'
        );
      }
    );
  }

  async function handleCheckInSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        `Check-in APROVADO em ${json.data.checkIn.storeName}! Distância Haversine: ${json.data.checkIn.distanceMeters}m (<= 250m). +${json.data.checkIn.pointsAwarded} pts creditados no Ledger (Novo saldo: ${json.data.newBalance} pts).`
      );
    } else {
      setIsError(true);
      setStatusMessage(`${json.error?.code}: ${json.error?.message}`);
    }
  }

  return (
    <div>
      <VisitorNavigation currentPath="/checkin" />

      <ModuleHeader
        featureNumber="FUNCIONALIDADE 04"
        title="Check-in Presencial por QR Code & Geofence Haversine (250m)"
        subtitle="Leitura de QR Code oficial, validação trigonométrica Haversine e trava contra check-in duplicado no mesmo dia."
        developerOwner="DESENVOLVEDOR 02"
        moduleName="checkin"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <EditorialCard>
          <h2 className="font-serif text-xl font-bold text-brand-ink">
            Leitor de QR Code & Validação GPS
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Coordenada central do Capim Dourado Shopping: {SHOPPING_CONFIG.defaultCoordinates.latitude},{' '}
            {SHOPPING_CONFIG.defaultCoordinates.longitude} (Raio máximo: {SHOPPING_CONFIG.defaultGeofenceRadiusMeters}m)
          </p>

          <form onSubmit={handleCheckInSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                QR Code Oficial da Loja Escaneada (html5-qrcode)
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
              >
                {mockStores.map((store) => (
                  <option key={store.id} value={store.qrCodeToken}>
                    {store.name} ({store.qrCodeToken} • +{store.checkInPoints} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Latitude Atual
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
                  Longitude Atual
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
                Usar GPS Real do Navegador
              </button>
              <button
                type="button"
                onClick={() => {
                  setLatitude(-10.18442);
                  setLongitude(-48.33365);
                }}
                className="rounded-lg border border-brand-emerald/30 bg-brand-emerald/10 px-3 py-1.5 text-xs font-semibold text-brand-emerald"
              >
                Simular Dentro do Shopping (~12m)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLatitude(-10.2125);
                  setLongitude(-48.355);
                }}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
              >
                Simular Fora do Geofence (&gt; 250m)
              </button>
            </div>

            {statusMessage && (
              <div
                className={`rounded-xl p-4 text-xs font-semibold ${
                  isError
                    ? 'border border-red-300 bg-red-50 text-red-800'
                    : 'border border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald'
                }`}
              >
                {statusMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-brand-emerald py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Validar Presença Haversine & Pontuar
            </button>
          </form>
        </EditorialCard>

        <EditorialCard className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-brand-ink">
            Regras Antifraude Aplicadas no Servidor
          </h3>
          <ul className="space-y-2.5 text-xs text-brand-muted">
            <li>
              <strong className="text-brand-ink">1. Fórmula de Haversine:</strong> Calcula a distância esférica exata entre a coordenada enviada e o ponto central do Capim Dourado Shopping.
            </li>
            <li>
              <strong className="text-brand-ink">2. Geofence de 250 metros:</strong> Tentativas acima de 250m retornam HTTP <code>422 GEOFENCE_OUT_OF_RANGE</code>.
            </li>
            <li>
              <strong className="text-brand-ink">3. Limite Diário por Loja:</strong> Apenas 1 check-in válido por estabelecimento por dia civil (<code>409 DUPLICATE_DAILY_CHECKIN</code> se repetido).
            </li>
            <li>
              <strong className="text-brand-ink">4. Transação Atômica com Módulos 05 e 06:</strong> Concede carimbo, atualiza missões e grava crédito no Ledger de Pontos.
            </li>
          </ul>
        </EditorialCard>
      </div>
    </div>
  );
}
