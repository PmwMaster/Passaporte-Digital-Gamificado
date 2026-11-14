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

  // Estado Login Visitante / Geral
  const [loginIdentifier, setLoginIdentifier] = useState(
    'mariana.alves@exemplo.com.br'
  );
  const [loginPassword, setLoginPassword] = useState('Password@2026');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Estado Login Lojista (Fiel a login_do_lojista_desktop)
  const [merchantCnpj, setMerchantCnpj] = useState('12.345.678/0001-90');
  const [merchantPassword, setMerchantPassword] = useState('Password@2026');
  const [showMerchantPass, setShowMerchantPass] = useState(false);

  // Estado Cadastro (Fiel a tela_02_login_e_cadastro_desktop)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneMasked, setPhoneMasked] = useState('(63) 98412-3456');
  const [password, setPassword] = useState('CapimDourado#2026');
  const [confirmPassword, setConfirmPassword] = useState('CapimDourado#2026');
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
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.user) {
          setActiveUser(json.data.user);
        }
      })
      .catch(() => null);
  }, []);

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
    setFeedback('Autenticando no Passaporte Capim Dourado...');

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
        setFeedback('Acesso confirmado! Redirecionando...');
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
    // Se digitou um CNPJ, autentica na conta oficial da loja credenciada
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
      setFeedback('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    setIsSubmitting(true);
    setFeedback('Criando seu Passaporte Digital e creditando +50 pontos...');

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
        setFeedback(json.error?.message ?? 'Não foi possível concluir o cadastro.');
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
            <span>Passaporte de Vantagens Gastronômicas & Estilo</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-2">
            Entre ou cadastre-se para acumular pontos e resgatar vouchers exclusivos
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            A experiência gastronômica e de compras do Capim Dourado Shopping com recompensas instantâneas.
          </p>
        </header>

        {/* Welcome Celebration Ribbon */}
        <div className="w-full max-w-4xl mb-6 bg-gradient-to-r from-primary-container/25 via-primary-fixed/40 to-primary-container/25 rounded-xl p-3.5 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary shadow-sm flex-shrink-0">
              <span className="material-symbols-outlined text-[20px]">redeem</span>
            </div>
            <div>
              <span className="font-title-md text-title-md text-on-surface font-semibold block leading-tight">
                🎉 Presente de Chegada: Ganhe +50 pontos dourados logo no seu cadastro!
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Pronto para usar em sobremesas, cafés selecionados ou descontos imediatos.
              </span>
            </div>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-primary font-label-lg text-label-lg">
            Benefício Ativo
            <span className="material-symbols-outlined text-[18px]">verified</span>
          </span>
        </div>

        {/* Centered 12-Col Modal Layout (Fiel a tela_02_login_e_cadastro_desktop) */}
        <div className="w-full max-w-4xl bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative">
          {/* Left Hero Showcase: Passaporte Capim Dourado */}
          <aside className="lg:col-span-5 bg-gradient-to-b from-surface-container to-surface-container-high p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Golden Filigree Motif Background Element */}
            <div className="absolute -right-16 -top-16 opacity-10 pointer-events-none text-primary">
              <svg fill="currentColor" height="280" viewBox="0 0 100 100" width="280">
                <ellipse cx="50" cy="50" fill="none" rx="46" ry="24" stroke="currentColor" strokeWidth="1.5" />
                <ellipse cx="50" cy="50" fill="none" rx="24" ry="46" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="50" cy="50" fill="currentColor" r="18" />
              </svg>
            </div>

            <div className="relative z-10">
              {/* Logo & Brand Header */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
                  <svg fill="currentColor" height="26" viewBox="0 0 40 40" width="26">
                    <circle cx="20" cy="20" fill="#c59b4e" r="12" />
                    <path d="M6 20C12 10 28 10 34 20" fill="none" stroke="#7a580f" strokeWidth="1.8" />
                    <path d="M6 20C12 30 28 30 34 20" fill="none" stroke="#7a580f" strokeWidth="1.8" />
                  </svg>
                </div>
                <div>
                  <p className="font-headline-md text-headline-md tracking-wider leading-none text-on-surface">
                    CAPIM DOURADO
                  </p>
                  <p className="font-label-sm text-label-sm tracking-[0.2em] text-primary uppercase font-bold">
                    Shopping • Palmas
                  </p>
                </div>
              </div>

              <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
                {activeTab === 'merchant'
                  ? 'Agilidade no Caixa e Experiência Exclusiva'
                  : 'Privilégios de ser membro exclusivo'}
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6">
                {activeTab === 'merchant'
                  ? 'Validação imediata de selos gastronômicos, descontos VIP e cupons de fidelidade diretamente integrados ao smartphone do cliente.'
                  : 'Apresente seu passaporte digital nas lojas e restaurantes conveniados para usufruir de conveniências únicas.'}
              </p>

              {/* Benefits List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm transition hover:scale-[1.02]">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">near_me</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface">
                      Check-in por Geolocalização
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Reconhecimento automático num raio de 250m ao pisar no shopping.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm transition hover:scale-[1.02]">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface">
                      Resgates Ágeis sem Fila
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Validação por QR Code direto no caixa do estabelecimento parceiro.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm shadow-sm transition hover:scale-[1.02]">
                  <div className="w-8 h-8 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">local_offer</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-title-md text-title-md text-on-surface">
                      Cupons de Marcas Premium
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Ofertas gastronômicas e moda com até 40% OFF exclusivas aos sócios.
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
                    Membro Ouro Dourado
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
                  <span className="material-symbols-outlined text-[18px]">login</span>
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
                  <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
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
                  <span className="material-symbols-outlined text-[18px]">point_of_sale</span>
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

              {/* TAB 1: CRIAR CONTA (Fiel a tela_02_login_e_cadastro_desktop) */}
              {activeTab === 'register' && (
                <>
                  {/* Quick Google Auth Button */}
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() =>
                        executeLogin('mariana.alves@exemplo.com.br', 'Password@2026')
                      }
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm font-label-lg text-label-lg text-on-surface cursor-pointer"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Continuar com o Google</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-5">
                    <div className="w-full h-px bg-surface-container-high" />
                    <span className="absolute px-3 bg-surface-container-lowest font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider">
                      ou preencha com seus dados
                    </span>
                  </div>

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
                          (Para receber vouchers)
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
                      <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                        Telefone / WhatsApp
                      </label>
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
                          do Passaporte Capim Dourado (LGPD).
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
                          Quero receber ofertas relâmpago e benefícios gastronômicos exclusivos por WhatsApp e e-mail.
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
                            ? 'Criando Passaporte...'
                            : 'Criar conta e ganhar meu passaporte'}
                        </span>
                        <span className="material-symbols-outlined text-[20px]">
                          arrow_forward
                        </span>
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* TAB 2: ENTRAR VISITANTE (Fiel a tela_02_login_e_cadastro_desktop) */}
              {activeTab === 'login' && (
                <>
                  {/* Quick Google Auth Button */}
                  <div className="mb-5">
                    <button
                      type="button"
                      onClick={() =>
                        executeLogin('mariana.alves@exemplo.com.br', 'Password@2026')
                      }
                      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors shadow-sm font-label-lg text-label-lg text-on-surface cursor-pointer"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span>Continuar com o Google</span>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-5">
                    <div className="w-full h-px bg-surface-container-high" />
                    <span className="absolute px-3 bg-surface-container-lowest font-body-sm text-body-sm text-on-surface-variant uppercase tracking-wider">
                      ou entre com sua conta
                    </span>
                  </div>

                  <form onSubmit={handleVisitorLoginSubmit} className="space-y-4">
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
                        <Link
                          href="/verificar-otp"
                          className="font-label-sm text-label-sm text-primary underline"
                        >
                          Validar via Código WhatsApp
                        </Link>
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

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-full bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                    >
                      <span>
                        {isSubmitting ? 'Autenticando...' : 'Acessar minha conta'}
                      </span>
                      <span className="material-symbols-outlined text-[20px]">
                        login
                      </span>
                    </button>
                  </form>

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
                            'Password@2026'
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
                            'Password@2026'
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
                            'admin@capimdouradoshopping.com.br',
                            'Password@2026'
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

                  <form onSubmit={handleMerchantLoginSubmit} className="mt-6 space-y-5">
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
