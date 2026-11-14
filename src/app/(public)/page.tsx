'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StorefrontService } from '@/modules/storefront';
import { STORE_CATEGORIES } from '@/shared/constants';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function StorefrontPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  const highlights = StorefrontService.getPublicHighlights();
  const stores = StorefrontService.listPublicStores({
    query: searchQuery,
    category: selectedCategory,
  });

  return (
    <div className="space-y-8">
      {/* Banner Principal Compacto */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#261b06] via-brand-goldDark to-brand-goldLight p-6 text-white shadow-lg md:p-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <h1 className="font-serif text-2xl font-bold leading-tight md:text-4xl">
              Passaporte Capim Dourado
            </h1>
            <p className="mt-2 text-sm text-white/90">
              Faça check-in nas lojas parceiras, acumule pontos e troque por recompensas no shopping.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/checkin"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-goldDark shadow-sm transition hover:bg-brand-ivory"
            >
              Fazer Check-in
            </Link>
            <Link
              href="/passaporte"
              className="rounded-xl border border-white/40 bg-black/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/35"
            >
              Meu Passaporte
            </Link>
          </div>
        </div>
      </section>

      {/* Busca e Filtro por Categoria */}
      <section className="rounded-2xl border border-brand-border bg-white p-4 shadow-editorial">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <input
              id="store-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar loja, categoria ou piso..."
              className="w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-goldDark"
            />
          </div>
          <div>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-brand-border bg-brand-ivory px-4 py-2.5 text-sm text-brand-ink outline-none focus:border-brand-goldDark"
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

      {/* Campanhas Ativas */}
      {highlights.activeCampaigns.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-xl font-bold text-brand-ink">
            Campanhas Ativas
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {highlights.activeCampaigns.map((camp) => (
              <EditorialCard key={camp.id} className="border-l-4 border-l-brand-goldDark">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-brand-goldDark">
                    {camp.storeName ?? 'Shopping'}
                  </span>
                  <span className="rounded-full bg-brand-emerald/10 px-2.5 py-0.5 font-semibold text-brand-emerald">
                    {camp.bonusMultiplier}x pontos
                  </span>
                </div>
                <h3 className="mt-1.5 font-serif text-lg font-bold text-brand-ink">
                  {camp.title}
                </h3>
                <p className="mt-1 text-xs text-brand-muted">{camp.description}</p>
              </EditorialCard>
            ))}
          </div>
        </section>
      )}

      {/* Grade de Lojas Parceiras */}
      <section>
        <h2 className="mb-4 font-serif text-xl font-bold text-brand-ink">
          Lojas Parceiras ({stores.length})
        </h2>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <EditorialCard key={store.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-brand-ivory px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-goldDark">
                    {store.category}
                  </span>
                  <span className="rounded-full bg-brand-emerald/10 px-2.5 py-0.5 text-xs font-semibold text-brand-emerald">
                    +{store.checkInPoints} pts
                  </span>
                </div>
                <h3 className="mt-2.5 font-serif text-lg font-bold text-brand-ink">
                  {store.name}
                </h3>
                <p className="text-xs text-brand-muted">
                  {store.floor} • {store.unitNumber}
                </p>
                <p className="mt-2 text-xs text-brand-muted line-clamp-2">{store.description}</p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-brand-border pt-3">
                <Link
                  href={`/lojas/${store.slug}`}
                  className="text-xs font-semibold text-brand-goldDark hover:underline"
                >
                  Ver Ofertas →
                </Link>
                <Link
                  href="/checkin"
                  className="rounded-lg bg-brand-goldDark px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-goldLight"
                >
                  Check-in
                </Link>
              </div>
            </EditorialCard>
          ))}
        </div>
      </section>
    </div>
  );
}
