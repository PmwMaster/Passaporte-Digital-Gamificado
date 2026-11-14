import type { Metadata } from 'next';
import '@/styles/globals.css';
import { TopEnvironmentBar } from '@/components/layout/TopEnvironmentBar';

export const metadata: Metadata = {
  title: 'Passaporte Digital — Capim Dourado Shopping (Palmas - TO)',
  description:
    'Plataforma web gamificada de fidelização, check-ins presenciais por QR Code + GPS e recompensas do Capim Dourado Shopping.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-brand-ivory text-brand-ink antialiased">
        <TopEnvironmentBar />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-brand-border bg-white py-8 text-center text-xs text-brand-muted">
          <div className="mx-auto max-w-7xl px-4">
            <p className="font-serif text-sm font-semibold text-brand-ink">
              Passaporte Digital Gamificado • Capim Dourado Shopping (Palmas - TO)
            </p>
            <p className="mt-1">
              Arquitetura Monolítica Modular • 9 Funcionalidades / 3 Desenvolvedores • Estética Warm Editorial Mall
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
