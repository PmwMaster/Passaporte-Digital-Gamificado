import type { Metadata } from 'next';
import Link from 'next/link';
import '@/styles/globals.css';
import { TopEnvironmentBar } from '@/components/layout/TopEnvironmentBar';
import { PasseDouradoLogo } from '@/components/shared/PasseDouradoLogo';

export const metadata: Metadata = {
  title: 'Passe Dourado — Passaporte do Shopping',
  description:
    'O programa de fidelidade do shopping. Acumule pontos no seu passaporte, destrave benefícios exclusivos e resgate cupons no caixa.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#FAF6EE] text-[#1F1A11] antialiased flex flex-col selection:bg-[#EFE4C8] selection:text-[#74520B]">
        <TopEnvironmentBar />
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 md:px-6 pt-4 pb-28 lg:pb-16">
          {children}
        </main>
        <footer className="hidden lg:block border-t border-[#E6DFCE] bg-[#F3EDE0] pt-12 pb-8 text-xs text-[#5A5243]">
          <div className="mx-auto max-w-[1360px] px-6">
            <div className="grid grid-cols-4 gap-8 pb-10 border-b border-[#E2D9C5]">
              {/* Coluna 1: Marca Passe Dourado + Logo 1 · Feixe */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <PasseDouradoLogo variant="badge" size={34} />
                  <span className="font-serif text-lg font-bold text-[#74520B]">
                    Passe Dourado
                  </span>
                </div>
                <p className="leading-relaxed text-xs text-[#5A5243]">
                  O programa de fidelidade do shopping mais querido do Tocantins.
                  Acumule pontos no seu passaporte, destrave benefícios
                  exclusivos e viva a sofisticação do cerrado.
                </p>
              </div>

              {/* Coluna 2: Horário de Funcionamento */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#1F1A11]">
                  Horário de Funcionamento
                </h4>
                <p className="text-xs">
                  <strong className="block text-[#1F1A11]">
                    Segunda a sábado
                  </strong>
                  Lojas e alimentação: 10h às 22h
                </p>
                <p className="text-xs pt-1">
                  <strong className="block text-[#1F1A11]">
                    Domingos e feriados
                  </strong>
                  Alimentação e lazer: 11h às 22h
                  <br />
                  Lojas satélites: 14h às 20h
                </p>
              </div>

              {/* Coluna 3: Localização e Contato */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#1F1A11]">
                  Localização e Contato
                </h4>
                <p className="text-xs leading-relaxed">
                  Quadra 107 Norte, Av. JK, s/n
                  <br />
                  Plano Diretor Norte · Palmas – TO
                  <br />
                  CEP 77001-070
                </p>
                <p className="text-xs pt-1">
                  SAC: (63) 3000-0001
                  <br />
                  concierge@exemplo.com.br
                </p>
              </div>

              {/* Coluna 4: Para Lojistas e Equipe */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-[#1F1A11]">
                  Para Lojistas e Equipe
                </h4>
                <ul className="space-y-1.5 text-xs font-medium">
                  <li>
                    <Link
                      href="/lojista"
                      className="hover:text-[#74520B] hover:underline"
                    >
                      Portal do lojista
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/admin"
                      className="hover:text-[#74520B] hover:underline"
                    >
                      Acesso administrativo
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/passaporte"
                      className="hover:text-[#74520B] hover:underline"
                    >
                      Regulamento do passaporte
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-[11px] text-[#7A705E]">
              <span>
                ✓ © 2026 Passe Dourado. Todos os direitos reservados.
              </span>
              <div className="flex gap-5">
                <span>Privacidade e LGPD</span>
                <span>Termos de uso</span>
                <span>Preferências de cookies</span>
                <span>Canal de ética</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
