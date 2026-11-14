'use client';

import React, { useState } from 'react';
import {
  mockCheckIns,
  mockStores,
} from '@/infrastructure/database/mock-data';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { CheckIn, Mission, Stamp } from '@/shared/types/domain';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

interface CheckInSuccessResult {
  checkIn: CheckIn;
  stampEarned: Stamp;
  completedMissions: Mission[];
  newBalance: number;
}

export default function CheckInPage() {
  const [selectedToken, setSelectedToken] = useState(mockStores[0].qrCodeToken);
  const [latitude, setLatitude] = useState<number>(
    SHOPPING_CONFIG.defaultCoordinates.latitude
  );
  const [longitude, setLongitude] = useState<number>(
    SHOPPING_CONFIG.defaultCoordinates.longitude
  );
  const [accuracyMeters, setAccuracyMeters] = useState<number>(15);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInSuccessResult | null>(
    null
  );
  const [recentHistory, setRecentHistory] = useState<CheckIn[]>(mockCheckIns);

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
        setAccuracyMeters(Math.round(pos.coords.accuracy || 15));
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
        accuracyMeters: Number(accuracyMeters),
      }),
    });

    const json = await res.json();
    if (json.success) {
      setIsError(false);
      setLastResult(json.data as CheckInSuccessResult);
      const bonusMsg =
        json.data.completedMissions?.length > 0
          ? ` + Bônus de ${json.data.completedMissions.length} missão(ões) concluída(s)!`
          : '';
      setStatusMessage(
        `Check-in APROVADO em ${json.data.checkIn.storeName}! Distância Haversine: ${json.data.checkIn.distanceMeters}m (<= 250m). +${json.data.checkIn.pointsAwarded} pts creditados${bonusMsg} (Novo saldo: ${json.data.newBalance} pts).`
      );
    } else {
      setIsError(true);
      setLastResult(null);
      setStatusMessage(`${json.error?.code}: ${json.error?.message}`);
    }

    const historyRes = await fetch('/api/checkins');
    const historyJson = await historyRes.json();
    if (historyJson.success) {
      setRecentHistory(historyJson.data.checkIns);
    }
  }

  return (
    <div>
      <VisitorNavigation currentPath="/checkin" />

      <ModuleHeader
        featureNumber="FUNCIONALIDADE 04"
        title="Check-in Presencial por QR Code & Geofence Haversine (250m)"
        subtitle="Leitura de QR Code oficial, validação trigonométrica Haversine, fuso de Palmas (America/Araguaina) e trava contra check-in duplicado no mesmo dia."
        developerOwner="DESENVOLVEDOR 02"
        moduleName="checkin"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <EditorialCard>
          <h2 className="font-serif text-xl font-bold text-brand-ink">
            Leitor de QR Code & Validação GPS
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Coordenada central do Capim Dourado Shopping:{' '}
            {SHOPPING_CONFIG.defaultCoordinates.latitude},{' '}
            {SHOPPING_CONFIG.defaultCoordinates.longitude} (Raio máximo:{' '}
            {SHOPPING_CONFIG.defaultGeofenceRadiusMeters}m)
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
                    {store.name} ({store.qrCodeToken} • +{store.checkInPoints}{' '}
                    pts • {store.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
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
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Precisão GPS (m)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={accuracyMeters}
                  onChange={(e) => setAccuracyMeters(Number(e.target.value))}
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
                  setAccuracyMeters(15);
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
                  setAccuracyMeters(15);
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

            {lastResult && !isError && (
              <div className="rounded-2xl border border-brand-goldLight bg-brand-ivory p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-base font-bold text-brand-goldDark">
                    ✦ {lastResult.stampEarned.badgeTitle}
                  </span>
                  <span className="rounded-full bg-brand-emerald px-2.5 py-0.5 font-bold text-white">
                    +{lastResult.checkIn.pointsAwarded} pts
                  </span>
                </div>
                <p className="mt-1 text-brand-muted">
                  Categoria: {lastResult.stampEarned.category} • Distância
                  validada: {lastResult.checkIn.distanceMeters}m • Novo Saldo:{' '}
                  <strong>{lastResult.newBalance} pts</strong>
                </p>

                {lastResult.completedMissions.length > 0 && (
                  <div className="mt-3 rounded-xl border border-brand-emerald/30 bg-brand-emerald/10 p-3">
                    <p className="font-bold text-brand-emerald">
                      🎉 Missão Concluída Automaticamente:
                    </p>
                    {lastResult.completedMissions.map((m) => (
                      <p key={m.id} className="mt-0.5 text-brand-ink">
                        • <strong>{m.title}</strong> (+{m.rewardPoints} pts bônus
                        creditados no Ledger)
                      </p>
                    ))}
                  </div>
                )}
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

        <div className="space-y-6">
          <EditorialCard className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-brand-ink">
              Regras Antifraude Aplicadas no Servidor
            </h3>
            <ul className="space-y-2.5 text-xs text-brand-muted">
              <li>
                <strong className="text-brand-ink">
                  1. Fórmula de Haversine (250m):
                </strong>{' '}
                Calcula a distância esférica exata entre a coordenada enviada e
                o ponto central do Capim Dourado Shopping (`422 GEOFENCE_OUT_OF_RANGE` se &gt; 250m).
              </li>
              <li>
                <strong className="text-brand-ink">
                  2. Precisão de Sinal GPS (&le; 150m):
                </strong>{' '}
                Bloqueia leituras com precisão degradada (`422 GPS_LOW_ACCURACY`).
              </li>
              <li>
                <strong className="text-brand-ink">
                  3. Limite Diário no Fuso de Palmas (America/Araguaina):
                </strong>{' '}
                Apenas 1 check-in válido por estabelecimento por dia civil
                (`409 DUPLICATE_DAILY_CHECKIN`).
              </li>
              <li>
                <strong className="text-brand-ink">
                  4. Orquestração Atômica (Módulos 04, 05 e 06):
                </strong>{' '}
                Concede carimbo, avalia missões em andamento e grava os créditos
                no Ledger de Pontos.
              </li>
            </ul>
          </EditorialCard>

          <EditorialCard>
            <h3 className="font-serif text-lg font-bold text-brand-ink">
              Auditoria de Tentativas Recentes (`CheckIn`)
            </h3>
            <div className="mt-3 space-y-2">
              {recentHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-ivory px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-semibold text-brand-ink">
                      {item.storeName}
                    </p>
                    <p className="text-[11px] text-brand-muted">
                      {item.checkInDate} • {item.distanceMeters}m do centro
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                      item.status === 'VALID'
                        ? 'bg-brand-emerald/15 text-brand-emerald'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.status === 'VALID'
                      ? `+${item.pointsAwarded} pts (VALID)`
                      : item.status}
                  </span>
                </div>
              ))}
            </div>
          </EditorialCard>
        </div>
      </div>
    </div>
  );
}
