import Link from 'next/link';
import { VisitorPassportService } from '@/modules/visitor';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { PassportMemberCard } from '@/components/shared/PassportMemberCard';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function VisitorPassportPage() {
  const passport = VisitorPassportService.getPassportOverview();

  return (
    <div>
      <VisitorNavigation currentPath="/passaporte" />

      <ModuleHeader
        featureNumber="FUNCIONALIDADE 03"
        title="Passaporte & Perfil do Visitante"
        subtitle="Cartão de membro digital, visualização de nível, saldo consolidado, carteira rápida de cupons e histórico."
        developerOwner="DESENVOLVEDOR 01"
        moduleName="visitor"
      />

      <PassportMemberCard
        profile={passport.profile}
        progressPercent={passport.progressPercent}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Carimbos Recentes */}
        <EditorialCard>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-brand-ink">
              Caderneta de Carimbos
            </h3>
            <Link
              href="/missoes"
              className="text-xs font-semibold text-brand-goldDark hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {passport.stamps.map((stamp) => (
              <div
                key={stamp.id}
                className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-ivory p-3"
              >
                <div>
                  <span className="text-[10px] font-semibold uppercase text-brand-goldDark">
                    {stamp.category}
                  </span>
                  <p className="font-serif text-sm font-bold text-brand-ink">
                    {stamp.badgeTitle}
                  </p>
                  <p className="text-xs text-brand-muted">{stamp.storeName}</p>
                </div>
                <span className="rounded-full bg-brand-emerald/15 px-2.5 py-1 text-[11px] font-semibold text-brand-emerald">
                  Carimbado
                </span>
              </div>
            ))}
          </div>
        </EditorialCard>

        {/* Carteira Rápida de Vouchers Ativos */}
        <EditorialCard>
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-xl font-bold text-brand-ink">
              Meus Vouchers Ativos
            </h3>
            <Link
              href="/vouchers"
              className="text-xs font-semibold text-brand-goldDark hover:underline"
            >
              Abrir Carteira →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {passport.activeVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="rounded-xl border border-brand-emerald/30 bg-brand-emerald/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <code className="rounded bg-white px-2 py-0.5 text-xs font-bold text-brand-emerald">
                    {voucher.code}
                  </code>
                  <span className="text-[11px] font-semibold text-brand-emerald">
                    ATIVO • PRONTO PARA USO
                  </span>
                </div>
                <p className="mt-2 font-serif text-base font-bold text-brand-ink">
                  {voucher.rewardTitle}
                </p>
                <p className="text-xs text-brand-muted">
                  {voucher.storeName} ({voucher.storeFloor})
                </p>
              </div>
            ))}
          </div>
        </EditorialCard>

        {/* Dados do Perfil & Consentimento LGPD */}
        <EditorialCard>
          <h3 className="font-serif text-xl font-bold text-brand-ink">
            Perfil & Privacidade LGPD
          </h3>
          <dl className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-brand-border pb-2">
              <dt className="text-brand-muted">Titular:</dt>
              <dd className="font-semibold text-brand-ink">{passport.user.name}</dd>
            </div>
            <div className="flex justify-between border-b border-brand-border pb-2">
              <dt className="text-brand-muted">E-mail:</dt>
              <dd className="font-semibold text-brand-ink">{passport.user.email}</dd>
            </div>
            <div className="flex justify-between border-b border-brand-border pb-2">
              <dt className="text-brand-muted">WhatsApp Verificado:</dt>
              <dd className="font-semibold text-brand-emerald">{passport.user.phone}</dd>
            </div>
            <div className="flex justify-between pb-2">
              <dt className="text-brand-muted">Consentimento LGPD:</dt>
              <dd className="font-semibold text-brand-ink">
                v{passport.user.lgpdConsentVersion} (Ativo)
              </dd>
            </div>
          </dl>
          <div className="mt-6 grid grid-cols-2 gap-2">
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
              Ver Extrato
            </Link>
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
