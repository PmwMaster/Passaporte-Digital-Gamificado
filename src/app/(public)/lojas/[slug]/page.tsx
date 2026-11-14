import Link from 'next/link';
import { notFound } from 'next/navigation';
import { StorefrontService } from '@/modules/storefront';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

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

  const { store, rewards, campaigns } = result;

  return (
    <div>
      <ModuleHeader
        featureNumber="FUNCIONALIDADE 01 — PÁGINA INDIVIDUAL DA LOJA"
        title={store.name}
        subtitle={`${store.category} • ${store.floor} (${store.unitNumber})`}
        developerOwner="DESENVOLVEDOR 01"
        moduleName="storefront"
      />

      <div className="mb-6">
        <Link
          href="/"
          className="text-xs font-semibold text-brand-goldDark hover:underline"
        >
          ← Voltar para a Vitrine Pública
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <EditorialCard className="lg:col-span-2">
          <span className="rounded-full bg-brand-emerald/10 px-3 py-1 text-xs font-semibold text-brand-emerald">
            Check-in Presencial: +{store.checkInPoints} pontos + 1 Carimbo Oficial
          </span>
          <h2 className="mt-4 font-serif text-2xl font-bold text-brand-ink">
            Sobre o Estabelecimento
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted">
            {store.description}
          </p>

          <h3 className="mt-8 font-serif text-xl font-bold text-brand-ink">
            Recompensas Disponíveis nesta Loja ({rewards.length})
          </h3>
          <div className="mt-4 grid gap-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="rounded-xl border border-brand-border bg-brand-ivory p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-serif text-lg font-bold text-brand-ink">
                    {reward.title}
                  </h4>
                  <span className="rounded-full bg-brand-goldDark px-3 py-1 text-xs font-semibold text-white">
                    {reward.pointsCost} pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-muted">{reward.description}</p>
                <p className="mt-2 text-[11px] text-brand-muted">
                  Estoque disponível: <strong>{reward.availableStock}</strong> • Validade do voucher:{' '}
                  <strong>{reward.voucherValidityHours}h</strong>
                </p>
              </div>
            ))}
          </div>
        </EditorialCard>

        <EditorialCard className="flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-brand-ink">
              Como Pontuar Aqui
            </h3>
            <ol className="mt-4 space-y-3 text-xs text-brand-muted">
              <li>1. Visite a loja presencialmente no {store.floor}.</li>
              <li>2. Localize o display oficial do Passaporte Capim Dourado no balcão.</li>
              <li>3. Escaneie o QR Code com seu GPS ativo (raio máximo de 250m).</li>
              <li>4. Receba +{store.checkInPoints} pontos e seu carimbo digital na hora!</li>
            </ol>

            {campaigns.length > 0 && (
              <div className="mt-6 rounded-xl border border-brand-goldLight/40 bg-brand-goldDark/5 p-3">
                <span className="text-[11px] font-semibold uppercase text-brand-goldDark">
                  Campanha Ativa
                </span>
                <p className="mt-1 text-xs font-semibold text-brand-ink">
                  {campaigns[0].title}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <Link
              href="/checkin"
              className="block w-full rounded-xl bg-brand-emerald py-3 text-center text-xs font-semibold text-white transition hover:opacity-95"
            >
              Realizar Check-in Presencial Agora
            </Link>
            <Link
              href="/recompensas"
              className="block w-full rounded-xl border border-brand-goldDark py-3 text-center text-xs font-semibold text-brand-goldDark transition hover:bg-brand-goldDark hover:text-white"
            >
              Ir para o Catálogo de Recompensas
            </Link>
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
