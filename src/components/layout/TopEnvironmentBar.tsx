import Link from 'next/link';

export function TopEnvironmentBar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-goldDark to-brand-goldLight font-serif text-lg font-bold text-white shadow-sm">
            CD
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-goldDark">
              Capim Dourado Shopping • Palmas/TO
            </span>
            <span className="font-serif text-lg font-bold text-brand-ink">
              Passaporte Digital
            </span>
          </div>
        </Link>

        <nav
          aria-label="Navegação Principal"
          className="flex flex-wrap items-center gap-2 text-xs font-medium"
        >
          <Link
            href="/"
            className="rounded-full border border-brand-border bg-brand-ivory px-3.5 py-1.5 text-brand-ink transition hover:border-brand-goldLight hover:text-brand-goldDark"
          >
            Lojas & Experiências
          </Link>
          <Link
            href="/passaporte"
            className="rounded-full border border-brand-goldLight/50 bg-brand-goldDark/10 px-3.5 py-1.5 font-semibold text-brand-goldDark transition hover:bg-brand-goldDark hover:text-white"
          >
            Meu Passaporte
          </Link>
          <Link
            href="/checkin"
            className="rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-3.5 py-1.5 font-semibold text-brand-emerald transition hover:bg-brand-emerald hover:text-white"
          >
            Check-in QR
          </Link>
          <Link
            href="/recompensas"
            className="rounded-full border border-brand-border bg-brand-ivory px-3.5 py-1.5 text-brand-ink transition hover:border-brand-goldLight hover:text-brand-goldDark"
          >
            Recompensas
          </Link>
          <Link
            href="/lojista"
            className="rounded-full border border-brand-border bg-white px-3.5 py-1.5 text-brand-ink transition hover:border-brand-goldDark"
          >
            Área do Lojista
          </Link>
          <Link
            href="/admin"
            className="rounded-full border border-brand-border bg-white px-3.5 py-1.5 text-brand-ink transition hover:border-brand-goldDark"
          >
            Administração
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-brand-goldDark to-brand-goldLight px-4 py-1.5 font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Entrar / Conta
          </Link>
        </nav>
      </div>
    </header>
  );
}
