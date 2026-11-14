'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+5563992');
  const [password, setPassword] = useState('');
  const [lgpdConsent, setLgpdConsent] = useState(true);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password, lgpdConsent }),
    });
    const json = await res.json();
    if (json.success) {
      setResultMsg(
        `Passaporte criado com sucesso! Código de membro: ${json.data.profile.memberCode} (OTP simulado via ${json.data.otpDispatch.provider}).`
      );
    } else {
      setResultMsg(json.error?.message ?? 'Erro ao validar cadastro.');
    }
  }

  return (
    <div>
      <ModuleHeader
        featureNumber="FUNCIONALIDADE 02 — CADASTRO & LGPD"
        title="Criar Passaporte Digital do Visitante"
        subtitle="Cadastro com minimização de dados pessoais, aceite explícito da LGPD e disparo de verificação OTP."
        developerOwner="DESENVOLVEDOR 01"
        moduleName="authentication"
      />

      <EditorialCard className="mx-auto max-w-2xl">
        <h2 className="font-serif text-2xl font-bold text-brand-ink">
          Novo Membro Capim Dourado
        </h2>
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
              className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
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
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
                Telefone / WhatsApp (OTP)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Senha (mínimo 8 caracteres)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm"
              required
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-ivory p-4 text-xs text-brand-ink">
            <input
              type="checkbox"
              checked={lgpdConsent}
              onChange={(e) => setLgpdConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-brand-goldDark"
              required
            />
            <span>
              <strong>Consentimento LGPD (Obrigatório):</strong> Concordo com os Termos do Programa Passaporte Capim Dourado e autorizo o uso pontual da geolocalização exclusivamente no ato do check-in presencial para validação de distância.
            </span>
          </label>

          {resultMsg && (
            <div className="rounded-xl bg-brand-emerald/10 p-4 text-xs font-semibold text-brand-emerald">
              {resultMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-brand-goldDark to-brand-goldLight py-3 text-sm font-semibold text-white"
          >
            Criar Passaporte & Receber Bônus de Boas-Vindas
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          <Link href="/login" className="font-semibold text-brand-goldDark hover:underline">
            Já possui passaporte? Fazer Login →
          </Link>
        </div>
      </EditorialCard>
    </div>
  );
}
