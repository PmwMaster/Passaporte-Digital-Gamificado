'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function formatBrPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^55/, '').slice(0, 11);
  if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length > 2) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length > 0) {
    return `(${digits}`;
  }
  return '';
}

function formatCnpjMask(raw: string): string {
  const v = raw.replace(/\D/g, '').slice(0, 14);
  if (v.length > 12) {
    return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
  }
  if (v.length > 8) {
    return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, '$1.$2.$3/$4');
  }
  if (v.length > 5) {
    return v.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
  }
  if (v.length > 2) {
    return v.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
  }
  return v;
}

export function AuthPortalView({
  initialTab = 'login',
}: {
  initialTab?: 'login' | 'register' | 'merchant';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? undefined;

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'merchant'>(
    initialTab
  );

  // Modo de Login Visitante: 'whatsapp_otp' (código direto no WhatsApp) ou 'password' (e-mail/telefone + senha)
  const [loginMethod, setLoginMethod] = useState<'whatsapp_otp' | 'password'>(
    'whatsapp_otp'
  );
  const [loginPhoneMasked, setLoginPhoneMasked] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [requireOtpOnLogin, setRequireOtpOnLogin] = useState(true);

  // Login Lojista
  const [merchantCnpj, setMerchantCnpj] = useState('');
  const [merchantPassword, setMerchantPassword] = useState('');
  const [showMerchantPass, setShowMerchantPass] = useState(false);

  // Cadastro
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;
    return {
      hasMinLength,
      hasNumber,
      hasSpecial,
      score,
      passwordsMatch: password.length > 0 && password === confirmPassword,
    };
  }, [password, confirmPassword]);

  async function executeLogin(
    identifierToUse: string,
    passwordToUse: string,
    requireOtp = false
  ) {
    setIsError(false);
    setIsSubmitting(true);
    setFeedback(
      requireOtp
        ? 'Validando credenciais e enviando código para seu WhatsApp...'
        : 'Autenticando...'
    );

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierToUse.trim(),
          password: passwordToUse,
          redirectTo,
          requireOtp,
        }),
      });
      const json = await res.json();

      if (json.success && json.data?.redirectUrl) {
        router.push(json.data.redirectUrl);
        router.refresh();
      } else {
        setIsError(true);
        setFeedback(json.error?.message ?? 'Credenciais inválidas.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWhatsAppOtpLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanDigits = loginPhoneMasked.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setIsError(true);
      setFeedback('Informe seu número de WhatsApp com DDD (ex: 63 99999-9999).');
      return;
    }

    setIsError(false);
    setIsSubmitting(true);
    setFeedback('Enviando código de 6 dígitos para seu WhatsApp...');

    const e164Phone = `+55${cleanDigits}`;

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone }),
      });
      const json = await res.json();

      if (json.success) {
        const encodedPhone = encodeURIComponent(e164Phone);
        router.push(
          `/verificar-otp?phone=${encodedPhone}${
            redirectTo ? `&next=${encodeURIComponent(redirectTo)}` : ''
          }`
        );
      } else {
        setIsError(true);
        setFeedback(
          json.error?.message ??
            'Não foi possível enviar o código no WhatsApp.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVisitorLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setIsError(true);
      setFeedback('Preencha seu e-mail/telefone e sua senha.');
      return;
    }
    await executeLogin(loginIdentifier, loginPassword, requireOtpOnLogin);
  }

  async function handleMerchantLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!merchantCnpj.trim() || !merchantPassword) {
      setIsError(true);
      setFeedback('Preencha o CNPJ ou e-mail da loja e a senha.');
      return;
    }
    await executeLogin(merchantCnpj, merchantPassword, false);
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setFeedback('As senhas digitadas não conferem.');
      return;
    }

    if (!lgpdConsent) {
      setIsError(true);
      setFeedback('Você precisa aceitar os Termos e a Política de Privacidade.');
      return;
    }

    setIsSubmitting(true);
    setFeedback('Criando sua conta e enviando código para seu WhatsApp...');

    const cleanPhoneDigits = phoneMasked.replace(/\D/g, '');
    const e164Phone = `+55${cleanPhoneDigits}`;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: e164Phone,
          password,
          lgpdConsent: true,
          optInMarketing: false,
        }),
      });
      const json = await res.json();

      if (json.success) {
        const encodedPhone = encodeURIComponent(json.data.user.phone);
        router.push(`/verificar-otp?phone=${encodedPhone}`);
      } else {
        setIsError(true);
        setFeedback(json.error?.message ?? 'Erro ao concluir cadastro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="rounded-2xl bg-surface-container-lowest p-6 sm:p-8 shadow-editorial border border-surface-container-high">
        {/* Seletor de Abas */}
        <div className="grid grid-cols-3 p-1 bg-surface-container-high rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setFeedback(null);
            }}
            className={`py-2 text-center font-label-lg text-xs rounded-lg transition cursor-pointer ${
              activeTab === 'login'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setFeedback(null);
            }}
            className={`py-2 text-center font-label-lg text-xs rounded-lg transition cursor-pointer ${
              activeTab === 'register'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Criar conta (+50 pts)
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('merchant');
              setFeedback(null);
            }}
            className={`py-2 text-center font-label-lg text-xs rounded-lg transition cursor-pointer ${
              activeTab === 'merchant'
                ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Lojista / Caixa
          </button>
        </div>

        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
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

        {/* ABA 1: LOGIN COM CONFIRMAÇÃO NO WHATSAPP */}
        {activeTab === 'login' && (
          <div>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface mb-1">
              Acessar Passe Dourado
            </h1>
            <p className="text-xs text-on-surface-variant mb-4">
              Confirme seu acesso com código de 6 dígitos enviado para o seu WhatsApp.
            </p>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-container-low rounded-xl mb-5 border border-surface-container-high">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('whatsapp_otp');
                  setFeedback(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  loginMethod === 'whatsapp_otp'
                    ? 'bg-secondary text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Código no WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  setFeedback(null);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  loginMethod === 'password'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                E-mail e Senha
              </button>
            </div>

            {loginMethod === 'whatsapp_otp' ? (
              <form
                onSubmit={handleWhatsAppOtpLoginSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                    Seu Número de Telefone / WhatsApp
                  </label>
                  <div className="flex">
                    <span className="flex items-center px-3 py-2.5 rounded-l-lg bg-surface-container-high text-xs font-bold text-on-surface">
                      +55
                    </span>
                    <input
                      type="tel"
                      value={loginPhoneMasked}
                      onChange={(e) =>
                        setLoginPhoneMasked(formatBrPhoneMask(e.target.value))
                      }
                      placeholder="(DDD) 99999-9999"
                      required
                      className="w-full px-3.5 py-2.5 rounded-r-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-full bg-secondary hover:opacity-95 text-on-secondary text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Enviando código...'
                    : 'Receber código de 6 dígitos no WhatsApp'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVisitorLoginSubmit} className="space-y-4">
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                    E-mail ou WhatsApp
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="seu.email@exemplo.com ou (DDD) 99999-9999"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>

                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha de acesso"
                      required
                      className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass((p) => !p)}
                      className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showLoginPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requireOtpOnLogin}
                    onChange={(e) => setRequireOtpOnLogin(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-secondary"
                  />
                  <span className="text-xs text-on-surface-variant">
                    Confirmar código de 6 dígitos no WhatsApp ao entrar
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Processando...'
                    : requireOtpOnLogin
                    ? 'Entrar e confirmar no WhatsApp'
                    : 'Entrar'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ABA 2: CADASTRO */}
        {activeTab === 'register' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-headline-md text-2xl font-bold text-on-surface">
                Criar Conta
              </h1>
              <span className="px-2.5 py-1 rounded-full bg-primary-fixed/60 text-on-primary-fixed text-xs font-bold">
                +50 pts de bônus
              </span>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  WhatsApp (receberá o código de 6 dígitos)
                </label>
                <div className="flex">
                  <span className="flex items-center px-3 py-2.5 rounded-l-lg bg-surface-container-high text-xs font-bold text-on-surface">
                    +55
                  </span>
                  <input
                    type="tel"
                    value={phoneMasked}
                    onChange={(e) =>
                      setPhoneMasked(formatBrPhoneMask(e.target.value))
                    }
                    placeholder="(DDD) 99999-9999"
                    required
                    className="w-full px-3.5 py-2.5 rounded-r-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      required
                      className="w-full px-3.5 py-2.5 pr-9 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass((p) => !p)}
                      className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showRegPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                    Confirmar senha
                  </label>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
              </div>

              {/* Barra de requisitos da senha */}
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1">
                <span
                  className={
                    passwordChecks.hasMinLength
                      ? 'text-secondary font-semibold'
                      : ''
                  }
                >
                  ✓ 8+ caracteres
                </span>
                <span
                  className={
                    passwordChecks.hasNumber
                      ? 'text-secondary font-semibold'
                      : ''
                  }
                >
                  ✓ 1 número
                </span>
                <span
                  className={
                    passwordChecks.hasSpecial
                      ? 'text-secondary font-semibold'
                      : ''
                  }
                >
                  ✓ 1 símbolo (*#)
                </span>
              </div>

              <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  required
                  className="mt-0.5 w-4 h-4 rounded accent-primary"
                />
                <span className="text-xs text-on-surface-variant">
                  Aceito os Termos de Uso e a Política de Privacidade (LGPD).
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting
                  ? 'Enviando código WhatsApp...'
                  : 'Criar conta e confirmar no WhatsApp'}
              </button>
            </form>
          </div>
        )}

        {/* ABA 3: LOJISTA */}
        {activeTab === 'merchant' && (
          <div>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface mb-1">
              Acesso do Lojista
            </h1>
            <p className="text-xs text-on-surface-variant mb-5">
              Entre com o CNPJ ou e-mail da loja parceira.
            </p>

            <form onSubmit={handleMerchantLoginSubmit} className="space-y-4">
              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  CNPJ ou E-mail da Loja
                </label>
                <input
                  type="text"
                  value={merchantCnpj}
                  onChange={(e) =>
                    setMerchantCnpj(
                      e.target.value.includes('@')
                        ? e.target.value
                        : formatCnpjMask(e.target.value)
                    )
                  }
                  placeholder="00.000.000/0000-00 ou loja@exemplo.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type={showMerchantPass ? 'text' : 'password'}
                    value={merchantPassword}
                    onChange={(e) => setMerchantPassword(e.target.value)}
                    placeholder="Sua senha de lojista"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMerchantPass((p) => !p)}
                    className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showMerchantPass ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                Acessar Painel do Lojista
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
