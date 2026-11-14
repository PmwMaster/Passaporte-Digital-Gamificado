'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('mariana.alves@exemplo.com.br');
  const [password, setPassword] = useState('Password@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  async function handleLogin(
    e?: React.FormEvent,
    overrideIdentifier?: string
  ) {
    if (e) e.preventDefault();
    const targetId = overrideIdentifier ?? identifier;
    setIsLoading(true);
    setFeedback({
      type: 'info',
      text: 'Autenticando credenciais no Passe Dourado...',
    });

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: targetId, password }),
      });
      const json = await res.json();
      if (json.success && json.data?.redirectUrl) {
        setFeedback({
          type: 'success',
          text: `Bem-vindo(a)! Redirecionando para ${json.data.redirectUrl}...`,
        });
        router.push(json.data.redirectUrl);
      } else {
        setFeedback({
          type: 'error',
          text: json.error?.message ?? 'Credenciais inválidas.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        text: 'Erro de conexão com o servidor de autenticação.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      {/* Cabeçalho Desktop (Conforme Passe-Dourado-desktop-cliente-3-entrar-criar-conta.png) */}
      <div className="mb-6 hidden text-center lg:block">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFE4C8] px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#74520B]">
          ☆ PASSAPORTE DO SHOPPING
        </span>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#1F1A11]">
          Entre ou cadastre-se para acumular
          <br />
          pontos e resgatar vouchers
        </h1>
        <p className="mt-2 text-sm text-[#5A5243]">
          A experiência gastronômica e de compras do Passe Dourado, com
          recompensas instantâneas.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* COLUNA ESQUERDA (DESKTOP): PRIVILÉGIOS DE MEMBRO + ACESSO RÁPIDO RBAC */}
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-5">
          {/* Card Como funciona seu Passaporte (Conforme 4-entrar.png) */}
          <div className="rounded-3xl border border-[#E6DFCE] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#74520B] text-white">
                  <span className="material-symbols-outlined text-[16px] icon-filled">
                    star
                  </span>
                </div>
                <h2 className="font-serif text-xl font-bold text-[#1F1A11] leading-snug">
                  Como funciona seu Passaporte
                </h2>
              </div>
              <span className="rounded-full bg-[#256B30] px-3 py-1 text-xs font-extrabold text-white">
                Grátis
              </span>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-[#5A5243]">
              Viva o melhor do shopping com recompensas automáticas a cada
              visita:
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-2xl border border-[#E6DFCE] bg-[#F6F2E9] p-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                  <span className="material-symbols-outlined text-[20px]">
                    qr_code_scanner
                  </span>
                </div>
                <span className="mt-2 block text-xs font-extrabold text-[#1F1A11]">
                  1. Escaneie
                </span>
              </div>

              <div className="rounded-2xl border border-[#E6DFCE] bg-[#F6F2E9] p-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                  <span className="material-symbols-outlined text-[20px]">
                    toll
                  </span>
                </div>
                <span className="mt-2 block text-xs font-extrabold text-[#1F1A11]">
                  2. Acumule
                </span>
              </div>

              <div className="rounded-2xl border border-[#E6DFCE] bg-[#F6F2E9] p-3">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EFE4C8] text-[#74520B]">
                  <span className="material-symbols-outlined text-[20px]">
                    redeem
                  </span>
                </div>
                <span className="mt-2 block text-xs font-extrabold text-[#1F1A11]">
                  3. Troque
                </span>
              </div>
            </div>
          </div>

          {/* Acesso Rápido por Perfil (Demo RBAC) */}
          <div className="rounded-3xl border border-[#E6DFCE] bg-[#EFE4C8]/60 p-5">
            <h3 className="font-serif text-base font-bold text-[#1F1A11]">
              Acesso Rápido Demonstrativo (RBAC)
            </h3>
            <p className="mt-0.5 text-xs text-[#5A5243]">
              Clique para entrar diretamente em qualquer ambiente:
            </p>

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('mariana.alves@exemplo.com.br');
                  handleLogin(undefined, 'mariana.alves@exemplo.com.br');
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-[#D8CEB8] bg-white px-4 py-3 text-left text-xs transition hover:border-[#74520B]"
              >
                <div>
                  <strong className="block text-[#1F1A11]">
                    1. Cliente / Visitante → Meu Passaporte
                  </strong>
                  <span className="text-[#6E6556]">
                    Mariana Silva (150 pts • Nível Ouro)
                  </span>
                </div>
                <span className="font-extrabold text-[#74520B]">Entrar →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('gerencia@cafejalapao.com.br');
                  handleLogin(undefined, 'gerencia@cafejalapao.com.br');
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-[#D8CEB8] bg-white px-4 py-3 text-left text-xs transition hover:border-[#256B30]"
              >
                <div>
                  <strong className="block text-[#1F1A11]">
                    2. Lojista / Caixa POS → Café Exemplo
                  </strong>
                  <span className="text-[#6E6556]">
                    Caixa 01 · Lucas R. (Validar voucher)
                  </span>
                </div>
                <span className="font-extrabold text-[#256B30]">Entrar →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin@capimdouradoshopping.com.br');
                  handleLogin(undefined, 'admin@capimdouradoshopping.com.br');
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-[#D8CEB8] bg-white px-4 py-3 text-left text-xs transition hover:border-[#1F1A11]"
              >
                <div>
                  <strong className="block text-[#1F1A11]">
                    3. Admin Geral → Supervisão do Shopping
                  </strong>
                  <span className="text-[#6E6556]">
                    KPIs, Fila de aprovação, Lojas e Totens QR
                  </span>
                </div>
                <span className="font-extrabold text-[#1F1A11]">Entrar →</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CARD DE LOGIN (Conforme 4-entrar.png) */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <div className="rounded-3xl border border-[#E6DFCE] bg-[#FAF6EE] p-6 shadow-md sm:bg-white sm:p-8">
            {/* Banner Creme Topo (Conforme 4-entrar.png) */}
            <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-[#EFE4C8] p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#74520B] shadow-sm">
                <span className="material-symbols-outlined text-[22px]">
                  confirmation_number
                </span>
              </div>
              <p className="font-sans text-sm font-extrabold text-[#1F1A11] leading-snug">
                Entre para resgatar seus cupons e acumular pontos!
              </p>
            </div>

            {/* Segmented Pill Switcher: Entrar | Criar conta */}
            <div className="mb-6 grid grid-cols-2 rounded-full border border-[#E6DFCE] bg-white p-1.5">
              <div className="rounded-full bg-[#74520B] py-3 text-center text-sm font-extrabold text-white shadow-sm">
                Entrar
              </div>
              <Link
                href="/cadastro"
                className="rounded-full py-3 text-center text-sm font-extrabold text-[#1F1A11] transition hover:bg-[#F3ECE0]"
              >
                Criar conta
              </Link>
            </div>

            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-extrabold text-[#1F1A11]">
                  E-mail ou celular
                </label>
                <div className="relative mt-1.5">
                  <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#74520B]">
                    call
                  </span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="(63) 99999-9999"
                    className="w-full rounded-2xl border border-[#E2DAC6] bg-white py-3.5 pl-12 pr-4 text-sm font-medium text-[#1F1A11] focus:border-[#74520B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-extrabold text-[#1F1A11]">
                    Sua senha
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFeedback({
                        type: 'info',
                        text: 'Enviamos as instruções de recuperação para seu WhatsApp/E-mail.',
                      })
                    }
                    className="text-xs font-extrabold text-[#74520B] underline underline-offset-4"
                  >
                    Esqueci minha senha
                  </button>
                </div>
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6E6556] hover:text-[#1F1A11]"
                    aria-label="Mostrar senha"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {feedback && (
                <div
                  className={`rounded-2xl p-3.5 text-xs font-bold ${
                    feedback.type === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : 'bg-[#E6F2E8] text-[#1D5726] border border-[#256B30]/30'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#74520B] py-4 text-sm font-extrabold text-white shadow-md transition hover:bg-[#5E4108] active:scale-98 disabled:opacity-50"
              >
                <span>
                  {isLoading ? 'Autenticando...' : 'Entrar no Passaporte'}
                </span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </form>

            {/* Divisor OU CONTINUE COM */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E2DAC6]" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#6E6556]">
                OU CONTINUE COM
              </span>
              <div className="h-px flex-1 bg-[#E2DAC6]" />
            </div>

            <button
              type="button"
              onClick={() =>
                handleLogin(undefined, 'mariana.alves@exemplo.com.br')
              }
              className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#D8CEB8] bg-white py-3.5 text-sm font-extrabold text-[#1F1A11] shadow-sm transition hover:bg-[#FAF6EE]"
            >
              <span className="material-symbols-outlined text-[20px] text-[#5A5243]">
                language
              </span>
              Continuar com o Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
