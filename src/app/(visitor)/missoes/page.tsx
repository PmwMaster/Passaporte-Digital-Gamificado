import { GamificationService } from '@/modules/gamification';
import { EditorialCard } from '@/components/ui/EditorialCard';

export default function MissionsAndStampsPage() {
  const { stamps, missions } = GamificationService.listMissionsAndStamps();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Missões */}
      <EditorialCard>
        <h1 className="font-serif text-xl font-bold text-brand-ink">
          Missões Ativas
        </h1>
        <div className="mt-4 space-y-3">
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
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-serif text-base font-bold text-brand-ink">
                    {mission.title}
                  </h2>
                  <span className="rounded-full bg-brand-emerald/15 px-2.5 py-0.5 text-xs font-bold text-brand-emerald">
                    +{mission.rewardPoints} pts
                  </span>
                </div>
                <p className="mt-1 text-xs text-brand-muted">{mission.description}</p>

                <div className="mt-3">
                  <div className="flex justify-between text-xs font-medium">
                    <span>
                      {mission.currentCount} / {mission.targetCount}
                    </span>
                    <span>{mission.status === 'COMPLETED' ? 'Concluída ✓' : `${pct}%`}</span>
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
        <h2 className="font-serif text-xl font-bold text-brand-ink">
          Carimbos Conquistados ({stamps.length})
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {stamps.map((stamp) => (
            <div
              key={stamp.id}
              className="rounded-2xl border border-dashed border-brand-goldLight bg-brand-ivory p-4"
            >
              <span className="inline-block rounded-full bg-brand-goldDark px-2.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                {stamp.category}
              </span>
              <h3 className="mt-2 font-serif text-base font-bold text-brand-ink">
                {stamp.badgeTitle}
              </h3>
              <p className="text-xs text-brand-muted">{stamp.storeName}</p>
            </div>
          ))}
        </div>
      </EditorialCard>
    </div>
  );
}
