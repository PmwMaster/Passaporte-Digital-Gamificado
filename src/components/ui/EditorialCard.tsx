import React from 'react';

export function ModuleHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  categoryBadge?: string;
  featureNumber?: string;
  developerOwner?: string;
  moduleName?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-2xl font-bold text-brand-ink md:text-3xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-sm text-brand-muted">{subtitle}</p>
      )}
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
