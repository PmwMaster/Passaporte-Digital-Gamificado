'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('mariana.alves@exemplo.com.br');
  const [password, setPassword] = useState('Password@2026');
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFeedback('Autenticando via JWT Cookie HttpOnly...');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const json = await res.json();
    if (json.success && json.data?.redirectUrl) {
      router.push(json.data.redirectUrl);
    } else {
      setFeedback(json.error?.message ?? 'Falha na autenticação');
    }
  }

  return (
    <div>
      <ModuleHeader
        featureNumber="FUNCIONALIDADE 02"
        title="Autenticação, Sessão JWT & Verificação OTP"
        subtitle="Controle de acesso por papel (Visitante, Lojista, Operador e Administrador) com cookies HttpOnly e hash bcryptjs."
        developerOwner="DESENVOLVEDOR 01"
        moduleName="authentication"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Entrar no Passaporte Digital
          </h2>
          <p className="mt-1 text-xs text-brand-muted">
            Acesse com seu e-mail ou telefone cadastrado.
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
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
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
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
                required
              />
            </div>

            {feedback && (
              <div className="rounded-xl bg-brand-emerald/10 p-3 text-xs font-medium text-brand-emerald">
                {feedback}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-brand-goldDark to-brand-goldLight py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Entrar com Cookie JWT HttpOnly
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-brand-border pt-4 text-xs">
            <Link
              href="/cadastro"
              className="font-semibold text-brand-goldDark hover:underline"
            >
              Ainda não tem conta? Cadastre-se →
            </Link>
            <span className="text-brand-muted">Recuperar senha (Mock)</span>
          </div>
        </EditorialCard>

        <EditorialCard className="space-y-4">
          <h3 className="font-serif text-xl font-bold text-brand-ink">
            Credenciais Demonstrativas Rápidas (RBAC)
          </h3>
          <p className="text-xs text-brand-muted">
            Selecione um perfil abaixo para preencher o formulário e testar o redirecionamento automático por permissão:
          </p>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setIdentifier('mariana.alves@exemplo.com.br')}
              className="w-full rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-left text-xs transition hover:border-brand-goldDark"
            >
              <strong className="block text-brand-ink">
                1. Visitante (ROLE: VISITOR) → /passaporte
              </strong>
              <span className="text-brand-muted">mariana.alves@exemplo.com.br</span>
            </button>

            <button
              type="button"
              onClick={() => setIdentifier('gerencia@cafejalapao.com.br')}
              className="w-full rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-left text-xs transition hover:border-brand-goldDark"
            >
              <strong className="block text-brand-ink">
                2. Lojista / Operador (ROLE: MERCHANT) → /lojista
              </strong>
              <span className="text-brand-muted">gerencia@cafejalapao.com.br</span>
            </button>

            <button
              type="button"
              onClick={() => setIdentifier('admin@capimdouradoshopping.com.br')}
              className="w-full rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-left text-xs transition hover:border-brand-goldDark"
            >
              <strong className="block text-brand-ink">
                3. Administrador do Shopping (ROLE: ADMIN) → /admin
              </strong>
              <span className="text-brand-muted">admin@capimdouradoshopping.com.br</span>
            </button>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
            <strong>Status de Decisões Pendentes (docs/DUVIDAS_E_PREMISSAS.md):</strong>
            <ul className="mt-1 list-disc pl-4 space-y-1">
              <li>
                <strong>P0-01 (OTP WhatsApp):</strong> Encapsulado via <code>MockWhatsAppOtpAdapter</code> até definição do provedor (Meta Cloud API / Twilio / Z-API).
              </li>
              <li>
                <strong>P1-01 (Login Social Google):</strong> Opcional no MVP, preparado via adaptador OAuth.
              </li>
            </ul>
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
