'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+5563992');
  const [password, setPassword] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [optInMarketing, setOptInMarketing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RN-10: Avaliação em tempo real da força da senha
  const passwordChecks = useMemo(() => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasMinLength, hasNumber, hasSpecial].filter(Boolean).length;
    return { hasMinLength, hasNumber, hasSpecial, score, isValid: score === 3 };
  }, [password]);

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
          phone,
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
        setErrorMsg(json.error?.message ?? 'Erro ao validar cadastro.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <ModuleHeader
        categoryBadge="Novo Membro • Capim Dourado Shopping"
        title="Criar Meu Passaporte Digital"
        subtitle="Cadastre-se gratuitamente e receba 50 pontos de boas-vindas para trocar por experiências exclusivas no shopping."
      />

      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-5">
        <EditorialCard className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-brand-ink">
              Novo Membro Capim Dourado
            </h2>
            <span className="rounded-full bg-brand-emerald/15 px-3 py-1 text-xs font-bold text-brand-emerald">
              +50 pts de Boas-Vindas
            </span>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Mariana Alves"
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm outline-none focus:border-brand-goldDark"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com.br"
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm outline-none focus:border-brand-goldDark"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  WhatsApp (Para Código OTP)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+5563992114455"
                  className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm outline-none focus:border-brand-goldDark"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Crie sua Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ex.: Capim@2026"
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm outline-none focus:border-brand-goldDark"
                required
              />

              {/* Medidor de Força da Senha (RN-10) */}
              <div className="mt-2 rounded-xl border border-brand-border bg-brand-ivory p-3 text-xs">
                <div className="mb-2 flex gap-1.5">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        passwordChecks.score >= step
                          ? passwordChecks.score === 3
                            ? 'bg-brand-emerald'
                            : 'bg-brand-goldLight'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <ul className="space-y-1 text-[11px]">
                  <li
                    className={
                      passwordChecks.hasMinLength
                        ? 'font-semibold text-brand-emerald'
                        : 'text-brand-muted'
                    }
                  >
                    {passwordChecks.hasMinLength ? '✓' : '○'} Mínimo de 8 caracteres
                  </li>
                  <li
                    className={
                      passwordChecks.hasNumber
                        ? 'font-semibold text-brand-emerald'
                        : 'text-brand-muted'
                    }
                  >
                    {passwordChecks.hasNumber ? '✓' : '○'} Pelo menos 1 número (0-9)
                  </li>
                  <li
                    className={
                      passwordChecks.hasSpecial
                        ? 'font-semibold text-brand-emerald'
                        : 'text-brand-muted'
                    }
                  >
                    {passwordChecks.hasSpecial ? '✓' : '○'} Pelo menos 1 caractere especial (@, #, !, %)
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-ivory p-3.5 text-xs text-brand-ink">
                <input
                  type="checkbox"
                  checked={lgpdConsent}
                  onChange={(e) => setLgpdConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-goldDark"
                  required
                />
                <span>
                  <strong>Aceite LGPD (Obrigatório):</strong> Concordo com os Termos de Uso e Política de Privacidade do Passaporte Capim Dourado e autorizo a verificação pontual de geolocalização no check-in.
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-brand-border bg-white p-3 text-xs text-brand-muted">
                <input
                  type="checkbox"
                  checked={optInMarketing}
                  onChange={(e) => setOptInMarketing(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-goldDark"
                />
                <span>
                  Desejo receber novidades de campanhas e ofertas exclusivas do Capim Dourado Shopping via WhatsApp/E-mail (Opcional).
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs font-semibold text-red-800">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-gradient-to-r from-brand-goldDark to-brand-goldLight py-3.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Criando Passaporte & Enviando OTP...'
                : 'Criar Conta, Ganhar +50 pts & Verificar WhatsApp →'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs">
            <Link
              href="/login"
              className="font-semibold text-brand-goldDark hover:underline"
            >
              Já possui passaporte? Entrar na minha conta →
            </Link>
          </div>
        </EditorialCard>

        <EditorialCard className="space-y-4 lg:col-span-2">
          <span className="rounded-full bg-brand-goldDark/10 px-3 py-1 text-[11px] font-semibold uppercase text-brand-goldDark">
            Vantagens Exclusivas
          </span>
          <h3 className="font-serif text-xl font-bold text-brand-ink">
            Benefícios do seu Passaporte Digital:
          </h3>
          <ol className="space-y-3 text-xs text-brand-muted">
            <li>
              <strong className="text-brand-ink">1. Bônus de Boas-Vindas (+50 pts):</strong> Seu Passaporte já começa no nível <strong>Bronze Cerrado</strong> com <strong>50 pontos</strong> creditados na hora.
            </li>
            <li>
              <strong className="text-brand-ink">2. Carimbos nas Lojas Parceiras:</strong> A cada visita presencial com leitura do QR Code da loja, você ganha novos carimbos e acumula pontos.
            </li>
            <li>
              <strong className="text-brand-ink">3. Vouchers Digitais Instantâneos:</strong> Troque seus pontos por cafés especiais, gelatos artesanais, ingressos e brindes diretamente pelo celular.
            </li>
            <li>
              <strong className="text-brand-ink">4. Confirmação Rápida via WhatsApp:</strong> Valide seu número com o código de 6 dígitos para proteger seus resgates.
            </li>
          </ol>
        </EditorialCard>
      </div>
    </div>
  );
}
