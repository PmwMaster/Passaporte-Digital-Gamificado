import type { Metadata } from 'next';
import '@/styles/globals.css';
import { TopEnvironmentBar } from '@/components/layout/TopEnvironmentBar';

export const metadata: Metadata = {
  title: 'Passaporte Digital — Capim Dourado Shopping (Palmas - TO)',
  description:
    'Programa oficial de fidelização, carimbos digitais e recompensas exclusivas do Capim Dourado Shopping em Palmas - TO.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed pb-20 lg:pb-0">
        <TopEnvironmentBar />
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
        <footer className="mt-12 border-t border-surface-container-high bg-surface-container-lowest py-8 text-center text-xs text-on-surface-variant">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">local_florist</span>
              <span className="font-headline-md text-sm font-semibold text-on-surface">
                Passaporte Capim Dourado Shopping • Palmas, Tocantins
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-secondary">lock</span>
                SSL 256-bit
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                Conformidade LGPD
              </span>
              <span>•</span>
              <span>© 2026 Capim Dourado Shopping</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
