import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/infrastructure/authentication/session';
import { VisitorPassportService } from '@/modules/visitor';
import { PassportMemberCard } from '@/components/shared/PassportMemberCard';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default async function VisitorPassportPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect('/login?redirectTo=/passaporte');
  }

  const passport = await VisitorPassportService.getPassportOverview(session);

  return (
    <div className="space-y-6">
      <PassportMemberCard
        profile={passport.profile}
        progressPercent={passport.progressPercent}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Carimbos Recentes */}
        <EditorialCard>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand-ink">
              Meus Carimbos
            </h3>
            <Link
              href="/missoes"
              className="text-xs font-semibold text-brand-goldDark hover:underline"
            >
              Ver missões →
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {passport.stamps.length === 0 ? (
              <p className="rounded-xl border border-dashed border-brand-border bg-brand-ivory p-4 text-center text-xs text-brand-muted">
                Nenhum carimbo ainda. Faça um check-in para conquistar o primeiro.
              </p>
            ) : (
              passport.stamps.map((stamp) => (
                <div
                  key={stamp.id}
                  className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-ivory p-3"
                >
                  <div>
                    <p className="font-serif text-sm font-bold text-brand-ink">
                      {stamp.badgeTitle}
                    </p>
                    <p className="text-xs text-brand-muted">{stamp.storeName}</p>
                  </div>
                  <span className="rounded-full bg-brand-emerald/15 px-2.5 py-0.5 text-[11px] font-semibold text-brand-emerald">
                    OK
                  </span>
                </div>
              ))
            )}
          </div>
        </EditorialCard>

        {/* Carteira Rápida de Vouchers Ativos */}
        <EditorialCard>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-brand-ink">
              Vouchers Ativos
            </h3>
            <Link
              href="/vouchers"
              className="text-xs font-semibold text-brand-goldDark hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {passport.activeVouchers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-brand-border bg-brand-ivory p-4 text-center text-xs text-brand-muted">
                Nenhum voucher ativo no momento.
              </p>
            ) : (
              passport.activeVouchers.map((voucher) => (
                <div
                  key={voucher.id}
                  className="rounded-xl border border-brand-emerald/30 bg-brand-emerald/5 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <code className="rounded bg-white px-2 py-0.5 text-xs font-bold text-brand-emerald">
                      {voucher.code}
                    </code>
                    <span className="text-[11px] font-semibold text-brand-emerald">
                      ATIVO
                    </span>
                  </div>
                  <p className="mt-1.5 font-serif text-sm font-bold text-brand-ink">
                    {voucher.rewardTitle}
                  </p>
                  <p className="text-xs text-brand-muted">{voucher.storeName}</p>
                </div>
              ))
            )}
          </div>
        </EditorialCard>

        {/* Dados do Perfil */}
        <EditorialCard>
          <h3 className="font-serif text-lg font-bold text-brand-ink">
            Minha Conta
          </h3>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-brand-border pb-2">
              <dt className="text-brand-muted">Nome:</dt>
              <dd className="font-semibold text-brand-ink">{passport.user.name}</dd>
            </div>
            <div className="flex justify-between border-b border-brand-border pb-2">
              <dt className="text-brand-muted">E-mail:</dt>
              <dd className="font-semibold text-brand-ink">{passport.user.email}</dd>
            </div>
            {passport.user.phone && (
              <div className="flex justify-between pb-2">
                <dt className="text-brand-muted">WhatsApp:</dt>
                <dd className="font-semibold text-brand-emerald">{passport.user.phone}</dd>
              </div>
            )}
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              href="/checkin"
              className="rounded-xl bg-brand-goldDark py-2.5 text-center text-xs font-semibold text-white"
            >
              Fazer Check-in
            </Link>
            <Link
              href="/extrato"
              className="rounded-xl border border-brand-border bg-brand-ivory py-2.5 text-center text-xs font-semibold text-brand-ink"
            >
              Extrato
            </Link>
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
