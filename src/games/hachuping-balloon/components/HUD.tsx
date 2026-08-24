import type { UISnapshot } from "../game/types";

interface HUDProps {
  snapshot: UISnapshot;
}

export default function HUD({ snapshot }: HUDProps) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5 sm:left-4 sm:top-4">
      <div className="rounded-xl border border-[#ffb020]/40 bg-white/85 px-3 py-1.5 shadow-[0_8px_24px_-8px_rgba(217,119,6,0.35)] backdrop-blur-sm sm:px-4 sm:py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#d97706] sm:text-xs">
          터뜨린 풍선
        </div>
        <div className="text-xl font-bold leading-tight tabular-nums text-[#3a2a10] sm:text-2xl">
          {snapshot.score}
        </div>
      </div>
      <div className="rounded-lg border border-white/60 bg-white/70 px-2.5 py-1 text-[11px] tabular-nums text-[#5b4630] sm:text-xs">
        최고 기록 {snapshot.bestScore}
      </div>
    </div>
  );
}
