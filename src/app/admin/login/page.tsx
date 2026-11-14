'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PasseDouradoLogo } from '@/components/shared/PasseDouradoLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('admin@passedourado.com.br');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && json.data?.user?.role === 'ADMIN') {
          router.replace('/admin');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        setIsCheckingSession(false);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          redirectTo: '/admin',
        }),
      });
      const json = await res.json();

      if (!json.success || !json.data?.user) {
        setErrorMsg(
          json.error?.message ?? 'E-mail/usuário ou senha de administrador inválidos.'
        );
        return;
      }

      if (json.data.user.role !== 'ADMIN') {
        setErrorMsg(
          `Acesso bloqueado: a conta "${json.data.user.email}" possui perfil ${json.data.user.role} e não tem permissão de Administrador Geral.`
        );
        return;
      }

      window.dispatchEvent(new Event('passport:auth-updated'));
      router.replace('/admin');
    } catch {
      setErrorMsg('Falha ao conectar com o servidor de autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div className="mx-auto max-w-md py-16 text-center text-xs font-bold text-[#6E655A]">
        Verificando sessão administrativa...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-8 text-[#1E1914]">
      <div className="rounded-[28px] border border-[#EAE3D5] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center text-center">
          <PasseDouradoLogo size={56} variant="circle" />
          <span className="mt-3 rounded-full bg-[#F3E2BA] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#74520B]">
            🔒 ACESSO RESTRITO · RBAC ADMIN
          </span>
          <h1 className="mt-2 font-headline text-2xl font-bold text-[#1E1914]">
            Login Administrativo
          </h1>
          <p className="mt-1 text-xs leading-relaxed text-[#6E655A]">
            Área exclusiva da Superintendência e Administração Geral do Passe Dourado. Visitantes e lojistas não possuem acesso.
          </p>
        </div>

        {/* Credencial do Admin Padrão para Teste */}
        <div className="mt-5 rounded-2xl border border-[#E6DFCE] bg-[#FAF6EE] p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#74520B]">
              Admin Padrão
            </span>
            <button
              type="button"
              onClick={() => {
                setIdentifier('admin@passedourado.com.br');
                setPassword('Admin@2026');
                setErrorMsg(null);
              }}
              className="rounded-full bg-[#74520B] px-3 py-1 text-[10px] font-bold text-white transition hover:bg-[#5E4108]"
            >
              Preencher credenciais
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[#4E463E]">
            <strong>E-mail/Usuário:</strong>{' '}
            <code className="font-mono font-bold">admin@passedourado.com.br</code>{' '}
            (ou <code className="font-mono font-bold">admin_geral</code>)
          </p>
          <p className="text-[11px] text-[#4E463E]">
            <strong>Senha:</strong>{' '}
            <code className="font-mono font-bold">Admin@2026</code>
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-2xl border border-[#C92A2A]/30 bg-[#FDECEC] p-3 text-xs font-bold text-[#C92A2A]">
            ✕ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="admin-identifier"
              className="block text-xs font-bold text-[#1E1914]"
            >
              E-mail ou usuário administrativo
            </label>
            <input
              id="admin-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@passedourado.com.br"
              className="mt-1.5 w-full rounded-2xl border border-[#DFD7C8] bg-[#FAF6EE] px-4 py-3 text-sm font-medium text-[#1E1914] focus:border-[#74520B] focus:outline-none"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="admin-password"
                className="block text-xs font-bold text-[#1E1914]"
              >
                Senha do Administrador
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-[11px] font-bold text-[#74520B]"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="mt-1.5 w-full rounded-2xl border border-[#DFD7C8] bg-[#FAF6EE] px-4 py-3 text-sm font-medium text-[#1E1914] focus:border-[#74520B] focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#74520B] py-3.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#5E4108] disabled:opacity-50"
          >
            {isSubmitting
              ? 'Validando permissão ADMIN...'
              : 'Entrar no Painel Administrativo →'}
          </button>
        </form>

        <div className="mt-5 border-t border-[#EFE9DC] pt-4 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-[#6E655A] hover:text-[#74520B] hover:underline"
          >
            ← Voltar para a vitrine do shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
