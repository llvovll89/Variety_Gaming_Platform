interface PauseOverlayProps {
  score: number;
  accentColor?: string;
  onResume: () => void;
  onMainMenu: () => void;
}

export default function PauseOverlay({
  score,
  accentColor = "#ec4899",
  onResume,
  onMainMenu,
}: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/65 px-4">
      <div
        className="motion-safe:animate-panel-in flex w-full max-w-xs flex-col items-center gap-4 rounded-3xl bg-[#14141c] p-7 text-center text-white shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
        style={{ boxShadow: `0 0 40px -12px ${accentColor}66, 0 24px 60px -12px rgba(0,0,0,0.6)` }}
      >
        <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: accentColor }}>
          일시정지
        </h2>
        <p className="text-white/75">
          현재 점수 <span className="text-xl font-bold text-white">{score}</span>
        </p>
        <button
          onClick={onResume}
          style={{ backgroundColor: accentColor }}
          className="w-full rounded-full px-6 py-3 text-base font-bold text-[#1a1a1a] transition hover:brightness-105 active:scale-95"
        >
          계속하기
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
