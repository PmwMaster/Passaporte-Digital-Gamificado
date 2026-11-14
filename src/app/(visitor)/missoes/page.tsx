import { GamificationService } from '@/modules/gamification';
import { VisitorNavigation } from '@/components/layout/VisitorNavigation';
import { EditorialCard, ModuleHeader } from '@/components/ui/EditorialCard';

export default function MissionsAndStampsPage() {
  const { stamps, missions } = GamificationService.listMissionsAndStamps();

  return (
    <div>
      <VisitorNavigation currentPath="/missoes" />

      <ModuleHeader
        featureNumber="FUNCIONALIDADE 05"
        title="Gamificação, Carimbos Digitais & Missões"
        subtitle="Coleção de selos por estabelecimento, missões diárias, semanais e mensais com conclusão automática e bônus de pontos."
        developerOwner="DESENVOLVEDOR 02"
        moduleName="gamification"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Missões */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Missões e Desafios Ativos
          </h2>
          <div className="mt-5 space-y-4">
            {missions.map((mission) => {
              const pct = Math.min(
                100,
                Math.round((mission.currentCount / mission.targetCount) * 100)
              );
              return (
                <div
                  key={mission.id}
                  className="rounded-2xl border border-brand-border bg-brand-ivory p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-brand-goldDark/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-brand-goldDark">
                      {mission.frequency} • {mission.periodKey}
                    </span>
                    <span className="rounded-full bg-brand-emerald/15 px-3 py-0.5 text-xs font-bold text-brand-emerald">
                      +{mission.rewardPoints} pts bônus
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-bold text-brand-ink">
                    {mission.title}
                  </h3>
                  <p className="mt-1 text-xs text-brand-muted">{mission.description}</p>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs font-medium">
                      <span>
                        Progresso: {mission.currentCount} de {mission.targetCount}
                      </span>
                      <span>{mission.status === 'COMPLETED' ? 'CONCLUÍDA ✓' : `${pct}%`}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-goldDark to-brand-emerald"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </EditorialCard>

        {/* Coleção de Carimbos */}
        <EditorialCard>
          <h2 className="font-serif text-2xl font-bold text-brand-ink">
            Caderneta de Carimbos Conquistados ({stamps.length})
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {stamps.map((stamp) => (
              <div
                key={stamp.id}
                className="rounded-2xl border-2 border-dashed border-brand-goldLight bg-brand-ivory p-4"
              >
                <span className="inline-block rounded-full bg-brand-goldDark px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  {stamp.category}
                </span>
                <h3 className="mt-2 font-serif text-base font-bold text-brand-ink">
                  {stamp.badgeTitle}
                </h3>
                <p className="text-xs text-brand-muted">{stamp.storeName}</p>
                <p className="mt-2 text-[11px] text-brand-emerald">
                  Validado em {new Date(stamp.earnedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </EditorialCard>
      </div>
    </div>
  );
}
