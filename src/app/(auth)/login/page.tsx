'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? undefined;

  const [identifier, setIdentifier] = useState('mariana.alves@exemplo.com.br');
  const [password, setPassword] = useState('Password@2026');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsError(false);
    setFeedback('Validando credenciais e emitindo JWT HttpOnly...');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, redirectTo }),
    });
    const json = await res.json();

    if (json.success && json.data?.redirectUrl) {
      setFeedback(`Acesso liberado! Redirecionando para ${json.data.redirectUrl}...`);
      router.push(json.data.redirectUrl);
    } else {
      setIsError(true);
      setFeedback(json.error?.message ?? 'Falha na autenticação');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setActiveUser(null);
    setIsError(false);
    setFeedback('Sessão encerrada e cookie HttpOnly removido com sucesso.');
  }

  return (
    <div>
      <ModuleHeader
        featureNumber="FASE 1 • FUNCIONALIDADE 02 (TELA 2A)"
        title="Entrar no Passaporte Digital (Sessão JWT & RBAC)"
        subtitle="Autenticação por e-mail ou telefone, redirecionamento inteligente pós-login (redirectTo) e integração Neon Auth / JWKS."
        developerOwner="DESENVOLVEDOR 01"
        moduleName="authentication"
      />

      {activeUser && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-emerald/40 bg-brand-emerald/10 p-4 text-xs">
          <div>
            <span className="font-bold text-brand-emerald">SESSÃO JWT ATIVA:</span>{' '}
            <strong className="text-brand-ink">{activeUser.name}</strong> ({activeUser.email} • Papel:{' '}
            <code>{activeUser.role}</code>)
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-brand-ink px-3.5 py-1.5 font-semibold text-white hover:bg-red-800"
          >
            Encerrar Sessão (Logout)
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Acessar Minha Conta
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            {redirectTo
              ? `Faça login para continuar para ${redirectTo}`
              : 'Entre com seu e-mail ou WhatsApp cadastrado.'}
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                E-mail ou Telefone Celular
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm outline-none focus:border-brand-goldDark"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm outline-none focus:border-brand-goldDark"
                required
              />
            </div>

            {feedback && (
              <div
                className={`rounded-xl p-3 text-xs font-semibold ${
                  isError
                    ? 'border border-red-300 bg-red-50 text-red-800'
                    : 'bg-brand-emerald/10 text-brand-emerald'
                }`}
              >
                {feedback}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-brand-goldDark to-brand-goldLight py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Entrar no Passaporte Digital
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-brand-border pt-4 text-xs">
            <Link
              href="/cadastro"
              className="font-semibold text-brand-goldDark hover:underline"
            >
              Criar nova conta (+50 pts de boas-vindas) →
            </Link>
            <Link
              href="/verificar-otp"
              className="text-brand-emerald hover:underline"
            >
              Verificar código WhatsApp (OTP) →
            </Link>
          </div>
        </EditorialCard>

        <EditorialCard className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-brand-ink">
            Alternar Rápido entre Perfis (RBAC)
          </h3>
          <p className="text-xs text-brand-muted">
            Clique em um perfil abaixo para preencher as credenciais (senha padrão: <code>Password@2026</code>):
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setIdentifier('mariana.alves@exemplo.com.br');
                setPassword('Password@2026');
              }}
              className="w-full rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-left text-xs transition hover:border-brand-goldDark"
            >
              <strong className="block text-brand-ink">
                1. Visitante (ROLE: VISITOR) → /passaporte
              </strong>
              <span className="text-brand-muted">mariana.alves@exemplo.com.br</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('gerencia@cafejalapao.com.br');
                setPassword('Password@2026');
              }}
              className="w-full rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-left text-xs transition hover:border-brand-goldDark"
            >
              <strong className="block text-brand-ink">
                2. Lojista / Caixa (ROLE: MERCHANT) → /lojista
              </strong>
              <span className="text-brand-muted">gerencia@cafejalapao.com.br</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIdentifier('admin@capimdouradoshopping.com.br');
                setPassword('Password@2026');
              }}
              className="w-full rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-left text-xs transition hover:border-brand-goldDark"
            >
              <strong className="block text-brand-ink">
                3. Administração do Shopping (ROLE: ADMIN) → /admin
              </strong>
              <span className="text-brand-muted">admin@capimdouradoshopping.com.br</span>
            </button>
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-brand-muted">
          Carregando tela de autenticação...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
