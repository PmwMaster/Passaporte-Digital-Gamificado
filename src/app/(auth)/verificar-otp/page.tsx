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
  const nextUrl = searchParams.get('next') ?? undefined;

  const [phone, setPhone] = useState(initialPhone);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
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
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
    const focusIdx = Math.min(5, pasted.length - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) return;

    if (!phone.trim()) {
      setIsError(true);
      setFeedback('Informe seu número de WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setFeedback('Verificando código...');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();

      if (json.success) {
        setIsError(false);
        setFeedback('WhatsApp verificado com sucesso! Redirecionando...');
        const destination =
          nextUrl && nextUrl.startsWith('/')
            ? nextUrl
            : json.data.redirectUrl ?? '/passaporte';
        router.push(destination);
        router.refresh();
      } else {
        setIsError(true);
        setFeedback(json.error?.message ?? 'Código OTP inválido.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    if (!phone.trim()) {
      setIsError(true);
      setFeedback('Informe seu número de WhatsApp para receber o código.');
      return;
    }

    setFeedback('Enviando novo código via WhatsApp...');
    setIsError(false);

    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const json = await res.json();
    if (json.success) {
      setCooldown(json.data.resendCooldownSeconds ?? 60);
      setDigits(['', '', '', '', '', '']);
      setIsError(false);
      setFeedback('Novo código enviado para o seu WhatsApp!');
      inputRefs.current[0]?.focus();
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Erro ao reenviar código.');
    }
  }

  const filledCount = digits.filter((d) => d.trim().length > 0).length;

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="rounded-2xl bg-surface-container-lowest p-6 sm:p-8 shadow-editorial border border-surface-container-high text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-secondary-container/60 text-secondary flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">sms</span>
        </div>

        <h1 className="font-headline-md text-2xl font-bold text-on-surface">
          Confirmar Código WhatsApp
        </h1>
        <p className="mt-1 text-xs text-on-surface-variant">
          Digite os 6 dígitos enviados para o seu WhatsApp:
        </p>

        <div className="mt-3">
          {initialPhone ? (
            <span className="inline-block px-3 py-1 rounded-full bg-surface-container-low text-xs font-bold text-on-surface">
              {formatPhoneDisplay(phone)}
            </span>
          ) : (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+5563999999999"
              className="w-full mt-1 px-3.5 py-2 rounded-lg bg-surface-container-low text-center text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
            />
          )}
        </div>

        <form onSubmit={handleVerify} className="mt-6">
          <div className="flex justify-center gap-2 mb-5">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Dígito ${index + 1}`}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center font-serif text-xl font-bold bg-surface-container-low text-on-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-container"
              />
            ))}
          </div>

          {feedback && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                isError
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
            className="w-full py-3.5 px-6 bg-primary-container hover:bg-primary text-on-primary text-sm font-bold rounded-full shadow-md transition cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Verificando...' : 'Confirmar e Entrar'}
          </button>

          <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={cooldown > 0}
              className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
            >
              {cooldown > 0
                ? `Reenviar em ${cooldown}s`
                : 'Reenviar código via WhatsApp'}
            </button>
            <Link href="/login" className="hover:underline">
              ← Voltar ao Login
            </Link>
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
        <div className="p-8 text-center text-xs text-on-surface-variant">
          Carregando...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
