'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const initialPhone = searchParams.get('phone') ?? '+5563992114455';
  const initialPreview = searchParams.get('preview') ?? '482910';
  const nextUrl = searchParams.get('next') ?? undefined;

  const [phone, setPhone] = useState(initialPhone);
  const [editingPhone, setEditingPhone] = useState(false);
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

  // RN-11: Contador regressivo de 60 segundos para reenvio
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

    setIsSubmitting(true);
    setIsError(false);
    setFeedback('Validando código de segurança via WhatsApp...');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const json = await res.json();

      if (json.success) {
        setIsError(false);
        setFeedback(
          'WhatsApp confirmado com sucesso! Redirecionando para o seu Passe Dourado...'
        );
        const destination =
          nextUrl && nextUrl.startsWith('/')
            ? nextUrl
            : json.data.redirectUrl ?? '/passaporte';
        setTimeout(() => {
          router.push(destination);
          router.refresh();
        }, 650);
      } else {
        setIsError(true);
        setFeedback(json.error?.message ?? 'Código OTP inválido.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function dispatchNewOtp(phoneToUse: string) {
    setFeedback('Enviando código de 6 dígitos para o seu WhatsApp...');
    setIsError(false);

    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneToUse }),
    });
    const json = await res.json();
    if (json.success) {
      setCooldown(json.data.resendCooldownSeconds ?? 60);
      if (json.data.devPreviewCode) {
        setDevPreviewCode(json.data.devPreviewCode);
      }
      setDigits(['', '', '', '', '', '']);
      setIsError(false);
      setFeedback('Novo código de 6 dígitos enviado para o seu WhatsApp!');
      inputRefs.current[0]?.focus();
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Aguarde antes de reenviar.');
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
    await dispatchNewOtp(phone);
  }

  async function handleSaveNewPhone() {
    setEditingPhone(false);
    await dispatchNewOtp(phone);
  }

  const filledCount = digits.filter((d) => d.trim().length > 0).length;
  const formattedTimer = `00:${cooldown < 10 ? '0' : ''}${cooldown}`;

  return (
    <div className="flex flex-col w-full items-center justify-center py-6 sm:py-10 px-4 relative overflow-hidden">
      {/* Subtle decorative golden aura in background */}
      <div className="absolute w-[640px] h-[640px] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none -top-40 -right-20" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-secondary-fixed/15 blur-[100px] pointer-events-none -bottom-32 -left-24" />

      {/* Main Card Container (Fiel a confirma_o_de_c_digo_whatsapp_desktop) */}
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl p-6 sm:p-10 relative z-10 flex flex-col items-center">
        {/* Top Bar: Voltar + Badge Seguro */}
        <div className="w-full flex items-center justify-between mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span className="font-label-md text-label-md tracking-wider uppercase">
              Voltar
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 bg-surface-container-low px-3 py-1 rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              lock
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Acesso Seguro SSL
            </span>
          </div>
        </div>

        {/* Stylized WhatsApp / Security Emblem */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-primary-fixed/30 flex items-center justify-center p-1.5">
            <div className="w-full h-full rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center relative">
              <svg
                className="absolute inset-0 w-full h-full text-primary-container opacity-40"
                fill="none"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeDasharray="4 6"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="material-symbols-outlined text-primary text-[34px]">
                chat_bubble
              </span>
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-secondary text-on-secondary rounded-full w-7 h-7 flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[16px]">
              verified
            </span>
          </div>
        </div>

        {/* Title & Explanation */}
        <div className="text-center mb-6">
          <span className="font-label-sm text-label-sm tracking-widest text-primary uppercase block mb-1">
            Validação em Duas Etapas • Passe Dourado
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Confirme seu número no WhatsApp
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            Enviamos um código de 6 dígitos via WhatsApp para o número de telefone informado:
          </p>

          {/* Active Phone Pill */}
          <div className="mt-3 inline-flex flex-wrap items-center justify-center gap-3 bg-surface-container-low px-4 py-2 rounded-full shadow-sm">
            {editingPhone ? (
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-2.5 py-1 rounded bg-surface-container-lowest text-on-surface font-title-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleSaveNewPhone}
                  className="font-label-md text-label-md text-secondary font-bold cursor-pointer"
                >
                  Salvar & Enviar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    sms
                  </span>
                  <span className="font-title-md text-title-md text-on-surface font-semibold tracking-wide">
                    {formatPhoneDisplay(phone)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPhone(true)}
                  className="font-label-md text-label-md text-primary hover:text-on-primary-container transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    edit
                  </span>
                  Alterar número
                </button>
              </>
            )}
          </div>
        </div>

        {/* Simulador Interativo de Notificação WhatsApp (Modo Híbrido) */}
        {devPreviewCode && (
          <div className="w-full mb-6 rounded-2xl bg-secondary-container/35 border border-secondary/30 p-3.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5 text-left">
              <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[18px]">
                  chat
                </span>
              </div>
              <div>
                <span className="block font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                  Simulador WhatsApp • Mensagem Recebida
                </span>
                <p className="font-body-sm text-body-sm text-on-surface mt-0.5">
                  ✨ <strong>Passe Dourado:</strong> Seu código de confirmação é{' '}
                  <strong className="font-mono text-sm tracking-widest bg-surface-container-lowest px-2 py-0.5 rounded text-primary border border-primary-container/40">
                    {devPreviewCode}
                  </strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDigits(devPreviewCode.slice(0, 6).split(''))}
              className="px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary font-label-sm text-label-sm font-bold hover:opacity-95 transition cursor-pointer shadow-sm"
            >
              Preencher 6 dígitos
            </button>
          </div>
        )}

        {/* OTP Input Form */}
        <form
          onSubmit={handleVerify}
          className="w-full flex flex-col items-center"
        >
          {/* 6-Digit OTP Blocks (3 + 3 Grouped) */}
          <div className="w-full flex items-center justify-center gap-2 sm:gap-3 mb-3">
            {[0, 1, 2].map((index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                pattern="[0-9]*"
                value={digits[index]}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Dígito ${index + 1} do código OTP`}
                className="w-11 h-14 sm:w-14 sm:h-16 text-center font-display-lg text-headline-lg font-semibold bg-surface-container-low text-on-surface rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:shadow-md transition-all caret-primary"
              />
            ))}

            {/* Artisanal Separator Bullet */}
            <div className="px-0.5 sm:px-1 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-outline-variant" />
            </div>

            {[3, 4, 5].map((index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                pattern="[0-9]*"
                value={digits[index]}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Dígito ${index + 1} do código OTP`}
                className="w-11 h-14 sm:w-14 sm:h-16 text-center font-display-lg text-headline-lg font-semibold bg-surface-container-low text-on-surface rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:shadow-md transition-all caret-primary"
              />
            ))}
          </div>

          {/* Live Typing Status */}
          <div className="h-6 flex items-center justify-center mb-5">
            {filledCount === 6 ? (
              <span className="font-label-md text-label-md text-secondary font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  check_circle
                </span>
                Pronto para validar
              </span>
            ) : (
              <span className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1.5 opacity-80">
                <span className="material-symbols-outlined text-[15px] animate-pulse text-primary">
                  schedule
                </span>
                Aguardando dígitos ({filledCount} de 6 preenchidos)
              </span>
            )}
          </div>

          {feedback && (
            <div
              className={`w-full mb-5 p-3.5 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 ${
                isError
                  ? 'bg-error-container text-on-error-container'
                  : 'bg-secondary-container/70 text-on-secondary-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isError ? 'error' : 'check_circle'}
              </span>
              <span>{feedback}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={filledCount !== 6 || isSubmitting}
            className="w-full py-4 px-6 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <span>
              {isSubmitting
                ? 'Validando Código...'
                : 'Confirmar e Entrar no Passe Dourado'}
            </span>
            <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>

          {/* Timer & Resend Section */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
            <div className="inline-flex items-center gap-1.5 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[16px] text-tertiary">
                timer
              </span>
              <span>
                Reenviar código em{' '}
                <strong className="font-title-md text-on-surface">
                  {formattedTimer}
                </strong>
              </span>
            </div>
            <span className="hidden sm:inline text-outline-variant">•</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={cooldown > 0}
              className="font-label-md text-label-md text-primary hover:underline hover:text-primary-container cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
            >
              Reenviar via WhatsApp
            </button>
          </div>
        </form>

        {/* Concierge Support Card */}
        <div className="w-full mt-8 bg-surface-container-low rounded-xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex-shrink-0 flex items-center justify-center text-on-primary-fixed shadow-sm">
            <span className="material-symbols-outlined text-[20px]">
              room_service
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-title-md text-title-md text-on-surface font-semibold leading-tight">
              Precisa de assistência presencial?
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-snug">
              Visite o balcão exclusivo do Concierge Passe Dourado Shopping no{' '}
              <strong>Piso L1</strong> (em frente à Praça Central) ou{' '}
              <Link
                href="/passaporte"
                className="text-primary underline font-semibold"
              >
                acesse seu Passe Dourado
              </Link>
              .
            </p>
          </div>
          <span className="material-symbols-outlined text-outline-variant text-[20px]">
            chevron_right
          </span>
        </div>
      </div>

      {/* Artisanal Brand Monogram Watermark Footer */}
      <div className="mt-8 flex flex-col items-center gap-1 text-center opacity-75">
        <div className="flex items-center gap-2">
          <span className="w-6 h-px bg-outline-variant" />
          <span className="font-headline-md text-label-md tracking-[0.25em] uppercase text-primary font-semibold">
            Passe Dourado
          </span>
          <span className="w-6 h-px bg-outline-variant" />
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
          Experiência &amp; Gastronomia Exclusiva
        </span>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center font-body-md text-on-surface-variant">
          Carregando validação em duas etapas via WhatsApp...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
