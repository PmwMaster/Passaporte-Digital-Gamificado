import React from 'react';

export function ModuleHeader({
  title,
  subtitle,
  categoryBadge = 'Capim Dourado Shopping • Palmas/TO',
}: {
  title: string;
  subtitle: string;
  categoryBadge?: string;
  featureNumber?: string;
  developerOwner?: string;
  moduleName?: string;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-brand-border bg-white p-6 shadow-editorial">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand-goldDark/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-goldDark">
          {categoryBadge}
        </span>
      </div>
      <h1 className="mt-2.5 font-serif text-2xl font-bold text-brand-ink md:text-3xl">
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
