'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface ActiveUserSummary {
  id: string;
  name: string;
  email: string;
  role: 'VISITOR' | 'MERCHANT' | 'OPERATOR' | 'ADMIN';
}

interface ActiveProfileSummary {
  currentPoints: number;
  level: string;
}

export function TopEnvironmentBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ActiveUserSummary | null>(null);
  const [profile, setProfile] = useState<ActiveProfileSummary | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  async function refreshSession() {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && json.data?.authenticated && json.data?.user) {
        setUser(json.data.user);
        setProfile(json.data.profile ?? null);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      // Ignora erro de rede silenciosamente
    }
  }

  useEffect(() => {
    refreshSession();
  }, [pathname]);

  async function handleQuickSwitch(identifier: string) {
    setMenuOpen(false);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: 'Password@2026' }),
    });
    const json = await res.json();
    if (json.success && json.data?.redirectUrl) {
      await refreshSession();
      router.push(json.data.redirectUrl);
      router.refresh();
    }
  }

  async function handleLogout() {
    setMenuOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setProfile(null);
    router.push('/login');
    router.refresh();
  }

  const navItems = [
    { label: 'Início', href: '/' },
    { label: 'Passaporte', href: '/passaporte' },
    { label: 'Cupons & Pontos', href: '/recompensas' },
    { label: 'Meus Vouchers', href: '/vouchers' },
    { label: 'Missões', href: '/missoes' },
    { label: 'Lojista', href: '/lojista' },
    { label: 'Admin', href: '/admin' },
  ];

  const pointsDisplay = profile?.currentPoints ?? 640;

  return (
    <>
      <header className="sticky top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_12px_rgba(122,88,15,0.06)]">
        <div className="h-20 max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Emblem + Brand + Location Pill */}
          <div className="flex items-center gap-5 shrink-0">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-primary-container p-0.5 shadow-[0_2px_10px_rgba(197,155,78,0.3)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl font-bold">
                    local_florist
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-md text-headline-sm text-primary tracking-tight leading-none">
                  Capim Dourado
                </span>
                <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant font-semibold mt-0.5">
                  Shopping · Passaporte
                </span>
              </div>
            </Link>

            <Link
              href="/checkin"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-sm">
                pin_drop
              </span>
              <span className="font-label-md text-label-md font-medium">
                Piso L1 · Principal
              </span>
            </Link>
          </div>

          {/* Center Navigation */}
          <nav
            aria-label="Navegação Principal"
            className="hidden lg:flex items-center gap-1 xl:gap-1.5 px-2"
          >
            {navItems.map((item) => {
              const isActive =
                item.href === '/'
                  ? pathname === '/' || pathname.startsWith('/lojas')
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3.5 py-1.5 font-label-lg text-label-lg transition-all rounded-full ${
                    isActive
                      ? 'text-primary font-bold bg-primary-fixed/40'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search + Points Pill + Profile Menu */}
          <div className="flex items-center gap-3 shrink-0 relative">
            <Link
              href="/"
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-all w-48"
            >
              <span className="material-symbols-outlined text-outline text-lg">
                search
              </span>
              <span className="font-body-sm text-body-sm text-outline flex-1 truncate">
                Buscar lojas, ofertas...
              </span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container-highest text-on-surface-variant font-label-sm">
                ⌘K
              </kbd>
            </Link>

            <Link
              href="/passaporte"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary-fixed/60 to-tertiary-fixed/60 text-on-primary-container shadow-[0_2px_8px_rgba(197,155,78,0.15)] hover:opacity-95 transition"
            >
              <span className="material-symbols-outlined text-primary text-base font-bold">
                stars
              </span>
              <span className="font-label-lg text-label-lg font-bold">
                {pointsDisplay}
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold uppercase">
                pts
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-container to-primary text-on-primary flex items-center justify-center font-bold text-xs shadow-sm">
                {user ? user.name.slice(0, 2).toUpperCase() : 'CD'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-label-md text-[12px] font-bold text-on-surface leading-none">
                  {user ? user.name.split(' ')[0] : 'Entrar'}
                </span>
                <span className="font-label-sm text-[10px] text-primary uppercase leading-none mt-0.5">
                  {user
                    ? user.role === 'VISITOR'
                      ? 'Membro Ouro'
                      : user.role === 'MERCHANT'
                      ? 'Lojista'
                      : 'Admin'
                    : 'Visitante'}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                expand_more
              </span>
            </button>

            {/* Dropdown Contextual de Conta e Troca Rápida de Perfil */}
            {menuOpen && (
              <div className="absolute right-0 top-14 w-72 rounded-2xl bg-surface-container-lowest p-4 shadow-2xl border border-surface-container-high z-50">
                {user ? (
                  <div className="pb-3 mb-3 border-b border-surface-container-high">
                    <span className="font-label-sm text-label-sm uppercase text-primary font-bold">
                      Sessão Ativa ({user.role})
                    </span>
                    <p className="font-title-md text-title-md text-on-surface font-bold truncate">
                      {user.name}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {user.email}
                    </p>
                  </div>
                ) : (
                  <div className="pb-3 mb-3 border-b border-surface-container-high">
                    <span className="font-label-sm text-label-sm uppercase text-primary font-bold">
                      Passaporte Capim Dourado
                    </span>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                      Entre ou crie sua conta para ganhar +50 pontos de chegada.
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2">
                      <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className="py-2 rounded-full bg-primary text-on-primary text-center font-label-md text-label-md font-bold"
                      >
                        Entrar
                      </Link>
                      <Link
                        href="/cadastro"
                        onClick={() => setMenuOpen(false)}
                        className="py-2 rounded-full bg-primary-fixed/50 text-on-primary-fixed text-center font-label-md text-label-md font-bold"
                      >
                        Criar Conta
                      </Link>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <span className="block font-label-sm text-label-sm uppercase text-outline px-1">
                    Alternar Visão (Acesso Rápido)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSwitch('mariana.alves@exemplo.com.br')
                    }
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container-low text-left transition"
                  >
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      workspace_premium
                    </span>
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">
                        Visão Visitante (Mariana)
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant">
                        Passaporte Ouro • 640 pts
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSwitch('gerencia@cafejalapao.com.br')
                    }
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container-low text-left transition"
                  >
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      point_of_sale
                    </span>
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">
                        Visão Lojista / Caixa
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant">
                        Validação de Vouchers & Estoque
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSwitch('admin@capimdouradoshopping.com.br')
                    }
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-surface-container-low text-left transition"
                  >
                    <span className="material-symbols-outlined text-tertiary text-[18px]">
                      admin_panel_settings
                    </span>
                    <div>
                      <p className="font-label-md text-label-md font-bold text-on-surface">
                        Visão Administração Shopping
                      </p>
                      <p className="font-body-sm text-[11px] text-on-surface-variant">
                        KPIs, Lojas, Moderação & Geofence
                      </p>
                    </div>
                  </button>
                </div>

                {user && (
                  <div className="mt-3 pt-3 border-t border-surface-container-high">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-error-container/50 text-on-error-container font-label-md text-label-md font-bold hover:bg-error-container transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        logout
                      </span>
                      <span>Encerrar Sessão</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Fiel à Referência Mobile) */}
      <nav
        aria-label="Navegação Mobile"
        className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-xl shadow-[0_-4px_20px_rgba(163,124,44,0.08)]"
      >
        <div className="flex justify-around items-center h-20 px-4 relative">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 transition-colors ${
              pathname === '/'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">home</span>
            <span className="font-label-sm text-label-sm">Início</span>
          </Link>

          <Link
            href="/recompensas"
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 transition-colors ${
              pathname.startsWith('/recompensas') || pathname.startsWith('/vouchers')
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              confirmation_number
            </span>
            <span className="font-label-sm text-label-sm">Cupons</span>
          </Link>

          <div className="relative -top-5 flex flex-col items-center">
            <Link
              href="/checkin"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-b from-primary-container to-primary text-on-primary shadow-[0_10px_22px_rgba(197,155,78,0.35)] active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[28px]">
                qr_code_scanner
              </span>
            </Link>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 font-medium">
              Escanear
            </span>
          </div>

          <Link
            href="/passaporte"
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 transition-colors ${
              pathname.startsWith('/passaporte')
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">
              hotel_class
            </span>
            <span className="font-label-sm text-label-sm">Passaporte</span>
          </Link>

          <Link
            href="/login"
            className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] gap-1 transition-colors ${
              pathname.startsWith('/login') || pathname.startsWith('/cadastro')
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">person</span>
            <span className="font-label-sm text-label-sm">Perfil</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
