import Link from 'next/link';

export function TopEnvironmentBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-goldDark to-brand-goldLight font-serif text-lg font-bold text-white shadow-sm">
            CD
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-goldDark">
              Capim Dourado Shopping • Palmas/TO
            </span>
            <span className="font-serif text-lg font-bold text-brand-ink">
              Passaporte Digital Gamificado
            </span>
          </div>
        </Link>

        <nav
          aria-label="Navegação entre ambientes da arquitetura"
          className="flex flex-wrap items-center gap-1.5 text-xs font-medium"
        >
          <Link
            href="/"
            className="rounded-full border border-brand-border bg-brand-ivory px-3 py-1.5 text-brand-ink transition hover:border-brand-goldLight hover:text-brand-goldDark"
          >
            1. Vitrine Pública (Dev 01)
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-brand-border bg-brand-ivory px-3 py-1.5 text-brand-ink transition hover:border-brand-goldLight hover:text-brand-goldDark"
          >
            2. Auth & LGPD (Dev 01)
          </Link>
          <Link
            href="/passaporte"
            className="rounded-full border border-brand-goldLight/50 bg-brand-goldDark/10 px-3 py-1.5 font-semibold text-brand-goldDark transition hover:bg-brand-goldDark hover:text-white"
          >
            3. Passaporte Visitante (Dev 01/02)
          </Link>
          <Link
            href="/checkin"
            className="rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-3 py-1.5 font-semibold text-brand-emerald transition hover:bg-brand-emerald hover:text-white"
          >
            4. Check-in QR + GPS (Dev 02)
          </Link>
          <Link
            href="/recompensas"
            className="rounded-full border border-brand-border bg-brand-ivory px-3 py-1.5 text-brand-ink transition hover:border-brand-goldLight hover:text-brand-goldDark"
          >
            7. Recompensas & Vouchers (Dev 03)
          </Link>
          <Link
            href="/lojista"
            className="rounded-full border border-brand-border bg-white px-3 py-1.5 text-brand-ink transition hover:border-brand-goldDark"
          >
            8. Portal Lojista (Dev 03)
          </Link>
          <Link
            href="/admin"
            className="rounded-full bg-brand-ink px-3 py-1.5 text-white transition hover:bg-brand-goldDark"
          >
            9. Painel Admin (Dev 03)
          </Link>
        </nav>
      </div>
    </header>
  );
}
