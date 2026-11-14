'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get('phone') ?? '+5563992114455';
  const initialPreview = searchParams.get('preview') ?? '482910';

  const [phone, setPhone] = useState(initialPhone);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devPreviewCode, setDevPreviewCode] = useState<string | null>(initialPreview);
  const [cooldown, setCooldown] = useState<number>(60);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

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

    // Auto-avanço para a próxima caixa
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
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
        'WhatsApp verificado com sucesso! Redirecionando para o seu Passaporte Digital...'
      );
      setTimeout(() => {
        router.push(json.data.redirectUrl ?? '/passaporte');
      }, 900);
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Código OTP inválido.');
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
      setFeedback('Novo código de 6 dígitos enviado para o seu WhatsApp!');
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Aguarde antes de reenviar.');
    }
  }

  return (
    <div>
      <ModuleHeader
        featureNumber="FASE 1 • FUNCIONALIDADE 02 (TELA 2C)"
        title="Confirmação de Código WhatsApp (OTP)"
        subtitle="RN-11: Código de 6 dígitos com auto-avanço, suporte a colar, backspace, validade de 5 minutos, máx. 5 tentativas e reenvio após 60s."
        developerOwner="DESENVOLVEDOR 01"
        moduleName="authentication"
      />

      <EditorialCard className="mx-auto max-w-xl text-center">
        <span className="inline-block rounded-full bg-brand-emerald/15 px-3.5 py-1 text-xs font-semibold text-brand-emerald">
          Verificação de Segurança via WhatsApp
        </span>
        <h2 className="mt-3 font-serif text-2xl font-bold text-brand-ink">
          Digite o código de 6 dígitos
        </h2>
        <p className="mt-1 text-xs text-brand-muted">
          Enviamos um código de verificação para o número{' '}
          <strong className="text-brand-ink">{phone}</strong>
        </p>

        {devPreviewCode && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
            <span>Código OTP gerado (Ambiente Dev / Simulador MVP): </span>
            <strong className="font-mono text-sm tracking-widest">
              {devPreviewCode}
            </strong>
            <button
              type="button"
              onClick={() => setDigits(devPreviewCode.split(''))}
              className="ml-3 rounded bg-amber-900 px-2 py-0.5 text-[11px] font-semibold text-white"
            >
              Preencher 6 dígitos
            </button>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6 space-y-6">
          <div className="flex justify-center gap-2.5 sm:gap-3">
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
                aria-label={`Dígito ${index + 1} do código OTP`}
                className="h-14 w-11 rounded-2xl border-2 border-brand-border bg-brand-ivory text-center font-serif text-2xl font-bold text-brand-ink outline-none transition focus:border-brand-goldDark focus:bg-white sm:h-16 sm:w-13"
              />
            ))}
          </div>

          {feedback && (
            <div
              className={`rounded-xl p-3.5 text-xs font-semibold ${
                isError
                  ? 'border border-red-300 bg-red-50 text-red-800'
                  : 'border border-brand-emerald/30 bg-brand-emerald/10 text-brand-emerald'
              }`}
            >
              {feedback}
            </div>
          )}

          <button
            type="submit"
            disabled={digits.join('').length !== 6}
            className="w-full rounded-full bg-gradient-to-r from-brand-goldDark to-brand-goldLight py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirmar Código & Acessar Passaporte
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between border-t border-brand-border pt-4 text-xs">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={cooldown > 0}
            className="font-semibold text-brand-goldDark hover:underline disabled:cursor-not-allowed disabled:text-brand-muted disabled:no-underline"
          >
            {cooldown > 0
              ? `Reenviar código em ${cooldown}s`
              : 'Reenviar código no WhatsApp'}
          </button>

          <Link href="/passaporte" className="text-brand-muted hover:underline">
            Ir direto para o Passaporte →
          </Link>
        </div>
      </EditorialCard>
    </div>
  );
}
