import type { UISnapshot } from "../game/types";

interface HUDProps {
  snapshot: UISnapshot;
}

export default function HUD({ snapshot }: HUDProps) {
  return (
    <div className="pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] flex flex-col gap-1.5 text-white sm:left-[max(1rem,env(safe-area-inset-left))] sm:top-[max(1rem,env(safe-area-inset-top))]">
      <div className="rounded-xl border border-[#4fd8ff]/30 bg-black/70 px-3 py-1.5 shadow-[0_0_16px_rgba(79,216,255,0.25)] backdrop-blur-sm sm:px-4 sm:py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#7fe6ff] sm:text-xs">
          점수
        </div>
        <div className="text-xl font-bold leading-tight tabular-nums sm:text-2xl">
          {snapshot.score}
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] tabular-nums text-white/80 sm:text-xs">
        최고 기록 {snapshot.bestScore}
      </div>
    </div>
  );
}
