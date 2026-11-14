import { VisitorProfile } from '@/shared/types/domain';
import { PASSPORT_LEVELS } from '@/shared/constants';

export function PassportMemberCard({
  profile,
  progressPercent,
}: {
  profile: VisitorProfile;
  progressPercent: number;
}) {
  const levelMeta = PASSPORT_LEVELS[profile.level];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1e07] via-brand-goldDark to-brand-goldLight p-6 text-white shadow-xl md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95">
            Passaporte Oficial • Capim Dourado Shopping
          </span>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">
            {profile.visitorName}
          </h2>
          <p className="mt-1 text-xs tracking-wider text-white/80">
            Membro Nº {profile.memberCode} • Nível {levelMeta.label}
          </p>
        </div>

        <div className="rounded-2xl bg-black/25 px-5 py-3 text-right backdrop-blur-sm">
          <span className="block text-[11px] uppercase tracking-wider text-white/75">
            Saldo Disponível
          </span>
          <span className="font-serif text-3xl font-bold text-white">
            {profile.currentPoints} <small className="text-sm font-normal">pts</small>
          </span>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-white/90">
          <span>
            Evolução de Nível ({profile.lifetimePoints} / {levelMeta.nextLevelPoints} pts acumulados)
          </span>
          <span className="font-semibold">{progressPercent}%</span>
        </div>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-4 text-center text-xs">
        <div>
          <span className="block text-white/70">Carimbos</span>
          <strong className="text-base font-semibold">{profile.totalStamps}</strong>
        </div>
        <div>
          <span className="block text-white/70">Check-ins Presenciais</span>
          <strong className="text-base font-semibold">{profile.totalCheckIns}</strong>
        </div>
        <div>
          <span className="block text-white/70">Status GPS/LGPD</span>
          <strong className="text-base font-semibold text-emerald-200">Verificado</strong>
        </div>
      </div>
    </div>
  );
}
