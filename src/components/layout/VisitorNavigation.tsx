import Link from 'next/link';

const VISITOR_LINKS = [
  { href: '/passaporte', label: 'Meu Passaporte', devTag: 'F03 • Dev 01' },
  { href: '/checkin', label: 'Check-in QR + GPS', devTag: 'F04 • Dev 02' },
  { href: '/missoes', label: 'Carimbos & Missões', devTag: 'F05 • Dev 02' },
  { href: '/extrato', label: 'Extrato de Pontos', devTag: 'F06 • Dev 02' },
  { href: '/recompensas', label: 'Catálogo Recompensas', devTag: 'F07 • Dev 03' },
  { href: '/vouchers', label: 'Meus Vouchers', devTag: 'F07 • Dev 03' },
];

export function VisitorNavigation({ currentPath }: { currentPath?: string }) {
  return (
    <div className="mb-6 overflow-x-auto rounded-2xl border border-brand-border bg-white p-2 shadow-editorial">
      <div className="flex min-w-max items-center gap-2">
        {VISITOR_LINKS.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                isActive
                  ? 'bg-gradient-to-r from-brand-goldDark to-brand-goldLight text-white shadow-sm'
                  : 'text-brand-ink hover:bg-brand-ivory'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-brand-ivory text-brand-muted'
                }`}
              >
                {item.devTag}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
