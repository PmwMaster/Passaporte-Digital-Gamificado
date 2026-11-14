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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2a1e07] via-brand-goldDark to-brand-goldLight p-6 text-white shadow-lg md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">
            {profile.visitorName}
          </h1>
          <p className="mt-1 text-xs tracking-wider text-white/80">
            Passaporte {profile.memberCode} • Nível {levelMeta.label}
          </p>
        </div>

        <div className="rounded-2xl bg-black/25 px-5 py-3 text-right backdrop-blur-sm">
          <span className="block text-[11px] uppercase tracking-wider text-white/75">
            Saldo
          </span>
          <span className="font-serif text-3xl font-bold text-white">
            {profile.currentPoints} <small className="text-sm font-normal">pts</small>
          </span>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-white/90">
          <span>
            Próximo nível ({profile.lifetimePoints} / {levelMeta.nextLevelPoints} pts)
          </span>
          <span className="font-semibold">{progressPercent}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4 text-center text-xs">
        <div>
          <span className="block text-white/70">Carimbos</span>
          <strong className="text-base font-semibold">{profile.totalStamps}</strong>
        </div>
        <div>
          <span className="block text-white/70">Check-ins</span>
          <strong className="text-base font-semibold">{profile.totalCheckIns}</strong>
        </div>
        <div>
          <span className="block text-white/70">Nível</span>
          <strong className="text-base font-semibold text-emerald-200">
            {levelMeta.label}
          </strong>
        </div>
      </div>
    </div>
  );
}
