'use client';

import React, { useEffect, useState } from 'react';
import { RewardsCatalogService } from '@/modules/rewards';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function VisitorVouchersPage() {
  const [vouchers, setVouchers] = useState(() =>
    RewardsCatalogService.listVisitorVouchers()
  );
  const [sseNotice, setSseNotice] = useState<string | null>(null);

  useEffect(() => {
    const active = vouchers.find((v) => v.status === 'ACTIVE');
    if (!active) return;

    const es = new EventSource(`/api/realtime/vouchers?code=${active.code}`);
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload.type === 'VOUCHER_USED') {
          setSseNotice(
            `Atualização em Tempo Real (SSE): O voucher ${payload.code} acabou de ser validado no balcão da loja ${payload.storeName}!`
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
        // Ignora mensagens de keep-alive
      }
    };

    return () => {
      es.close();
    };
  }, [vouchers]);

  return (
    <div>
      <VisitorNavigation currentPath="/vouchers" />

      <ModuleHeader
        categoryBadge="Carteira Digital • Capim Dourado Shopping"
        title="Meus Vouchers & Cupons Resgatados"
        subtitle="Apresente o QR Code ou código do voucher no balcão da loja parceira. O status atualiza automaticamente após a validação."
      />

      {sseNotice && (
        <div className="mb-6 rounded-2xl border border-brand-emerald bg-brand-emerald/15 p-4 text-xs font-bold text-brand-emerald">
          {sseNotice}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
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
                {voucher.status === 'ACTIVE' ? 'ATIVO • APRESENTAR NO BALCÃO' : 'UTILIZADO ✓'}
              </span>
            </div>

            <h3 className="mt-3 font-serif text-xl font-bold text-brand-ink">
              {voucher.rewardTitle}
            </h3>
            <p className="text-xs font-medium text-brand-muted">
              {voucher.storeName} ({voucher.storeFloor})
            </p>

            {/* Representação visual do QR Code do Voucher */}
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-goldLight bg-brand-ivory p-5">
              <div className="grid h-28 w-28 grid-cols-5 gap-1 rounded-xl border-2 border-brand-goldDark bg-white p-2">
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
              <p className="mt-2 font-mono text-[11px] text-brand-muted">
                {voucher.qrPayload}
              </p>
            </div>

            <div className="mt-4 flex justify-between border-t border-brand-border pt-3 text-[11px] text-brand-muted">
              <span>Pontos investidos: {voucher.pointsSpent} pts</span>
              <span>
                Expira em: {new Date(voucher.expiresAt).toLocaleString('pt-BR')}
              </span>
            </div>
          </EditorialCard>
        ))}
      </div>
    </div>
  );
}
