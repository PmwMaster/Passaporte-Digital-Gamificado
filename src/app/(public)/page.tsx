'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StorefrontService } from '@/modules/storefront';
import { STORE_CATEGORIES } from '@/shared/constants';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function StorefrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  const highlights = StorefrontService.getPublicHighlights();
  const stores = StorefrontService.listPublicStores({
    query: searchQuery,
    category: selectedCategory,
  });

  return (
    <div>
      <ModuleHeader
        featureNumber="FUNCIONALIDADE 01"
        title="Vitrine Pública & Lojas Parceiras"
        subtitle="Explore lojas, campanhas sazonais e recompensas do Capim Dourado Shopping sem obrigatoriedade de login prévio."
        developerOwner="DESENVOLVEDOR 01"
        moduleName="storefront"
      />

      {/* Hero Editorial Banner */}
      <section className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-r from-[#261b06] via-brand-goldDark to-brand-goldLight p-8 text-white shadow-xl md:p-12">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest">
            Experiência Oficial • Capim Dourado Shopping
          </span>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Transforme cada visita ao shopping em carimbos, pontos e recompensas reais.
          </h2>
          <p className="mt-4 text-sm text-white/90 md:text-base">
            Navegue pelas lojas parceiras, escaneie os QR Codes oficiais presencialmente em Palmas - TO e troque seus pontos por cafés, gelatos, cinema e peças autorais em capim dourado.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/cadastro"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-goldDark shadow-sm transition hover:bg-brand-ivory"
            >
              Criar Meu Passaporte Digital
            </Link>
            <Link
              href="/passaporte"
              className="rounded-xl border border-white/40 bg-black/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/35"
            >
              Acessar Passaporte Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Campanhas Ativas */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Campanhas & Destaques da Temporada
          </h2>
          <span className="text-xs font-medium text-brand-emerald">
            {highlights.activeCampaigns.length} campanhas aprovadas
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {highlights.activeCampaigns.map((camp) => (
            <EditorialCard key={camp.id} className="border-l-4 border-l-brand-goldDark">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-brand-goldDark">
                  {camp.storeName ?? 'Campanha Oficial do Shopping'}
                </span>
                <span className="rounded-full bg-brand-emerald/10 px-2.5 py-0.5 font-semibold text-brand-emerald">
                  Multiplicador {camp.bonusMultiplier}x
                </span>
              </div>
              <h3 className="mt-2 font-serif text-xl font-bold text-brand-ink">
                {camp.title}
              </h3>
              <p className="mt-1.5 text-sm text-brand-muted">{camp.description}</p>
            </EditorialCard>
          ))}
        </div>
      </section>

      {/* Busca e Filtro por Categoria */}
      <section className="mb-8 rounded-2xl border border-brand-border bg-white p-5 shadow-editorial">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="store-search"
              className="block text-xs font-semibold uppercase tracking-wider text-brand-muted"
            >
              Buscar Lojas, Sabores ou Localização
            </label>
            <input
              id="store-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ex.: Café Jalapão, Gelato, Cinema, Capim Dourado, Piso 2..."
              className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-goldDark"
            />
          </div>
          <div>
            <label
              htmlFor="category-select"
              className="block text-xs font-semibold uppercase tracking-wider text-brand-muted"
            >
              Filtrar por Categoria
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-goldDark"
            >
              {STORE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Grade de Lojas Parceiras */}
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Lojas Parceiras ({stores.length})
          </h2>
          <span className="text-xs text-brand-muted">
            Navegação pública liberada • Login exigido apenas no check-in/resgate
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <EditorialCard key={store.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-brand-ivory px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-goldDark">
                    {store.category}
                  </span>
                  <span className="rounded-full bg-brand-emerald/10 px-3 py-1 text-xs font-semibold text-brand-emerald">
                    +{store.checkInPoints} pts / visita
                  </span>
                </div>
                <h3 className="mt-3 font-serif text-xl font-bold text-brand-ink">
                  {store.name}
                </h3>
                <p className="mt-1 text-xs font-medium text-brand-muted">
                  {store.floor} • Unidade {store.unitNumber}
                </p>
                <p className="mt-3 text-sm text-brand-muted">{store.description}</p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-brand-border pt-4">
                <Link
                  href={`/lojas/${store.slug}`}
                  className="text-xs font-semibold text-brand-goldDark hover:underline"
                >
                  Ver Página da Loja & Ofertas →
                </Link>
                <Link
                  href="/checkin"
                  className="rounded-lg bg-brand-goldDark px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-goldLight"
                >
                  Check-in QR
                </Link>
              </div>
            </EditorialCard>
          ))}
        </div>
      </section>
    </div>
  );
}
