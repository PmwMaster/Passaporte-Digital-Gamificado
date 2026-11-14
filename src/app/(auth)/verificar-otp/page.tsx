'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { SHOPPING_CONFIG } from '@/shared/constants';
import { WhatsAppIcon } from '@/components/shared/WhatsAppVerificationCard';

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^55/, '').slice(0, 11);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get('phone') ?? '';
  const initialPreview = searchParams.get('preview') ?? null;

  const [phone, setPhone] = useState(initialPhone);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(
    initialPreview
  );
  const [cooldown, setCooldown] = useState<number>(60);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? '';
    }
    setDigits(next);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) return;

    if (!phone) {
      setIsError(true);
      setFeedback('Informe o número do telefone.');
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setFeedback('Validando código...');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();

      if (json.success) {
        setIsError(false);
        setFeedback('WhatsApp verificado! Redirecionando...');
        setTimeout(() => {
          router.push(json.data.redirectUrl ?? '/passaporte');
          router.refresh();
        }, 500);
      } else {
        setIsError(true);
        setFeedback(json.error?.message ?? 'Código inválido.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    if (!phone) {
      setIsError(true);
      setFeedback('Informe o número do telefone antes de reenviar.');
      return;
    }

    setIsError(false);
    setFeedback('Reenviando código...');

    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const json = await res.json();
    if (json.success) {
      setCooldown(json.data.resendCooldownSeconds ?? 60);
      if (json.data.devPreviewCode) {
        setDevPreviewCode(json.data.devPreviewCode);
      }
      setFeedback('Novo código enviado para seu WhatsApp.');
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Aguarde antes de reenviar.');
    }
  }

  const filledCount = digits.filter((d) => d.trim().length > 0).length;

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl bg-surface-container-lowest p-6 sm:p-8 shadow-editorial border border-surface-container-high">
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/login"
            className="text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            ← Voltar
          </Link>
          {phone && (
            <span className="text-xs font-semibold text-secondary">
              {formatPhoneDisplay(phone)}
            </span>
          )}
        </div>

        <h1 className="font-headline-md text-2xl font-bold text-on-surface mb-1">
          Confirmar WhatsApp
        </h1>
        <p className="text-xs text-on-surface-variant mb-5">
          {phone
            ? `Digite o código de 6 dígitos enviado para ${formatPhoneDisplay(phone)}.`
            : 'Informe seu WhatsApp e digite o código de 6 dígitos.'}
        </p>

        {!phone && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              WhatsApp com DDD
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(DDD) 99999-9999"
              className="w-full px-3.5 py-2 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {devPreviewCode && (
          <div className="mb-5 rounded-xl bg-primary-fixed/40 p-3 flex items-center justify-between gap-2 text-xs">
            <span>
              Código enviado: <strong className="font-mono text-primary">{devPreviewCode}</strong>
            </span>
            <button
              type="button"
              onClick={() => setDigits(devPreviewCode.slice(0, 6).split(''))}
              className="px-3 py-1 rounded-full bg-primary text-on-primary font-bold cursor-pointer"
            >
              Preencher
            </button>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digits[index]}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-11 h-13 text-center font-headline-md text-xl font-bold bg-surface-container-low text-on-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${isError
                ? 'bg-error-container text-on-error-container'
                : 'bg-secondary-container/70 text-on-secondary-container'
                }`}
            >
              {feedback}
            </div>
          )}

          <button
            type="submit"
            disabled={filledCount !== 6 || isSubmitting}
            className="w-full py-3 px-6 bg-primary-container hover:bg-primary text-on-primary text-sm font-bold rounded-full shadow-md transition cursor-pointer disabled:opacity-45"
          >
            {isSubmitting ? 'Validando...' : 'Confirmar Código'}
          </button>

          <div className="text-center text-xs text-on-surface-variant">
            {cooldown > 0 ? (
              <span>Reenviar em {cooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Reenviar código
              </button>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-surface-container-high">
            <p className="text-xs text-on-surface-variant mb-2.5">
              Prefere confirmar direto pelo WhatsApp sem digitar código?
            </p>
            <a
              href={`https://wa.me/${SHOPPING_CONFIG.officialWhatsApp}?text=${encodeURIComponent(
                `Olá! Estou confirmando meu acesso no Passaporte Digital Passe Dourado pelo telefone ${phone || 'cadastrado'}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span>Abrir WhatsApp do Shopping ({SHOPPING_CONFIG.officialWhatsAppDisplay})</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-on-surface-variant">
          Carregando...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
