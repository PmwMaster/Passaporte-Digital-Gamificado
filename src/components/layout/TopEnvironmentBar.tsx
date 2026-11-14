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

  const visitorNavItems = [
    { label: 'Lojas', href: '/' },
    { label: 'Passaporte', href: '/passaporte' },
    { label: 'Check-in', href: '/checkin' },
    { label: 'Recompensas', href: '/recompensas' },
    { label: 'Vouchers', href: '/vouchers' },
    { label: 'Missões', href: '/missoes' },
    { label: 'Extrato', href: '/extrato' },
  ];

  const navItems =
    user?.role === 'MERCHANT'
      ? [
          { label: 'Painel do Lojista', href: '/lojista' },
          { label: 'Vitrine de Lojas', href: '/' },
        ]
      : user?.role === 'ADMIN'
      ? [
          { label: 'Painel Administrativo', href: '/admin' },
          { label: 'Vitrine de Lojas', href: '/' },
        ]
      : visitorNavItems;

  const pointsDisplay = profile?.currentPoints ?? 0;

  return (
    <>
      <header className="sticky top-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-b border-surface-container-high">
        <div className="h-16 max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Emblem + Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary-container p-0.5 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg font-bold">
                  local_florist
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-base text-primary tracking-tight leading-none">
                Passe Dourado
              </span>
              <span className="font-label-sm text-[10px] tracking-wider uppercase text-on-surface-variant font-semibold mt-0.5">
                Passaporte Digital
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav
            aria-label="Navegação Principal"
            className="hidden lg:flex items-center gap-1"
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

          {/* Right: Points Pill + Profile Menu */}
          <div className="flex items-center gap-2.5 shrink-0 relative">
            {(!user || user.role === 'VISITOR') && (
              <Link
                href="/extrato"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed/60 text-on-primary-container hover:bg-primary-fixed transition"
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
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-container to-primary text-on-primary flex items-center justify-center font-bold text-xs">
                {user ? user.name.slice(0, 2).toUpperCase() : 'CD'}
              </div>
              <span className="hidden sm:inline font-label-md text-xs font-bold text-on-surface">
                {user ? user.name.split(' ')[0] : 'Entrar'}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-2xl bg-surface-container-lowest p-3.5 shadow-xl border border-surface-container-high z-50">
                {user ? (
                  <div className="pb-2.5 mb-2.5 border-b border-surface-container-high">
                    <p className="font-label-md text-xs font-bold text-on-surface truncate">
                      {user.name}
                    </p>
                    <p className="font-body-sm text-[11px] text-on-surface-variant truncate">
                      {user.email}
                    </p>
                  </div>
                ) : (
                  <div className="pb-2.5 mb-2.5 border-b border-surface-container-high grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="py-1.5 rounded-full bg-primary text-on-primary text-center font-label-md text-xs font-bold"
                    >
                      Entrar
                    </Link>
                    <Link
                      href="/cadastro"
                      onClick={() => setMenuOpen(false)}
                      className="py-1.5 rounded-full bg-primary-fixed/50 text-on-primary-fixed text-center font-label-md text-xs font-bold"
                    >
                      Criar Conta
                    </Link>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="block font-label-sm text-[10px] uppercase text-outline px-1">
                    Trocar Perfil
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSwitch('mariana.alves@exemplo.com.br')
                    }
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low text-left text-xs font-medium text-on-surface"
                  >
                    <span className="material-symbols-outlined text-primary text-[16px]">
                      person
                    </span>
                    <span>Visitante (Mariana)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSwitch('gerencia@cafejalapao.com.br')
                    }
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low text-left text-xs font-medium text-on-surface"
                  >
                    <span className="material-symbols-outlined text-secondary text-[16px]">
                      storefront
                    </span>
                    <span>Lojista / Caixa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickSwitch('admin@passedourado.com.br')
                    }
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-container-low text-left text-xs font-medium text-on-surface"
                  >
                    <span className="material-symbols-outlined text-tertiary text-[16px]">
                      admin_panel_settings
                    </span>
                    <span>Administração</span>
                  </button>
                </div>

                {user && (
                  <div className="mt-2.5 pt-2.5 border-t border-surface-container-high">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-error-container/50 text-on-error-container font-label-md text-xs font-bold hover:bg-error-container transition"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        logout
                      </span>
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navegação Mobile"
        className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high"
      >
        <div className="flex justify-around items-center h-16 px-4 relative">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-0.5 ${
              pathname === '/'
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">home</span>
            <span className="font-label-sm text-[10px]">Lojas</span>
          </Link>

          <Link
            href="/recompensas"
            className={`flex flex-col items-center justify-center gap-0.5 ${
              pathname.startsWith('/recompensas') || pathname.startsWith('/vouchers')
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              confirmation_number
            </span>
            <span className="font-label-sm text-[10px]">Cupons</span>
          </Link>

          <Link
            href="/checkin"
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-gradient-to-b from-primary-container to-primary text-on-primary shadow-md"
          >
            <span className="material-symbols-outlined text-[24px]">
              qr_code_scanner
            </span>
          </Link>

          <Link
            href="/passaporte"
            className={`flex flex-col items-center justify-center gap-0.5 ${
              pathname.startsWith('/passaporte')
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              hotel_class
            </span>
            <span className="font-label-sm text-[10px]">Passaporte</span>
          </Link>

          <Link
            href="/login"
            className={`flex flex-col items-center justify-center gap-0.5 ${
              pathname.startsWith('/login') || pathname.startsWith('/cadastro')
                ? 'text-primary font-bold'
                : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">person</span>
            <span className="font-label-sm text-[10px]">Conta</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
