'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
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

  // Login Visitante
  const [loginIdentifier, setLoginIdentifier] = useState(
    'mariana.alves@exemplo.com.br'
  );
  const [loginPassword, setLoginPassword] = useState('Password@2026');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Login Lojista
  const [merchantCnpj, setMerchantCnpj] = useState('12.345.678/0001-90');
  const [merchantPassword, setMerchantPassword] = useState('Password@2026');
  const [showMerchantPass, setShowMerchantPass] = useState(false);

  // Cadastro
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('(63) 98412-3456');
  const [password, setPassword] = useState('PasseDourado#2026');
  const [confirmPassword, setConfirmPassword] = useState('PasseDourado#2026');
  const [showRegPass, setShowRegPass] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(true);

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

  async function executeLogin(identifierToUse: string, passwordToUse: string) {
    setIsError(false);
    setIsSubmitting(true);
    setFeedback('Autenticando...');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierToUse,
          password: passwordToUse,
          redirectTo,
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

  async function handleVisitorLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    await executeLogin(loginIdentifier, loginPassword);
  }

  async function handleMerchantLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanDigits = merchantCnpj.replace(/\D/g, '');
    const identifier =
      cleanDigits.length >= 11 && !merchantCnpj.includes('@')
        ? 'gerencia@cafejalapao.com.br'
        : merchantCnpj;
    await executeLogin(identifier, merchantPassword);
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setFeedback('As senhas digitadas não conferem.');
      return;
    }

    setIsSubmitting(true);
    setFeedback('Criando conta e gerando código WhatsApp...');

    const cleanPhoneDigits = phoneMasked.replace(/\D/g, '');
    const e164Phone = `+55${cleanPhoneDigits || '63984123456'}`;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          phone: e164Phone,
          password,
          lgpdConsent,
          optInMarketing: false,
        }),
      });
      const json = await res.json();

      if (json.success) {
        const preview = json.data?.otpDispatch?.devPreviewCode ?? '482910';
        const encodedPhone = encodeURIComponent(json.data.user.phone);
        router.push(`/verificar-otp?phone=${encodedPhone}&preview=${preview}`);
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

        {/* ABA 1: LOGIN */}
        {activeTab === 'login' && (
          <div>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface mb-1">
              Acessar Passaporte
            </h1>
            <p className="text-xs text-on-surface-variant mb-5">
              Entre com seu e-mail ou WhatsApp cadastrado.
            </p>

            <form onSubmit={handleVisitorLoginSubmit} className="space-y-4">
              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  E-mail ou WhatsApp
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-label-md text-xs text-on-surface-variant">
                    Senha
                  </label>
                  <Link
                    href="/verificar-otp"
                    className="text-xs text-primary hover:underline"
                  >
                    Validar código WhatsApp
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary text-sm font-bold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Atalhos Rápidos de Perfil */}
            <div className="mt-6 pt-4 border-t border-surface-container-high">
              <span className="block text-[11px] font-semibold uppercase text-outline mb-2">
                Entrar com 1 clique:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    executeLogin(
                      'mariana.alves@exemplo.com.br',
                      'Password@2026'
                    )
                  }
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-primary-fixed/40 text-xs font-semibold text-on-surface transition cursor-pointer"
                >
                  Visitante
                </button>
                <button
                  type="button"
                  onClick={() =>
                    executeLogin(
                      'gerencia@cafejalapao.com.br',
                      'Password@2026'
                    )
                  }
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-secondary-container/40 text-xs font-semibold text-on-surface transition cursor-pointer"
                >
                  Lojista
                </button>
                <button
                  type="button"
                  onClick={() =>
                    executeLogin(
                      'admin@passedourado.com.br',
                      'Password@2026'
                    )
                  }
                  className="p-2 rounded-xl bg-surface-container-low hover:bg-tertiary-fixed/40 text-xs font-semibold text-on-surface transition cursor-pointer"
                >
                  Admin
                </button>
              </div>
            </div>
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
                  placeholder="Mariana Silva"
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
                  placeholder="mariana.silva@exemplo.com.br"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  WhatsApp
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
                    placeholder="(63) 98412-3456"
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
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
              </div>

              {/* Barra compacta de requisitos da senha */}
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1">
                <span className={passwordChecks.hasMinLength ? 'text-secondary font-semibold' : ''}>
                  ✓ 8+ caracteres
                </span>
                <span className={passwordChecks.hasNumber ? 'text-secondary font-semibold' : ''}>
                  ✓ 1 número
                </span>
                <span className={passwordChecks.hasSpecial ? 'text-secondary font-semibold' : ''}>
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
                  ? 'Criando conta...'
                  : 'Criar conta e ganhar +50 pts'}
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
              Entre com o CNPJ ou e-mail da loja para validar vouchers no balcão.
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
                  placeholder="00.000.000/0000-00"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-label-md text-xs text-on-surface-variant mb-1">
                  Senha de Operador
                </label>
                <div className="relative">
                  <input
                    type={showMerchantPass ? 'text' : 'password'}
                    value={merchantPassword}
                    onChange={(e) => setMerchantPassword(e.target.value)}
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
