import type { UISnapshot } from "../game/types";

interface HUDProps {
  uiSnapshot: UISnapshot;
}

export default function HUD({ uiSnapshot }: HUDProps) {
  const timeRemaining = Math.ceil(uiSnapshot.timeRemaining);
  const isLowTime = timeRemaining <= 5;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] text-white sm:p-6 sm:pt-[max(1.5rem,env(safe-area-inset-top))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pl-[max(1.5rem,env(safe-area-inset-left))]">
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider">점수</p>
          <div
            className="text-3xl font-extrabold font-mono tracking-tight"
            style={{
              color: "#22c55e",
              textShadow: "0 0 20px rgba(34, 197, 94, 0.3), 0 2px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            {uiSnapshot.score}
          </div>
        </div>

        <div
          className="flex flex-col gap-1 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10"
          style={{
            background: isLowTime
              ? "linear-gradient(135deg, rgba(255, 100, 100, 0.15), rgba(255, 50, 50, 0.1))"
              : "rgba(0, 0, 0, 0.4)",
            borderColor: isLowTime ? "rgba(255, 100, 100, 0.3)" : "rgba(255, 255, 255, 0.1)",
            boxShadow: isLowTime ? "0 0 20px rgba(255, 100, 100, 0.2)" : "none",
          }}
        >
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider">시간</p>
          <div
            className={`text-2xl font-extrabold font-mono ${isLowTime ? "text-red-400 animate-pulse" : "text-white"}`}
            style={{
              textShadow: isLowTime ? "0 0 15px rgba(255, 100, 100, 0.4)" : "0 2px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            {timeRemaining}초
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider">맞힌 개수</p>
          <p className="text-lg font-bold text-white/80">{uiSnapshot.totalCorrect}</p>
        </div>

        <div
          className="px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10"
          style={{
            background: "linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.04))",
            borderColor: "rgba(34, 197, 94, 0.2)",
          }}
        >
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">연속 정답</p>
          <p
            className="text-2xl font-extrabold font-mono"
            style={{
              color: "#22c55e",
              textShadow: "0 0 15px rgba(34, 197, 94, 0.3)",
            }}
          >
            {uiSnapshot.streak}
          </p>
        </div>
      </div>
    </div>
  );
}
