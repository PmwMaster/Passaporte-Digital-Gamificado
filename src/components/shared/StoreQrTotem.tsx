'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Store } from '@/shared/types/domain';

interface StoreQrTotemProps {
  store: Store;
}

export function StoreQrTotem({ store }: StoreQrTotemProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const checkInUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/checkin?token=${encodeURIComponent(store.qrCodeToken)}`
    : `https://passaporteshopping.vercel.app/checkin?token=${store.qrCodeToken}`;

  useEffect(() => {
    QRCode.toDataURL(checkInUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1f1a14',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Erro ao gerar QR Code do totem:', err));
  }, [checkInUrl, store.qrCodeToken]);

  return (
    <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border-2 border-brand-goldDark bg-white p-6 text-center shadow-xl">
      {/* Cabeçalho do Totem */}
      <div className="mb-4">
        <span className="inline-block rounded-full bg-brand-goldDark/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-goldDark">
          Totem Oficial de Balcão
        </span>
        <h3 className="mt-2 font-serif text-xl font-bold text-brand-ink">
          {store.name}
        </h3>
        <p className="text-xs text-brand-muted">
          {store.floor} • {store.category}
        </p>
      </div>

      {/* QR Code Gerado */}
      <div className="relative mx-auto my-3 flex h-64 w-64 items-center justify-center rounded-2xl border border-brand-border bg-white p-3 shadow-inner">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code de Check-in - ${store.name}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-xs text-brand-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-goldDark border-t-transparent" />
            <span className="mt-2">Gerando QR Code...</span>
          </div>
        )}
      </div>

      {/* Recompensa de Pontos */}
      <div className="mt-4 rounded-xl bg-brand-emerald/10 p-3 text-center border border-brand-emerald/30">
        <span className="block text-xs font-bold uppercase tracking-wider text-brand-emerald">
          Recompensa Presencial
        </span>
        <span className="font-serif text-2xl font-bold text-brand-emerald">
          +{store.checkInPoints} pts
        </span>
        <span className="block text-[11px] text-brand-muted mt-0.5">
          por check-in diário validado
        </span>
      </div>

      {/* Instruções */}
      <div className="mt-4 text-[11px] text-brand-muted leading-relaxed">
        <p>Aponte a câmera do seu celular para o QR Code acima.</p>
        <code className="mt-1 block rounded bg-brand-ivory px-2 py-1 text-[10px] text-brand-ink font-mono select-all">
          {store.qrCodeToken}
        </code>
      </div>
    </div>
  );
}
