'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RewardsCatalogService } from '@/modules/rewards';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function VisitorVouchersPage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sseNotice, setSseNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadVouchers() {
      try {
        const res = await fetch('/api/visitor/vouchers');
        const json = await res.json();
        if (json.success && json.data?.vouchers) {
          setVouchers(json.data.vouchers);
        }
      } finally {
        setLoading(false);
      }
    }
    loadVouchers();
  }, []);

  useEffect(() => {
    const active = vouchers.find((v) => v.status === 'ACTIVE');
    if (!active) return;

    const es = new EventSource(`/api/realtime/vouchers?code=${active.code}`);
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload.type === 'VOUCHER_USED') {
          setSseNotice(
            `Voucher ${payload.code} validado na loja ${payload.storeName}!`
          );
          setVouchers((prev) =>
            prev.map((item) =>
              item.code === payload.code
                ? { ...item, status: 'USED', usedAt: payload.usedAt }
                : item
            )
          );
        }
      } catch {
        // Ignora keep-alive
      }
    };

    return () => {
      es.close();
    };
  }, [vouchers]);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-brand-ink">
        Meus Vouchers
      </h1>

      {sseNotice && (
        <div className="rounded-2xl border border-brand-emerald bg-brand-emerald/15 p-4 text-xs font-bold text-brand-emerald">
          {sseNotice}
        </div>
      )}

      {loading ? (
        <EditorialCard className="text-center py-8">
          <p className="text-xs text-brand-muted">Carregando seus vouchers...</p>
        </EditorialCard>
      ) : vouchers.length === 0 ? (
        <EditorialCard className="text-center">
          <p className="text-sm text-brand-muted">
            Você ainda não possui vouchers resgatados.
          </p>
          <Link
            href="/recompensas"
            className="mt-3 inline-block rounded-xl bg-brand-goldDark px-4 py-2 text-xs font-semibold text-white"
          >
            Ver Catálogo de Recompensas
          </Link>
        </EditorialCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {vouchers.map((voucher) => (
            <EditorialCard key={voucher.id}>
              <div className="flex items-center justify-between">
                <code className="rounded-lg bg-brand-ivory px-3 py-1 text-sm font-bold text-brand-goldDark">
                  {voucher.code}
                </code>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    voucher.status === 'ACTIVE'
                      ? 'bg-brand-emerald/15 text-brand-emerald'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {voucher.status === 'ACTIVE' ? 'ATIVO' : 'UTILIZADO ✓'}
                </span>
              </div>

              <h3 className="mt-3 font-serif text-lg font-bold text-brand-ink">
                {voucher.rewardTitle}
              </h3>
              <p className="text-xs text-brand-muted">
                {voucher.storeName} ({voucher.storeFloor})
              </p>

              <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-goldLight bg-brand-ivory p-4">
                <div className="grid h-24 w-24 grid-cols-5 gap-1 rounded-xl border-2 border-brand-goldDark bg-white p-2">
                  {Array.from({ length: 25 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={
                        idx % 2 === 0 || idx % 7 === 0
                          ? 'rounded-[2px] bg-brand-ink'
                          : 'bg-transparent'
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 flex justify-between border-t border-brand-border pt-3 text-[11px] text-brand-muted">
                <span>{voucher.pointsSpent} pts</span>
                <span>
                  Válido até {new Date(voucher.expiresAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </EditorialCard>
          ))}
        </div>
      )}
    </div>
  );
}
