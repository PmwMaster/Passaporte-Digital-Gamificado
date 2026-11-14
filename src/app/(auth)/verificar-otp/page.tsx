'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function formatDisplayPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^55/, '');
  if (digits.length >= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
  return raw;
}

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get('phone') ?? '+5563984123456';
  const initialPreview = searchParams.get('preview') ?? '482910';

  const [phone, setPhone] = useState(initialPhone);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(
    initialPreview
  );
  const [cooldown, setCooldown] = useState<number>(46);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

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

  const filledCount = digits.filter((d) => d.trim().length > 0).length;

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/[^0-9]/g, '').slice(-1);
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
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
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
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const json = await res.json();

    if (json.success) {
      setIsError(false);
      setFeedback(
        'Número confirmado com sucesso! Abrindo seu Passaporte Digital...'
      );
      setTimeout(() => {
        router.push(json.data.redirectUrl ?? '/passaporte');
        router.refresh();
      }, 700);
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Código inválido. Tente novamente.');
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0) return;
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
      setIsError(false);
      setFeedback('Novo código de 6 dígitos enviado via WhatsApp!');
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Aguarde antes de solicitar novo envio.');
    }
  }

  const formattedTimer = `00:${cooldown < 10 ? '0' : ''}${cooldown}`;

  return (
    <div className="flex flex-col w-full items-center justify-center py-8 px-4 relative overflow-hidden">
      {/* Subtle decorative golden aura in background (Fiel a confirma_o_de_c_digo_whatsapp_desktop) */}
      <div className="absolute w-[640px] h-[640px] rounded-full bg-primary-fixed/20 blur-[120px] pointer-events-none -top-40 -right-20" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-secondary-fixed/15 blur-[100px] pointer-events-none -bottom-32 -left-24" />

      {/* Main Card Container */}
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl p-8 sm:p-12 relative z-10 flex flex-col items-center">
        {/* Top Bar: Voltar + Badge Seguro */}
        <div className="w-full flex items-center justify-between mb-8">
          <Link
            href="/cadastro"
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
        <div className="text-center mb-8">
          <span className="font-label-sm text-label-sm tracking-widest text-primary uppercase block mb-1">
            Validação em Duas Etapas
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">
            Confirme seu número
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
            Enviamos um código de 6 dígitos via WhatsApp para o número cadastrado:
          </p>

          {/* Active Phone Pill */}
          <div className="mt-3 inline-flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                sms
              </span>
              {isEditingPhone ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setIsEditingPhone(false)}
                  className="bg-surface-container-lowest px-2 py-0.5 rounded font-title-md text-title-md text-on-surface w-40 outline-none"
                />
              ) : (
                <span className="font-title-md text-title-md text-on-surface font-semibold tracking-wide">
                  {formatDisplayPhone(phone)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsEditingPhone((v) => !v)}
              className="font-label-md text-label-md text-primary hover:text-on-primary-container transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              Alterar número
            </button>
          </div>

          {/* Atalho discreto para preencher o código durante os testes */}
          {devPreviewCode && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
              <span>
                Código recebido no WhatsApp:{' '}
                <strong className="font-mono text-primary">
                  {devPreviewCode}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setDigits(devPreviewCode.split(''))}
                className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-sm font-bold hover:bg-primary hover:text-on-primary transition cursor-pointer"
              >
                Preencher automático
              </button>
            </div>
          )}
        </div>

        {/* OTP Input Form (3 + Separador + 3 fiel à referência) */}
        <form
          onSubmit={handleVerify}
          className="w-full flex flex-col items-center"
        >
          <div className="w-full flex items-center justify-center gap-2.5 sm:gap-3 mb-3">
            {[0, 1, 2].map((index) => (
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
                aria-label={`Dígito ${index + 1}`}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center font-display-lg text-headline-lg font-semibold bg-surface-container-low text-on-surface rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container focus:shadow-md transition-all caret-primary"
              />
            ))}

            {/* Artisanal Separator Bullet */}
            <div className="px-1 flex items-center justify-center">
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
                value={digits[index]}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                aria-label={`Dígito ${index + 1}`}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center font-display-lg text-headline-lg font-semibold bg-surface-container-low text-on-surface rounded-lg shadow-sm focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container focus:shadow-md transition-all caret-primary"
              />
            ))}
          </div>

          {/* Live Typing Status */}
          <div className="h-6 flex items-center justify-center mb-6">
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
              className={`w-full mb-4 p-3.5 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 ${
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
            disabled={filledCount !== 6}
            className="w-full py-4 px-6 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <span>Confirmar e Entrar no Passaporte</span>
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
              className="font-label-md text-label-md text-primary hover:underline hover:text-primary-container cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reenviar via WhatsApp
            </button>
          </div>
        </form>

        {/* Concierge Support Card (Fiel a confirma_o_de_c_digo_whatsapp_desktop) */}
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
              Visite o balcão exclusivo do Concierge Capim Dourado Shopping no{' '}
              <strong>Piso L1</strong> (em frente à Praça Central) ou solicite ajuda de um atendente VIP.
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
            Capim Dourado
          </span>
          <span className="w-6 h-px bg-outline-variant" />
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
          Experiência & Gastronomia Exclusiva
        </span>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center font-body-md text-on-surface-variant">
          Carregando validação de código WhatsApp...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
