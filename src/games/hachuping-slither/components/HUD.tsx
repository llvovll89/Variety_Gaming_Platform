import type { UISnapshot } from "../game/types";

interface HUDProps {
  snapshot: UISnapshot;
}

export default function HUD({ snapshot }: HUDProps) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1 text-white sm:left-4 sm:top-4">
      <div className="rounded-xl bg-black/40 px-3 py-1.5 backdrop-blur-sm sm:px-4 sm:py-2">
        <div className="text-[11px] uppercase tracking-wide text-pink-200/80 sm:text-xs">점수</div>
        <div className="text-xl font-bold leading-tight sm:text-2xl">{snapshot.score}</div>
      </div>
      <div className="rounded-lg bg-black/30 px-3 py-1 text-[11px] text-white/80 sm:text-xs">
        순위 {snapshot.rank || "-"} / {snapshot.totalAlive}
      </div>
      {snapshot.boosting && (
        <div className="w-fit animate-pulse rounded-full bg-pink-500/90 px-2.5 py-0.5 text-[11px] font-semibold shadow-[0_0_12px_rgba(236,72,153,0.8)] sm:text-xs">
          ⚡ 부스트!
        </div>
      )}
    </div>
  );
}
