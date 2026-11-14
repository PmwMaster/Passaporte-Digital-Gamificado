import React from 'react';

export function ModuleHeader({
  featureNumber,
  title,
  subtitle,
  developerOwner,
  moduleName,
}: {
  featureNumber: string;
  title: string;
  subtitle: string;
  developerOwner: 'DESENVOLVEDOR 01' | 'DESENVOLVEDOR 02' | 'DESENVOLVEDOR 03';
  moduleName: string;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-brand-border bg-white p-6 shadow-editorial">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gradient-to-r from-brand-goldDark to-brand-goldLight px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            {featureNumber}
          </span>
          <span className="rounded-full border border-brand-emerald/30 bg-brand-emerald/10 px-3 py-1 text-[11px] font-semibold text-brand-emerald">
            {developerOwner}
          </span>
        </div>
        <code className="rounded-lg bg-brand-ivory px-2.5 py-1 text-xs text-brand-muted">
          src/modules/{moduleName}
        </code>
      </div>
      <h1 className="mt-3 font-serif text-2xl font-bold text-brand-ink md:text-3xl">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-brand-muted">{subtitle}</p>
    </div>
  );
}

export function EditorialCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-brand-border bg-white p-6 shadow-editorial ${className}`}
    >
      {children}
    </div>
  );
}
