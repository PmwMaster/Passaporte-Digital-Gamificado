'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

  // Modo de Login: 'whatsapp_otp' (direto pelo código no telefone) ou 'password' (senha + confirmação WhatsApp)
  const [loginMethod, setLoginMethod] = useState<'whatsapp_otp' | 'password'>(
    'whatsapp_otp'
  );
  const [loginWhatsAppMasked, setLoginWhatsAppMasked] =
    useState('(63) 99211-4455');
  const [loginIdentifier, setLoginIdentifier] = useState(
    'mariana.alves@exemplo.com.br'
  );
  const [loginPassword, setLoginPassword] = useState('Password@2026');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [requireOtpOnPasswordLogin, setRequireOtpOnPasswordLogin] =
    useState(true);

  // Estado Login Lojista (Fiel a login_do_lojista_desktop)
  const [merchantCnpj, setMerchantCnpj] = useState('12.345.678/0001-90');
  const [merchantPassword, setMerchantPassword] = useState('Password@2026');
  const [showMerchantPass, setShowMerchantPass] = useState(false);

  // Estado Cadastro (Fiel a tela_02_login_e_cadastro_desktop)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('(63) 98412-3456');
  const [password, setPassword] = useState('PasseDourado#2026');
  const [confirmPassword, setConfirmPassword] = useState('PasseDourado#2026');
  const [showRegPass, setShowRegPass] = useState(false);
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [optInMarketing, setOptInMarketing] = useState(true);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeUser, setActiveUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam === 'login' ||
      tabParam === 'register' ||
      tabParam === 'merchant'
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.authenticated && json.data?.user) {
          setActiveUser(json.data.user);
        } else {
          setActiveUser(null);
        }
      })
      .catch(() => null);
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setActiveUser(null);
    setIsError(false);
    setFeedback('Sessão encerrada com sucesso.');
    router.refresh();
  }

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
        ? 'Validando credenciais e enviando código de 6 dígitos para o seu WhatsApp...'
        : 'Autenticando no Passe Dourado...'
    );

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierToUse,
          password: passwordToUse,
          redirectTo,
          requireOtp,
        }),
      });
      const json = await res.json();

      if (json.success && json.data?.redirectUrl) {
        setFeedback(
          json.data.requiresOtp
            ? 'Código de 6 dígitos enviado para o WhatsApp! Redirecionando para confirmação...'
            : 'Acesso confirmado! Redirecionando...'
        );
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
    setIsError(false);
    setIsSubmitting(true);
    setFeedback('Gerando e enviando código de 6 dígitos para o seu WhatsApp...');

    const cleanDigits = loginWhatsAppMasked.replace(/\D/g, '');
    const e164Phone = `+55${cleanDigits || '63992114455'}`;

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone }),
      });
      const json = await res.json();

      if (json.success) {
        const preview = json.data?.devPreviewCode ?? '482910';
        const encodedPhone = encodeURIComponent(e164Phone);
        setFeedback('Código enviado via WhatsApp! Redirecionando para confirmação...');
        router.push(
          `/verificar-otp?phone=${encodedPhone}&preview=${preview}${
            redirectTo ? `&next=${encodeURIComponent(redirectTo)}` : ''
          }`
        );
      } else {
        setIsError(true);
        setFeedback(
          json.error?.message ??
            'Não foi possível enviar o código para este número.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVisitorPasswordLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    await executeLogin(
      loginIdentifier,
      loginPassword,
      requireOtpOnPasswordLogin
    );
  }

  async function handleMerchantLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanDigits = merchantCnpj.replace(/\D/g, '');
    const identifier =
      cleanDigits.length >= 11 && !merchantCnpj.includes('@')
        ? 'gerencia@cafejalapao.com.br'
        : merchantCnpj;
    await executeLogin(identifier, merchantPassword, false);
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsError(false);

    if (password !== confirmPassword) {
      setIsError(true);
      setFeedback('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setIsSubmitting(true);
    setFeedback(
      'Criando seu Passe Dourado (+50 pts) e enviando código de 6 dígitos no WhatsApp...'
    );

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
          optInMarketing,
        }),
      });
      const json = await res.json();

      if (json.success) {
        const preview = json.data?.otpDispatch?.devPreviewCode ?? '482910';
        const encodedPhone = encodeURIComponent(json.data.user.phone);
        router.push(`/verificar-otp?phone=${encodedPhone}&preview=${preview}`);
      } else {
        setIsError(true);
        setFeedback(
          json.error?.message ?? 'Não foi possível concluir o cadastro.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col w-full relative items-center justify-center py-4 md:py-8 overflow-hidden">
      {/* Subtle Architectural Luxury Backdrop (Fiel à Referência) */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div
          className="w-full h-full bg-cover bg-center filter blur-md scale-105 opacity-25"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDtfDaQ8hvVYW_AocysGv2qGeNJLFjJqPOd1RAnPT0XPzPTdl4LemX87Cz78v0SJZBT1PyBWrKp6EzlGCjxo9BG2VxdFieABDS8E4azjgA1FHuLI2WnpNbf7g5p_Jr-IcGNMnRaIL9JKeGj3PM7z0ryS-0Xqm_xLsC6F7IfRQew5wvLd5s26BqUj-E4bHnPKhNJ03q-UHAtanz7uI9UH4rwmmmSKlmnArVmlgu5rIQ')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-surface via-surface/90 to-surface-container-low/85" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary-fixed/20 blur-3xl" />
        <div className="absolute bottom-10 -right-24 w-96 h-96 rounded-full bg-secondary-container/20 blur-3xl" />
      </div>

      <div className="w-full max-w-5xl flex flex-col items-center">
        {/* Top Context Message */}
        <header className="text-center mb-6 max-w-2xl px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed/40 text-on-primary-fixed-variant font-label-md text-label-md mb-3">
            <span className="material-symbols-outlined text-[16px]">stars</span>
            <span>Passe Dourado • Vantagens Gastronômicas & Estilo</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-2">
            Entre ou cadastre-se com confirmação segura via WhatsApp
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            A experiência gastronômica e de compras do Passe Dourado Shopping com validação rápida por código de 6 dígitos no seu telefone.
          </p>
        </header>

        {/* Active Session Pill (when logged in) */}
        {activeUser && (
          <div className="w-full max-w-4xl mb-4 bg-secondary-container/40 border border-secondary/20 rounded-xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                verified_user
              </span>
              <div className="text-left">
                <p className="font-label-md text-label-md font-bold text-on-surface">
                  Sessão ativa: {activeUser.name}{' '}
                  <span className="text-secondary uppercase">
                    ({activeUser.role})
                  </span>
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {activeUser.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={
                  activeUser.role === 'ADMIN'
                    ? '/admin'
                    : activeUser.role === 'MERCHANT' ||
                      activeUser.role === 'OPERATOR'
                    ? '/lojista'
                    : '/passaporte'
                }
                className="px-3.5 py-1.5 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:opacity-95 transition"
              >
                Ir para Meu Painel →
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-full bg-surface-container-highest text-on-surface font-label-md text-label-md font-semibold hover:bg-error-container hover:text-on-error-container transition cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        )}

        {/* Welcome Celebration Ribbon */}
        <div className="w-full max-w-4xl mb-6 bg-gradient-to-r from-primary-container/25 via-primary-fixed/40 to-primary-container/25 rounded-xl p-3.5 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                redeem
              </span>
            </div>
            <div>
              <span className="font-title-md text-title-md text-on-surface font-semibold block leading-tight">
                🎉 Presente de Chegada: Ganhe +50 pontos dourados logo no seu cadastro!
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Confirme seu número no WhatsApp para ativar o resgate imediato de vouchers nas lojas.
              </span>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-primary font-label-lg text-label-lg">
            Verificação WhatsApp
            <span className="material-symbols-outlined text-[18px]">
              verified
            </span>
          </span>
        </div>

        {/* Centered 12-Col Modal Layout (Fiel a tela_02_login_e_cadastro_desktop) */}
        <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
          {/* Left Hero Showcase: Passe Dourado */}
          <aside className="lg:col-span-5 bg-gradient-to-b from-surface-container to-surface-container-high p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Golden Filigree Motif Background Element */}
            <div className="absolute -right-16 -top-16 opacity-10 pointer-events-none text-primary">
              <svg
                fill="currentColor"
                height="280"
                viewBox="0 0 100 100"
                width="280"
              >
                <ellipse
                  cx="50"
                  cy="50"
                  fill="none"
                  rx="46"
                  ry="24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <ellipse
                  cx="50"
                  cy="50"
                  fill="none"
                  rx="24"
                  ry="46"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="50" cy="50" fill="currentColor" r="18" />
              </svg>
            </div>

            <div className="relative z-10">
              {/* Logo & Brand Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                  <svg
                    fill="currentColor"
                    height="26"
                    viewBox="0 0 40 40"
                    width="26"
                  >
                    <circle cx="20" cy="20" fill="#c59b4e" r="12" />
                    <path
                      d="M6 20C12 10 28 10 34 20"
                      fill="none"
                      stroke="#7a580f"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M6 20C12 30 28 30 34 20"
                      fill="none"
                      stroke="#7a580f"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-headline-md text-headline-md tracking-wider leading-none text-on-surface">
                    PASSE DOURADO
                  </p>
                  <p className="font-label-sm text-label-sm tracking-[0.2em] text-primary uppercase font-bold">
                    Shopping • Palmas
                  </p>
                </div>
              </div>

              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
                {activeTab === 'merchant'
                  ? 'Agilidade no Caixa e Experiência Exclusiva'
                  : 'Segurança e praticidade via WhatsApp'}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                {activeTab === 'merchant'
                  ? 'Validação imediata de selos gastronômicos, descontos VIP e cupons de fidelidade diretamente integrados ao smartphone do cliente.'
                  : 'Seu número de WhatsApp é a chave segura do seu Passe Dourado para proteger seus pontos e validar resgates nas lojas.'}
              </p>

              {/* Benefits List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm transition hover:scale-[1.02]">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">
                      sms
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface">
                      Confirmação por Código WhatsApp
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Código de 6 dígitos enviado na hora para confirmar sua identidade sem burocracia.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm transition hover:scale-[1.02]">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">
                      near_me
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface">
                      Check-in por Geolocalização
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Reconhecimento automático num raio de 250m ao visitar o shopping.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm transition hover:scale-[1.02]">
                  <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">
                      local_offer
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface">
                      Vouchers Digitais Instantâneos
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Troque seus pontos por cafés, gelatos, cinema e descontos exclusivos.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loyalty Passport Micro Preview */}
            <div className="mt-8 pt-6 relative z-10 flex items-center justify-between bg-gradient-to-r from-primary-container to-primary text-on-primary rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[28px]">
                  workspace_premium
                </span>
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-widest text-primary-fixed">
                    Status Inicial
                  </p>
                  <p className="font-title-md text-title-md font-bold">
                    Membro Passe Dourado
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-on-primary/20 text-on-primary font-label-md text-label-md font-bold tracking-wider">
                +50 PTS
              </span>
            </div>
          </aside>

          {/* Right Column: Form Content */}
          <section className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            <div>
              {/* Segmented Tab Selector (Entrar | Criar conta | Lojista/Caixa) */}
              <div className="w-full grid grid-cols-3 p-1 bg-surface-container-high rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setFeedback(null);
                  }}
                  className={`py-2.5 text-center font-label-lg text-label-lg rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'login'
                      ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    login
                  </span>
                  <span>Entrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setFeedback(null);
                  }}
                  className={`py-2.5 text-center font-label-lg text-label-lg rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'register'
                      ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    how_to_reg
                  </span>
                  <span>Criar conta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('merchant');
                    setFeedback(null);
                  }}
                  className={`py-2.5 text-center font-label-lg text-label-lg rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'merchant'
                      ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    point_of_sale
                  </span>
                  <span>Lojista</span>
                </button>
              </div>

              {/* Feedback Message */}
              {feedback && (
                <div
                  className={`mb-5 p-3.5 rounded-xl font-label-md text-label-md flex items-center gap-2 ${
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

              {/* TAB 1: CRIAR CONTA COM CONFIRMAÇÃO DE WHATSAPP */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                      Nome completo
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Mariana Silva"
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[20px] text-outline pointer-events-none">
                        person
                      </span>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                      E-mail{' '}
                      <span className="text-primary font-normal">
                        (Para comprovantes de vouchers)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mariana.silva@exemplo.com.br"
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[20px] text-outline pointer-events-none">
                        mail
                      </span>
                    </div>
                  </div>

                  {/* Phone / WhatsApp with Palmas DDD mask */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-label-md text-label-md text-on-surface font-semibold">
                        Telefone / WhatsApp
                      </label>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-secondary">
                        <span className="material-symbols-outlined text-[14px]">
                          sms
                        </span>
                        Receberá o código de 6 dígitos
                      </span>
                    </div>
                    <div className="relative flex">
                      <div className="flex items-center gap-1 px-3 py-2.5 rounded-l-lg bg-surface-container-high text-on-surface font-label-md text-label-md flex-shrink-0">
                        <span className="font-bold">🇧🇷 +55</span>
                      </div>
                      <input
                        type="tel"
                        value={phoneMasked}
                        onChange={(e) =>
                          setPhoneMasked(formatBrPhoneMask(e.target.value))
                        }
                        placeholder="(63) 98412-3456"
                        required
                        className="w-full px-3.5 py-2.5 rounded-r-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-[20px] text-outline pointer-events-none">
                        smartphone
                      </span>
                    </div>
                  </div>

                  {/* Password Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Senha
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass((p) => !p)}
                          className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface focus:outline-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showRegPass ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Confirmar senha
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition"
                        />
                        <span
                          className={`material-symbols-outlined absolute right-3 top-2.5 text-[20px] pointer-events-none ${
                            passwordChecks.passwordsMatch
                              ? 'text-secondary'
                              : 'text-outline'
                          }`}
                        >
                          check_circle
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  <div className="p-2.5 rounded-lg bg-surface-container-low">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Força da senha:
                      </span>
                      <span
                        className={`font-label-sm text-label-sm font-bold flex items-center gap-1 ${
                          passwordChecks.score === 3
                            ? 'text-secondary'
                            : 'text-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          shield
                        </span>
                        {passwordChecks.score === 3
                          ? 'Forte e segura'
                          : passwordChecks.score === 2
                          ? 'Quase pronta'
                          : 'Adicione requisitos'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3].map((step) => (
                        <div
                          key={step}
                          className={`h-full w-1/3 rounded-full transition-all ${
                            passwordChecks.score >= step
                              ? passwordChecks.score === 3
                                ? 'bg-secondary'
                                : 'bg-primary-container'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 font-label-sm text-label-sm">
                      <div
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasMinLength
                            ? 'text-secondary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {passwordChecks.hasMinLength
                            ? 'done'
                            : 'radio_button_unchecked'}
                        </span>
                        <span>+8 caracteres</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasNumber
                            ? 'text-secondary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {passwordChecks.hasNumber
                            ? 'done'
                            : 'radio_button_unchecked'}
                        </span>
                        <span>1 número</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 ${
                          passwordChecks.hasSpecial
                            ? 'text-secondary'
                            : 'text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {passwordChecks.hasSpecial
                            ? 'done'
                            : 'radio_button_unchecked'}
                        </span>
                        <span>Especial (*#)</span>
                      </div>
                    </div>
                  </div>

                  {/* Legal and Consent Checkboxes */}
                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={lgpdConsent}
                        onChange={(e) => setLgpdConsent(e.target.checked)}
                        required
                        className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary-container accent-primary"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                        Li e aceito os{' '}
                        <span className="text-primary underline font-medium">
                          Termos de Uso
                        </span>{' '}
                        e a{' '}
                        <span className="text-primary underline font-medium">
                          Política de Privacidade
                        </span>{' '}
                        do Passe Dourado (LGPD).
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={optInMarketing}
                        onChange={(e) => setOptInMarketing(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary-container accent-primary"
                      />
                      <span className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                        Quero receber meu código de verificação e ofertas relâmpago por WhatsApp.
                      </span>
                    </label>
                  </div>

                  {/* Main Golden Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {isSubmitting
                          ? 'Criando Conta e Enviando Código...'
                          : 'Criar conta e confirmar código no WhatsApp'}
                      </span>
                      <span className="material-symbols-outlined text-[20px]">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ENTRAR VISITANTE (COM CONFIRMAÇÃO DE CÓDIGO NO WHATSAPP) */}
              {activeTab === 'login' && (
                <>
                  {/* Seletor de Método de Entrada: Código WhatsApp vs E-mail e Senha */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-surface-container-low border border-surface-container-high mb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('whatsapp_otp');
                        setFeedback(null);
                      }}
                      className={`py-2 px-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        loginMethod === 'whatsapp_otp'
                          ? 'bg-secondary text-on-secondary font-bold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        sms
                      </span>
                      <span>Código no WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setFeedback(null);
                      }}
                      className={`py-2 px-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        loginMethod === 'password'
                          ? 'bg-primary text-on-primary font-bold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        password
                      </span>
                      <span>E-mail e Senha</span>
                    </button>
                  </div>

                  {loginMethod === 'whatsapp_otp' ? (
                    <form
                      onSubmit={handleWhatsAppOtpLoginSubmit}
                      className="space-y-4"
                    >
                      <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high">
                        <p className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                          <span className="material-symbols-outlined text-secondary text-[20px]">
                            verified_user
                          </span>
                          Acesso com Confirmação no Telefone (WhatsApp)
                        </p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          Digite seu número de telefone cadastrado. Enviaremos um código de 6 dígitos no seu WhatsApp para liberar seu Passe Dourado.
                        </p>
                      </div>

                      <div>
                        <label className="block font-label-md text-label-md text-on-surface font-semibold mb-1.5">
                          Número de Telefone / WhatsApp
                        </label>
                        <div className="relative flex">
                          <div className="flex items-center gap-1 px-3.5 py-3 rounded-l-lg bg-surface-container-high text-on-surface font-label-md text-label-md flex-shrink-0">
                            <span className="font-bold">🇧🇷 +55</span>
                          </div>
                          <input
                            type="tel"
                            value={loginWhatsAppMasked}
                            onChange={(e) =>
                              setLoginWhatsAppMasked(
                                formatBrPhoneMask(e.target.value)
                              )
                            }
                            placeholder="(63) 99211-4455"
                            required
                            className="w-full px-3.5 py-3 rounded-r-lg bg-surface-container-low text-on-surface font-title-md text-title-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary transition"
                          />
                          <span className="material-symbols-outlined absolute right-3.5 top-3 text-[22px] text-secondary pointer-events-none">
                            chat_bubble
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 rounded-full bg-secondary hover:opacity-95 text-on-secondary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                      >
                        <span>
                          {isSubmitting
                            ? 'Enviando código para o WhatsApp...'
                            : 'Enviar código de 6 dígitos no WhatsApp'}
                        </span>
                        <span className="material-symbols-outlined text-[20px]">
                          send
                        </span>
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleVisitorPasswordLoginSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                          E-mail ou Telefone / WhatsApp
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            placeholder="Seu e-mail ou WhatsApp cadastrado"
                            required
                            className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition"
                          />
                          <span className="material-symbols-outlined absolute right-3 top-2.5 text-[20px] text-outline pointer-events-none">
                            person
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-label-md text-label-md text-on-surface-variant">
                            Senha
                          </label>
                          <button
                            type="button"
                            onClick={() => setLoginMethod('whatsapp_otp')}
                            className="font-label-sm text-label-sm text-secondary underline cursor-pointer"
                          >
                            Prefiro entrar só com código WhatsApp
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showLoginPass ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Digite sua senha"
                            required
                            className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPass((p) => !p)}
                            className="absolute right-2.5 top-2.5 text-outline hover:text-on-surface focus:outline-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showLoginPass ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container-low cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={requireOtpOnPasswordLogin}
                          onChange={(e) =>
                            setRequireOtpOnPasswordLogin(e.target.checked)
                          }
                          className="mt-0.5 w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                          <strong className="text-on-surface">
                            Confirmar código de 6 dígitos no WhatsApp (2 Etapas)
                          </strong>{' '}
                          — envia o código para o telefone da conta antes de abrir o passaporte.
                        </span>
                      </label>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                      >
                        <span>
                          {isSubmitting
                            ? 'Processando...'
                            : requireOtpOnPasswordLogin
                            ? 'Continuar e Confirmar no WhatsApp'
                            : 'Acessar minha conta'}
                        </span>
                        <span className="material-symbols-outlined text-[20px]">
                          arrow_forward
                        </span>
                      </button>
                    </form>
                  )}

                  {/* Acesso Rápido para Apresentação / Perfis */}
                  <div className="mt-6 pt-5 border-t border-surface-container-high">
                    <span className="block font-label-sm text-label-sm uppercase tracking-wider text-outline mb-2.5">
                      Acesso Rápido de Demonstração (1 Clique):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          executeLogin(
                            'mariana.alves@exemplo.com.br',
                            'Password@2026',
                            false
                          )
                        }
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low hover:bg-primary-fixed/40 transition text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          workspace_premium
                        </span>
                        <div className="min-w-0">
                          <p className="font-label-md text-label-md font-bold text-on-surface truncate">
                            Visitante Ouro
                          </p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                            Mariana • 640 pts
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executeLogin(
                            'gerencia@cafejalapao.com.br',
                            'Password@2026',
                            false
                          )
                        }
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low hover:bg-secondary-container/40 transition text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-secondary text-[18px]">
                          storefront
                        </span>
                        <div className="min-w-0">
                          <p className="font-label-md text-label-md font-bold text-on-surface truncate">
                            Caixa / Lojista
                          </p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                            Café Jalapão
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          executeLogin(
                            'admin@passedourado.com.br',
                            'Password@2026',
                            false
                          )
                        }
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low hover:bg-tertiary-fixed/40 transition text-left cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-tertiary text-[18px]">
                          admin_panel_settings
                        </span>
                        <div className="min-w-0">
                          <p className="font-label-md text-label-md font-bold text-on-surface truncate">
                            Administração
                          </p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                            Gestão Shopping
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3: ACESSO DO LOJISTA (Fiel a login_do_lojista_desktop) */}
              {activeTab === 'merchant' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-sm tracking-wider uppercase">
                      <span className="material-symbols-outlined text-sm">
                        point_of_sale
                      </span>
                      Portal do Lojista & Caixa
                    </span>
                    <span className="font-label-sm text-on-surface-variant flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      Terminal Ativo
                    </span>
                  </div>

                  <h2 className="font-display-lg text-headline-lg text-on-surface">
                    Acesso do Lojista
                  </h2>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    Informe o CNPJ registrado ou e-mail da operação e a senha de operador para liberar o terminal de conferência.
                  </p>

                  <form
                    onSubmit={handleMerchantLoginSubmit}
                    className="mt-6 space-y-5"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-label-md text-on-surface font-semibold">
                          CNPJ da Operação
                        </label>
                        <span className="font-label-sm text-primary bg-primary-fixed/50 px-2 py-0.5 rounded">
                          Formato Oficial
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none">
                          domain
                        </span>
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
                          className="w-full pl-11 pr-4 py-3 bg-surface rounded-lg font-body-lg text-on-surface placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-sm transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-label-md text-on-surface font-semibold">
                          Senha de Acesso
                        </label>
                        <span className="font-label-sm text-primary">
                          Ramal Concierge: 204
                        </span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3.5 text-outline pointer-events-none">
                          lock
                        </span>
                        <input
                          type={showMerchantPass ? 'text' : 'password'}
                          value={merchantPassword}
                          onChange={(e) => setMerchantPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-11 pr-12 py-3 bg-surface rounded-lg font-body-lg text-on-surface placeholder:text-outline-variant focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary shadow-sm transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowMerchantPass((p) => !p)}
                          className="absolute right-3 text-outline hover:text-on-surface flex items-center p-1"
                        >
                          <span className="material-symbols-outlined text-xl">
                            {showMerchantPass ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                        />
                        <span className="font-body-sm text-on-surface-variant select-none">
                          Lembrar este terminal de caixa
                        </span>
                      </label>
                      <span className="font-label-sm text-secondary bg-secondary-fixed/50 px-2 py-0.5 rounded font-semibold">
                        Sincronização Live
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-full bg-primary-container text-on-primary font-label-lg tracking-wide hover:opacity-95 shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Acessar Painel do Lojista</span>
                      <span className="material-symbols-outlined text-lg">
                        arrow_forward
                      </span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Footer Redirection */}
            <div className="pt-5 mt-6 text-center border-t border-surface-container">
              {activeTab === 'register' ? (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Já tem uma conta?
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-primary font-bold underline hover:text-primary-container ml-1 cursor-pointer"
                  >
                    Entrar agora
                  </button>
                </p>
              ) : (
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Ainda não possui passaporte?
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-primary font-bold underline hover:text-primary-container ml-1 cursor-pointer"
                  >
                    Cadastre-se grátis (+50 pts)
                  </button>
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Security & Mall Stamp Seal Footer (Fiel à Referência) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">
              lock
            </span>
            <span>Ambiente Criptografado SSL 256-bit</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">
              verified_user
            </span>
            <span>Conforme com a Lei Geral de Proteção de Dados (LGPD)</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary-container">
              location_on
            </span>
            <span>Palmas, Tocantins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
