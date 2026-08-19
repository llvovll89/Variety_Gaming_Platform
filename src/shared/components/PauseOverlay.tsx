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
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-4">
      <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl bg-[#14141c] p-6 text-center text-white shadow-2xl">
        <h2 className="text-2xl font-extrabold" style={{ color: accentColor }}>
          일시정지
        </h2>
        <p className="text-white/80">
          현재 점수 <span className="text-xl font-bold text-white">{score}</span>
        </p>
        <button
          onClick={onResume}
          style={{ backgroundColor: accentColor }}
          className="w-full rounded-full px-6 py-2.5 text-base font-bold text-white transition hover:brightness-110 active:scale-95"
        >
          계속하기
        </button>
        <button
          onClick={onMainMenu}
          className="w-full rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/20 active:scale-95"
        >
          메인 메뉴
        </button>
      </div>
    </div>
  );
}
