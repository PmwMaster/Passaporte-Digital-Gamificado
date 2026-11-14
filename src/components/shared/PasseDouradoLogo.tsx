import React from 'react';

interface PasseDouradoLogoProps {
  variant?: 'circle' | 'badge' | 'white-circle';
  size?: number;
  className?: string;
}

/**
 * Logo Oficial 1 · Feixe — Passe Dourado (Passaporte do Shopping)
 * Baseado fielmente no arquivo 1-feixe.png selecionado pela equipe.
 */
export function PasseDouradoLogo({
  variant = 'circle',
  size = 40,
  className = '',
}: PasseDouradoLogoProps) {
  if (variant === 'badge') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 96 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Logo Passe Dourado — Feixe"
      >
        <rect width="96" height="96" rx="22" fill="#C39953" />
        <g
          stroke="#FFFFFF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M48 70 L48 22" />
          <path d="M48 70 C45 52 37 37 28 29" />
          <path d="M48 70 C51 52 59 37 68 29" />
          <path d="M48 70 C41 59 32 53 20 52" />
          <path d="M48 70 C55 59 64 53 76 52" />
        </g>
        <path d="M42 62 L48 74 L54 62 Z" fill="#FFFFFF" />
        <rect x="38" y="59" width="20" height="6" rx="3" fill="#FAF6EE" />
      </svg>
    );
  }

  const isWhite = variant === 'white-circle';
  const strokeColor = isWhite ? '#FFFFFF' : '#C39953';
  const bandFill = isWhite ? '#FFFFFF' : '#F6F3EC';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Passe Dourado — Feixe"
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke={strokeColor}
        strokeWidth="2.2"
        fill={isWhite ? 'rgba(255,255,255,0.08)' : '#FAF6EE'}
      />
      <g
        stroke={strokeColor}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Haste central vertical */}
        <path d="M50 72 L50 24" />
        {/* Hastes diagonais internas */}
        <path d="M50 72 C46 53 38 39 29 31" />
        <path d="M50 72 C54 53 62 39 71 31" />
        {/* Hastes curvas externas */}
        <path d="M50 72 C42 61 33 55 22 54" />
        <path d="M50 72 C58 61 67 55 78 54" />
      </g>
      {/* Ponta inferior do feixe */}
      <path d="M43 64 L50 76 L57 64 Z" fill={strokeColor} />
      {/* Faixa horizontal central */}
      <rect x="39" y="61" width="22" height="6.5" rx="3.25" fill={bandFill} />
    </svg>
  );
}
