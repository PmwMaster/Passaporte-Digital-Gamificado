'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CameraQrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose?: () => void;
}

export function CameraQrScanner({ onScanSuccess, onClose }: CameraQrScannerProps) {
  const [scannerStarted, setScannerStarted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const html5QrCodeRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode('camera-qr-reader');
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (isMounted) {
              onScanSuccess(decodedText);
            }
          },
          () => {
            // scanning loop callback
          }
        );

        if (isMounted) {
          setScannerStarted(true);
          setErrorMessage(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setScannerStarted(false);
          const msg = err?.message || String(err);
          if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
            setErrorMessage('Acesso à câmera bloqueado. Ative a permissão de câmera no seu navegador ou envie uma foto do QR Code.');
          } else {
            setErrorMessage('Não foi possível iniciar a câmera diretamente. Você também pode enviar uma foto do QR Code.');
          }
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
            try {
              html5QrCodeRef.current?.clear();
            } catch {}
          });
        } catch {}
      }
    };
  }, [onScanSuccess]);

  async function handleFileScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    setErrorMessage(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = new Html5Qrcode('file-qr-reader-temp');
      const decodedText = await tempScanner.scanFile(file, true);
      tempScanner.clear();
      onScanSuccess(decodedText);
    } catch {
      setErrorMessage('Nenhum QR Code legível foi detectado nesta imagem. Tente uma foto mais nítida.');
    } finally {
      setIsScanningFile(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-brand-goldDark bg-brand-ink p-4 text-white shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h3 className="font-serif text-sm font-bold text-white">
            Scanner de QR Code Ativo
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80 hover:bg-white/20 transition"
          >
            Fechar
          </button>
        )}
      </div>

      {/* Viewfinder da Câmera */}
      <div className="relative mx-auto h-72 w-full max-w-xs overflow-hidden rounded-2xl bg-black">
        <div id="camera-qr-reader" className="h-full w-full object-cover" />

        {/* Retículo do Scanner */}
        {scannerStarted && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 rounded-2xl border-2 border-brand-goldLight shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] relative">
              <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-emerald-400"></div>
            </div>
          </div>
        )}

        <div id="file-qr-reader-temp" style={{ display: 'none' }} />
      </div>

      {errorMessage && (
        <div className="mt-3 rounded-xl bg-red-950/80 border border-red-500/40 p-2.5 text-center text-xs text-red-200">
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Alternativa: Ler Foto do QR Code */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-white/80 pt-3 border-t border-white/10">
        <span>Aponte a câmera para o QR Code da loja.</span>
        <div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileScan}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanningFile}
            className="rounded-lg bg-brand-goldDark hover:bg-brand-goldLight px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
          >
            {isScanningFile ? 'Lendo imagem...' : 'Carregar foto do QR Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
