interface GameOverScreenProps {
  finalScore: number;
  bestScore?: number;
  accentColor?: string;
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverScreen({
  finalScore,
  bestScore,
  accentColor = "#ec4899",
  onRestart,
  onMainMenu,
}: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/65 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className="motion-safe:animate-panel-in flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-[#14141c] p-7 text-center text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
        style={{ boxShadow: `0 0 40px -12px ${accentColor}66, 0 24px 60px -12px rgba(0,0,0,0.6)` }}
      >
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: accentColor }}>
          사망!
        </h2>
        <p className="text-white/75">
          최종 점수 <span className="text-xl font-bold text-white">{finalScore}</span>
        </p>
        {bestScore !== undefined && (
          <p className="-mt-2 text-sm text-white/45">최고 기록 {bestScore}</p>
        )}
        <button
          onClick={onRestart}
          style={{ backgroundColor: accentColor }}
          className="w-full rounded-full px-6 py-3 text-base font-bold text-[#1a1a1a] transition hover:brightness-105 active:scale-95"
        >
          다시 시작
        </button>
        <button
          onClick={onMainMenu}
          className="w-full rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/20 active:scale-95"
        >
          메인 메뉴
        </button>
      </div>
    </div>
  );
}
