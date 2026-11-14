import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontService } from '@/modules/storefront';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = StorefrontService.getStoreBySlug(slug);

  if (!result) {
    notFound();
  }

  const { store, rewards } = result;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-semibold text-brand-goldDark hover:underline"
        >
          ← Voltar para Lojas
        </Link>
        <span className="rounded-full bg-brand-emerald/10 px-3 py-1 text-xs font-semibold text-brand-emerald">
          +{store.checkInPoints} pts por check-in
        </span>
      </div>

      <EditorialCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-goldDark">
              {store.category} • {store.floor} ({store.unitNumber})
            </span>
            <h1 className="mt-1 font-serif text-2xl font-bold text-brand-ink">
              {store.name}
            </h1>
            <p className="mt-2 text-sm text-brand-muted">{store.description}</p>
          </div>
          <Link
            href="/checkin"
            className="rounded-xl bg-brand-emerald px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-95"
          >
            Fazer Check-in Agora
          </Link>
        </div>

        <h2 className="mt-6 font-serif text-lg font-bold text-brand-ink">
          Recompensas desta Loja ({rewards.length})
        </h2>
        <div className="mt-3 grid gap-3">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-ivory p-4"
            >
              <div>
                <h3 className="font-serif text-base font-bold text-brand-ink">
                  {reward.title}
                </h3>
                <p className="text-xs text-brand-muted">{reward.description}</p>
                <p className="mt-1 text-[11px] text-brand-muted">
                  Estoque: <strong>{reward.availableStock}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-brand-goldDark px-3 py-1 text-xs font-semibold text-white">
                  {reward.pointsCost} pts
                </span>
                <Link
                  href="/recompensas"
                  className="rounded-lg border border-brand-goldDark px-3 py-1 text-xs font-semibold text-brand-goldDark hover:bg-brand-goldDark hover:text-white"
                >
                  Resgatar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </EditorialCard>
    </div>
  );
}
