'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('Mariana Silva');
  const [email, setEmail] = useState('seu.email@exemplo.com');
  const [phoneDigits, setPhoneDigits] = useState('63984123456');
  const [password, setPassword] = useState('Passe@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [whatsappPromoConsent, setWhatsappPromoConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Etapa de Confirmação de Código WhatsApp (Conforme 5-codigo-whatsapp.png)
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>([
    '4',
    '8',
    '2',
    '9',
    '1',
    '0',
  ]);
  const [countdown, setCountdown] = useState(46);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    if (!showOtpStep || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [showOtpStep, countdown]);

  const hasMinLength = password.length >= 8;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const strengthScore =
    (hasMinLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);

  const formattedE164Phone = `+55${phoneDigits.replace(/\D/g, '').slice(0, 11)}`;
  const displayPhone = `(${phoneDigits.slice(0, 2) || '63'}) ${
    phoneDigits.slice(2, 7) || '98412'
  }-${phoneDigits.slice(7, 11) || '3456'}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: formattedE164Phone,
          password,
          lgpdConsent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCountdown(46);
        setShowOtpStep(true);
      } else {
        setErrorMsg(
          json.error?.message ??
            'Verifique os campos preenchidos (senha com 8+ caracteres).'
        );
      }
    } catch {
      setErrorMsg('Erro de conexão ao registrar passaporte.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setIsVerifyingOtp(true);
    try {
      await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedE164Phone,
          code: otpDigits.join(''),
        }),
      });
      window.dispatchEvent(new Event('passport:points-updated'));
      router.push('/passaporte');
    } catch {
      router.push('/passaporte');
    } finally {
      setIsVerifyingOtp(false);
    }
  }

  function handleOtpChange(index: number, val: string) {
    const clean = val.replace(/\D/g, '').slice(-1);
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-xl pb-12">
      {!showOtpStep ? (
        /* ====================================================================
           TELA 02 — CRIAR CONTA (Conforme 3-criar-conta.png)
           ==================================================================== */
        <div className="rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 shadow-md sm:bg-white sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold text-[#1F1A11]">
                Passe Dourado
              </h1>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5A5243]">
                Crie sua conta para acumular pontos, carimbar o passaporte e
                resgatar cupons exclusivos no shopping!
              </p>
            </div>
            <Link
              href="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E6DFCE] bg-white text-[#1F1A11]"
              aria-label="Fechar"
            >
              ✕
            </Link>
          </div>

          {/* Segmented Pill Switcher: Entrar | Criar conta */}
          <div className="my-5 grid grid-cols-2 rounded-full border border-[#E6DFCE] bg-white p-1.5">
            <Link
              href="/login"
              className="rounded-full py-3 text-center text-sm font-extrabold text-[#1F1A11] transition hover:bg-[#F3ECE0]"
            >
              Entrar
            </Link>
            <div className="rounded-full bg-[#74520B] py-3 text-center text-sm font-extrabold text-white shadow-sm">
              Criar conta
            </div>
          </div>

          {/* Banner Presente de Chegada (+50 pontos) */}
          <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-[#EFE4C8] p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#74520B] shadow-sm">
              <span className="material-symbols-outlined text-[22px]">
                redeem
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#74520B]">
                PRESENTE DE CHEGADA
              </span>
              <p className="text-xs text-[#1F1A11]">
                Ganhe <strong>+50 pontos</strong> logo no seu cadastro!
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome completo */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-[#1F1A11]">
                  Nome completo
                </label>
                <span className="text-xs font-extrabold text-[#74520B]">
                  Obrigatório
                </span>
              </div>
              <div className="relative mt-1.5">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#74520B]">
                  person
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mariana Silva"
                  className="w-full rounded-2xl border border-[#E2DAC6] bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-[#1F1A11] focus:border-[#74520B] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* E-mail */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-extrabold text-[#1F1A11]">
                  E-mail
                </label>
                <span className="text-xs text-[#6E6556]">
                  Para receber vouchers
                </span>
              </div>
              <div className="relative mt-1.5">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#74520B]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full rounded-2xl border border-[#E2DAC6] bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-[#1F1A11] focus:border-[#74520B] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div>
              <label className="block text-sm font-extrabold text-[#1F1A11]">
                Telefone / WhatsApp
              </label>
              <div className="mt-1.5 flex items-center overflow-hidden rounded-2xl border border-[#E2DAC6] bg-white focus-within:border-[#74520B]">
                <div className="flex items-center gap-1.5 border-r border-[#E2DAC6] px-4 py-3.5 text-sm">
                  <span className="text-xs font-medium text-[#6E6556]">BR</span>
                  <strong className="font-extrabold text-[#1F1A11]">+55</strong>
                </div>
                <input
                  type="tel"
                  value={phoneDigits}
                  onChange={(e) =>
                    setPhoneDigits(
                      e.target.value.replace(/\D/g, '').slice(0, 11)
                    )
                  }
                  placeholder="(63) 98412-3456"
                  className="w-full bg-transparent px-4 py-3.5 text-sm font-medium text-[#1F1A11] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Senha + Força da senha */}
            <div>
              <label className="block text-sm font-extrabold text-[#1F1A11]">
                Senha
              </label>
              <div className="relative mt-1.5">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#74520B]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-[#E2DAC6] bg-white py-3.5 pl-12 pr-12 text-sm font-medium text-[#1F1A11] focus:border-[#74520B] focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6556]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>

              {/* Medidor de Força (Conforme 3-criar-conta.png) */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-[#1F1A11]">Força da senha</strong>
                  <span className="flex items-center gap-1 font-extrabold text-[#256B30]">
                    <span className="material-symbols-outlined text-[15px]">
                      check_circle
                    </span>
                    {strengthScore >= 3
                      ? 'Forte e segura'
                      : strengthScore === 2
                      ? 'Média'
                      : 'Adicione números e símbolos'}
                  </span>
                </div>

                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className={`h-1.5 rounded-full ${
                        bar <= strengthScore ? 'bg-[#256B30]' : 'bg-[#E2DAC6]'
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-[#1F1A11]">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#256B30]">
                      check_circle
                    </span>
                    +8 letras
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#256B30]">
                      check_circle
                    </span>
                    1 número
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#256B30]">
                      check_circle
                    </span>
                    Especial (*#)
                  </span>
                </div>
              </div>
            </div>

            {/* Checkboxes LGPD */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 text-xs text-[#1F1A11]">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded accent-[#74520B]"
                  required
                />
                <span className="leading-relaxed">
                  Li e aceito os{' '}
                  <strong className="text-[#74520B] underline">
                    Termos de Uso
                  </strong>{' '}
                  e a{' '}
                  <strong className="text-[#74520B] underline">
                    Política de Privacidade
                  </strong>{' '}
                  do Passe Dourado (LGPD).
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-[#5A5243]">
                <input
                  type="checkbox"
                  checked={whatsappPromoConsent}
                  onChange={(e) => setWhatsappPromoConsent(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded accent-[#74520B]"
                />
                <span className="leading-relaxed">
                  Quero receber ofertas relâmpago e novidades gastronômicas
                  exclusivas das lojas do shopping por WhatsApp/E-mail.
                  (opcional)
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-full bg-[#74520B] py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-[#5E4108] active:scale-98 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Criando Passaporte...'
                : 'Criar conta e ganhar meu passaporte'}
            </button>
          </form>
        </div>
      ) : (
        /* ====================================================================
           SUBTELA 02.1 — CONFIRME SEU NÚMERO WHATSAPP (Conforme 5-codigo-whatsapp.png)
           ==================================================================== */
        <div className="space-y-5">
          {/* Top Bar: ← e 🛡️ Acesso seguro */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowOtpStep(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E6DFCE] bg-white text-[#1F1A11] shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_back
              </span>
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6DFCE] bg-white px-4 py-2 text-xs font-extrabold text-[#1F1A11] shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#74520B]">
                shield
              </span>
              Acesso seguro
            </span>
          </div>

          <div className="text-center">
            {/* Círculo Dourado com Ícone de Mensagem */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#EFE4C8] bg-[#74520B] text-white shadow-lg">
              <span className="material-symbols-outlined text-4xl">
                chat_bubble
              </span>
            </div>

            <h1 className="mt-5 font-serif text-3xl font-bold text-[#1F1A11]">
              Confirme seu número
            </h1>
            <p className="mt-2 text-xs text-[#5A5243]">
              Enviamos um código de 6 dígitos para o número
            </p>
            <p className="mt-1 font-sans text-xl font-black text-[#1F1A11]">
              {displayPhone}
            </p>
            <p className="mt-0.5 text-xs text-[#5A5243]">
              via WhatsApp para autenticar o seu Passaporte.
            </p>

            <button
              type="button"
              onClick={() => setShowOtpStep(false)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#74520B] bg-white px-5 py-2 text-xs font-extrabold text-[#74520B]"
            >
              <span className="material-symbols-outlined text-[15px]">
                edit
              </span>
              Alterar número
            </button>
          </div>

          {/* Card de 6 Dígitos (3 + • + 3) */}
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-3xl border border-[#E6DFCE] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs">
                <strong className="font-extrabold text-[#1F1A11]">
                  Código de verificação
                </strong>
                <span className="flex items-center gap-1.5 text-[#5A5243]">
                  <span className="h-2 w-2 rounded-full bg-[#C39953]" />
                  Aguardando dígitos
                </span>
              </div>

              <div className="my-5 flex items-center justify-center gap-2">
                {otpDigits.slice(0, 3).map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className={`h-16 w-12 rounded-2xl border-2 text-center font-sans text-xl font-black text-[#1F1A11] focus:border-[#74520B] focus:bg-white focus:outline-none ${
                      idx === 0
                        ? 'border-[#C39953] bg-white'
                        : 'border-[#E6DFCE] bg-[#F5F1E8]'
                    }`}
                  />
                ))}

                <span className="px-1 text-lg font-bold text-[#C8BFA8]">•</span>

                {otpDigits.slice(3, 6).map((digit, idx) => (
                  <input
                    key={idx + 3}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx + 3, e.target.value)}
                    className="h-16 w-12 rounded-2xl border-2 border-[#E6DFCE] bg-[#F5F1E8] text-center font-sans text-xl font-black text-[#1F1A11] focus:border-[#74520B] focus:bg-white focus:outline-none"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCountdown(46)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F5F1E8] py-3 text-xs font-bold text-[#5A5243]"
              >
                <span className="material-symbols-outlined text-[16px]">
                  schedule
                </span>
                Reenviar código em 00:{String(countdown).padStart(2, '0')}
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#74520B] py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-[#5E4108]"
            >
              <span className="material-symbols-outlined text-[18px]">
                verified_user
              </span>
              {isVerifyingOtp ? 'Confirmando...' : 'Confirmar e entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-[#5A5243]">
            Não recebeu no WhatsApp?{' '}
            <button
              type="button"
              onClick={() => setCountdown(46)}
              className="font-extrabold text-[#74520B] underline"
            >
              Enviar por SMS ↗
            </button>
          </p>

          {/* Card Concierge Passe Dourado */}
          <div className="flex items-center justify-between rounded-3xl border border-[#E6DFCE] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                <span className="material-symbols-outlined text-[20px]">
                  support_agent
                </span>
              </div>
              <div>
                <strong className="block text-xs font-extrabold text-[#1F1A11]">
                  Precisa de assistência?
                </strong>
                <span className="text-xs text-[#5A5243]">
                  Concierge Passe Dourado
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#5A5243]">
              chevron_right
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
