import React from 'react';
import { SHOPPING_CONFIG } from '@/shared/constants';

export function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.15C8.94 7.15 8.66 7.21 8.42 7.47C8.18 7.74 7.5 8.38 7.5 9.68C7.5 10.98 8.45 12.23 8.58 12.41C8.72 12.59 10.45 15.26 13.1 16.4C15.31 17.36 15.76 17.17 16.23 17.13C16.7 17.09 17.75 16.51 17.97 15.89C18.19 15.27 18.19 14.74 18.12 14.63C18.06 14.52 17.88 14.45 17.62 14.32C17.36 14.19 16.07 13.56 15.83 13.47C15.59 13.38 15.42 13.34 15.25 13.6C15.08 13.86 14.59 14.45 14.44 14.63C14.29 14.81 14.15 14.83 13.89 14.7C13.63 14.57 12.79 14.29 11.8 13.41C11.02 12.72 10.5 11.87 10.35 11.61C10.2 11.35 10.33 11.21 10.46 11.08C10.58 10.96 10.72 10.78 10.86 10.62C11 10.46 11.05 10.34 11.14 10.17C11.23 10 11.18 9.85 11.12 9.72C11.06 9.59 10.55 8.34 10.33 7.82C10.12 7.32 9.9 7.39 9.74 7.38C9.59 7.37 9.42 7.37 9.25 7.37L9.11 7.15Z" />
    </svg>
  );
}

interface WhatsAppVerificationCardProps {
  userName: string;
  memberCode: string;
  userPhone?: string;
  isVerified?: boolean;
}

export function WhatsAppVerificationCard({
  userName,
  memberCode,
  userPhone,
  isVerified = false,
}: WhatsAppVerificationCardProps) {
  const officialPhone = SHOPPING_CONFIG.officialWhatsApp;
  const officialDisplay = SHOPPING_CONFIG.officialWhatsAppDisplay;

  const defaultMessage = `Olá! Sou ${userName} (Membro Passaporte: ${memberCode}${
    userPhone ? ` | Tel: ${userPhone}` : ''
  }). Estou confirmando meu número de WhatsApp para validar meu Passaporte Digital Passe Dourado.`;

  const waUrl = `https://wa.me/${officialPhone}?text=${encodeURIComponent(
    defaultMessage
  )}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 p-5 text-white shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-lg">
            <WhatsAppIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-base font-bold text-white">
                Validação Direta via WhatsApp Oficial
              </span>
              <span className="rounded-full bg-[#25D366]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                Zero Burocracia
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-100/90 leading-relaxed max-w-xl">
              Fale direto com o balcão do shopping no <strong>{officialDisplay}</strong>. 
              Ao enviar a mensagem pronta do seu próprio WhatsApp, seu telefone é validado 
              comprovando que você é um cliente real, protegendo seus pontos contra clonagem de contas.
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 px-5 py-3 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>Abrir WhatsApp ({officialDisplay})</span>
          </a>
        </div>
      </div>
    </div>
  );
}
