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
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Animated gradient accent */}
      <div
        className="absolute pointer-events-none opacity-30 blur-3xl"
        style={{
          width: "300px",
          height: "300px",
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "pulse 3s ease-in-out infinite"
        }}
      />
      
      <div
        className="motion-safe:animate-panel-in flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] p-8 text-center text-white shadow-2xl ring-1 ring-white/10 relative z-10 backdrop-blur-xl"
        style={{ 
          boxShadow: `0 0 60px -20px ${accentColor}40, 0 20px 60px -12px rgba(0,0,0,0.5)` 
        }}
      >
        {/* Header */}
        <div className="space-y-3">
          <div className="text-5xl drop-shadow-lg">⏸️</div>
          <h2 
            className="text-3xl font-extrabold tracking-tight" 
            style={{ color: accentColor }}
          >
            일시정지됨
          </h2>
        </div>

        {/* Score Display */}
        <div className="w-full bg-white/5 rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-2">현재 점수</p>
          <p 
            className="text-4xl font-extrabold font-mono"
            style={{ 
              color: accentColor,
              textShadow: `0 0 20px ${accentColor}40`
            }}
          >
            {score}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col w-full gap-3 pt-2">
          <button
            onClick={onResume}
            className="relative px-8 py-4 rounded-xl font-bold text-white transition-all duration-300 active:scale-95 overflow-hidden group hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              boxShadow: `0 8px 20px ${accentColor}40`
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              계속 진행하기
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
          </button>
          
          <button
            onClick={onMainMenu}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 active:scale-95 hover:shadow-lg"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            🏠 메인 메뉴
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
