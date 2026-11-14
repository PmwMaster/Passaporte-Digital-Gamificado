'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PasseDouradoLogo } from '@/components/shared/PasseDouradoLogo';

export function TopEnvironmentBar() {
  const pathname = usePathname() || '/';
  const [points, setPoints] = useState<number>(150);
  const [userName, setUserName] = useState<string>('Mariana Silva');

  async function refreshPoints() {
    try {
      const res = await fetch('/api/visitor/points');
      const json = await res.json();
      if (json.success && typeof json.data?.currentPoints === 'number') {
        setPoints(json.data.currentPoints);
      }
    } catch {
      // fallback silencioso
    }
  }

  useEffect(() => {
    refreshPoints();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.user?.name) {
          setUserName(j.data.user.name.split(' ').slice(0, 2).join(' '));
        }
      })
      .catch(() => {});

    const handlePointsUpdated = () => refreshPoints();
    window.addEventListener('passport:points-updated', handlePointsUpdated);
    return () => {
      window.removeEventListener('passport:points-updated', handlePointsUpdated);
    };
  }, [pathname]);

  const isMerchant = pathname.startsWith('/lojista');
  const isAdmin = pathname.startsWith('/admin');

  const getSectionSubtitle = () => {
    if (isAdmin) return 'ADMINISTRAÇÃO';
    if (isMerchant) return 'PORTAL DO LOJISTA';
    return 'PASSAPORTE DO SHOPPING';
  };

  return (
    <>
      {/* TOP STICKY HEADER (PASSE DOURADO — LOGO 1 · FEIXE) */}
      <header className="sticky top-0 z-50 w-full bg-[#FAF6EE]/95 backdrop-blur-xl border-b border-[#E6DFCE]">
        <div className="mx-auto flex h-16 md:h-20 max-w-[1360px] items-center justify-between gap-3 px-4 md:px-6">
          {/* Brand Emblem: 1 · Feixe + Passe Dourado */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <PasseDouradoLogo
              variant="circle"
              size={42}
              className="shrink-0 transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="font-serif text-lg md:text-xl font-bold text-[#1F1A11] leading-none tracking-tight">
                Passe Dourado
              </span>
              <span className="mt-0.5 text-[9px] md:text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#74520B]">
                {getSectionSubtitle()}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Bar */}
          <nav
            aria-label="Navegação Principal"
            className="hidden lg:flex items-center gap-1.5"
          >
            <Link
              href="/"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                pathname === '/'
                  ? 'bg-[#EFE4C8] text-[#74520B]'
                  : 'text-[#3A3224] hover:bg-[#F3ECE0]'
              }`}
            >
              Início
            </Link>
            <Link
              href="/lojas/cafe-jalapao-gourmet"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/lojas')
                  ? 'bg-[#EFE4C8] text-[#74520B]'
                  : 'text-[#3A3224] hover:bg-[#F3ECE0]'
              }`}
            >
              Lojas
            </Link>
            <Link
              href="/recompensas"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/recompensas') ||
                pathname.startsWith('/vouchers')
                  ? 'bg-[#EFE4C8] text-[#74520B]'
                  : 'text-[#3A3224] hover:bg-[#F3ECE0]'
              }`}
            >
              Cupons e pontos
            </Link>
            <Link
              href="/missoes"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/missoes')
                  ? 'bg-[#EFE4C8] text-[#74520B]'
                  : 'text-[#3A3224] hover:bg-[#F3ECE0]'
              }`}
            >
              Missões
            </Link>
            <Link
              href="/passaporte"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                pathname.startsWith('/passaporte') ||
                pathname.startsWith('/extrato')
                  ? 'bg-[#EFE4C8] text-[#74520B]'
                  : 'text-[#3A3224] hover:bg-[#F3ECE0]'
              }`}
            >
              Passaporte
            </Link>
            <span className="h-4 w-px bg-[#DFD5C0] mx-1.5" />
            <Link
              href="/lojista"
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                isMerchant
                  ? 'bg-[#74520B] text-white'
                  : 'text-[#6A5D47] hover:bg-[#F3ECE0]'
              }`}
            >
              Lojista
            </Link>
            <Link
              href="/admin"
              className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                isAdmin
                  ? 'bg-[#1F1A11] text-white'
                  : 'text-[#6A5D47] hover:bg-[#F3ECE0]'
              }`}
            >
              Admin
            </Link>
          </nav>

          {/* Right Actions: Search + Points Chip + Avatar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Mobile Switcher for Lojista/Admin */}
            <div className="flex lg:hidden items-center gap-1">
              <Link
                href="/lojista"
                title="Portal do Lojista"
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  isMerchant
                    ? 'bg-[#74520B] text-white border-[#74520B]'
                    : 'bg-white text-[#5C503C] border-[#E5DEC9]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  storefront
                </span>
              </Link>
              <Link
                href="/admin"
                title="Painel Admin"
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  isAdmin
                    ? 'bg-[#1F1A11] text-white border-[#1F1A11]'
                    : 'bg-white text-[#5C503C] border-[#E5DEC9]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  bar_chart
                </span>
              </Link>
            </div>

            {/* Golden Points Chip */}
            <Link
              href="/passaporte?tab=statement"
              className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#EFE4C8] hover:bg-[#E7D7B1] text-[#6B4A06] flex items-center gap-1.5 transition-all border border-[#DFCEAA]"
            >
              <span className="material-symbols-outlined text-[#74520B] text-[16px]">
                star
              </span>
              <span className="text-xs md:text-sm font-extrabold text-[#573C04]">
                {points} pts
              </span>
            </Link>

            {/* Profile / Login Avatar */}
            <Link
              href="/login"
              title={`Perfil / Acesso (${userName})`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#74520B] text-white font-sans text-xs font-extrabold shadow-sm hover:opacity-95 transition-opacity"
            >
              {userName
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Link>
          </div>
        </div>
      </header>

      {/* FIXED BOTTOM NAVIGATION BAR (MOBILE PASSE DOURADO) */}
      <nav
        aria-label="Menu Inferior Mobile"
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe bg-[#FAF6EE]/95 backdrop-blur-xl border-t border-[#E6DFCE]"
      >
        <div className="mx-auto flex h-[74px] max-w-lg items-center justify-around px-2">
          <Link
            href="/"
            className={`flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors ${
              pathname === '/' || pathname.startsWith('/lojas')
                ? 'text-[#74520B] font-extrabold'
                : 'text-[#5A5243]'
            }`}
          >
            <div
              className={`flex h-9 w-13 items-center justify-center rounded-2xl transition-colors ${
                pathname === '/' || pathname.startsWith('/lojas')
                  ? 'bg-[#EFE4C8]'
                  : ''
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">home</span>
            </div>
            <span className="text-[11px]">Início</span>
          </Link>

          <Link
            href="/recompensas"
            className={`flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors ${
              pathname.startsWith('/recompensas') ||
              pathname.startsWith('/vouchers')
                ? 'text-[#74520B] font-extrabold'
                : 'text-[#5A5243]'
            }`}
          >
            <div
              className={`flex h-9 w-13 items-center justify-center rounded-2xl transition-colors ${
                pathname.startsWith('/recompensas') ||
                pathname.startsWith('/vouchers')
                  ? 'bg-[#EFE4C8]'
                  : ''
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                confirmation_number
              </span>
            </div>
            <span className="text-[11px]">Cupons</span>
          </Link>

          {/* Central Dark Gold QR Scanner Pill (Conforme 1-inicio.png e 6-meu-passaporte.png) */}
          <Link
            href="/checkin"
            className="flex flex-col items-center justify-center min-w-[68px] gap-0.5"
          >
            <div className="flex h-11 w-14 items-center justify-center rounded-2xl bg-[#74520B] text-white shadow-md active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-[22px]">
                qr_code_scanner
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-[#1F1A11]">
              Escanear
            </span>
          </Link>

          <Link
            href="/passaporte"
            className={`flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors ${
              pathname.startsWith('/passaporte') ||
              pathname.startsWith('/missoes') ||
              pathname.startsWith('/extrato')
                ? 'text-[#74520B] font-extrabold'
                : 'text-[#5A5243]'
            }`}
          >
            <div
              className={`flex h-9 w-13 items-center justify-center rounded-2xl transition-colors ${
                pathname.startsWith('/passaporte') ||
                pathname.startsWith('/missoes') ||
                pathname.startsWith('/extrato')
                  ? 'bg-[#EFE4C8]'
                  : ''
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">star</span>
            </div>
            <span className="text-[11px]">Passaporte</span>
          </Link>

          <Link
            href="/login"
            className={`flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors ${
              pathname.startsWith('/login') ||
              pathname.startsWith('/cadastro')
                ? 'text-[#74520B] font-extrabold'
                : 'text-[#5A5243]'
            }`}
          >
            <div
              className={`flex h-9 w-13 items-center justify-center rounded-2xl transition-colors ${
                pathname.startsWith('/login') ||
                pathname.startsWith('/cadastro')
                  ? 'bg-[#EFE4C8]'
                  : ''
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                person
              </span>
            </div>
            <span className="text-[11px]">Perfil</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
