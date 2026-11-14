import { AdministrationService } from '@/modules/administration';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function AdminDashboardPage() {
  const data = AdministrationService.getExecutiveDashboard();

  return (
    <div>
      <ModuleHeader
        featureNumber="FUNCIONALIDADE 09"
        title="Painel Administrativo & Governança do Shopping"
        subtitle="Dashboard executivo, aprovação de campanhas, gestão de lojas e QR Codes oficiais, parametrização de geofence (250m) e auditoria."
        developerOwner="DESENVOLVEDOR 03"
        moduleName="administration"
      />

      {/* KPIs Executivos */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">Visitantes Ativos</span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-ink">
            {data.kpis.activeVisitors.toLocaleString('pt-BR')}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Check-ins Validados (GPS + QR)
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-brand-emerald">
            {data.kpis.totalCheckInsVerified.toLocaleString('pt-BR')}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Pontos Emitidos vs. Resgatados
          </span>
          <p className="mt-1 font-serif text-2xl font-bold text-brand-goldDark">
            {data.kpis.totalPointsIssued.toLocaleString('pt-BR')} /{' '}
            {data.kpis.totalPointsRedeemed.toLocaleString('pt-BR')}
          </p>
        </EditorialCard>
        <EditorialCard>
          <span className="text-xs uppercase text-brand-muted">
            Campanhas Aguardando Aprovação
          </span>
          <p className="mt-1 font-serif text-3xl font-bold text-amber-700">
            {data.kpis.pendingCampaignApprovals}
          </p>
        </EditorialCard>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Parâmetros de Geolocalização e QR Codes Oficiais */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Parâmetros de Geofence & QR Codes Oficiais
          </h2>
          <div className="mt-4 rounded-xl border border-brand-border bg-brand-ivory p-4 text-xs">
            <p className="font-semibold text-brand-ink">
              Centro Geográfico Oficial ({data.shoppingConfig.name}):
            </p>
            <p className="mt-1 text-brand-muted">
              Latitude: <code>{data.shoppingConfig.defaultCoordinates.latitude}</code> •
              Longitude: <code>{data.shoppingConfig.defaultCoordinates.longitude}</code> •
              Raio Haversine: <strong>{data.shoppingConfig.defaultGeofenceRadiusMeters} metros</strong>
            </p>
          </div>

          <h3 className="mt-6 font-serif text-lg font-bold text-brand-ink">
            Lojas Parceiras & Tokens de QR Code Oficial ({data.stores.length})
          </h3>
          <div className="mt-3 space-y-2.5">
            {data.stores.map((store) => (
              <div
                key={store.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-white p-3 text-xs"
              >
                <div>
                  <strong className="text-brand-ink">{store.name}</strong>
                  <span className="ml-2 text-brand-muted">({store.floor})</span>
                </div>
                <code className="rounded bg-brand-ivory px-2.5 py-1 font-mono text-[11px] text-brand-goldDark">
                  {store.qrCodeToken}
                </code>
              </div>
            ))}
          </div>
        </EditorialCard>

        {/* Moderação de Campanhas & Auditoria */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Fila de Aprovação de Campanhas & Auditoria
          </h2>
          <div className="mt-4 space-y-3">
            {data.campaigns.map((camp) => (
              <div
                key={camp.id}
                className="rounded-xl border border-brand-border bg-brand-ivory p-4 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-brand-goldDark">
                    {camp.storeName ?? 'Shopping Global'}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      camp.status === 'APPROVED'
                        ? 'bg-brand-emerald/15 text-brand-emerald'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>
                <p className="mt-1 font-serif text-base font-bold text-brand-ink">
                  {camp.title}
                </p>
                <p className="mt-1 text-brand-muted">{camp.description}</p>
              </div>
            ))}
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
