import type { LeaderboardEntry } from "../../../shared/hooks/useLeaderboard";

interface GameOverWithLeaderboardProps {
  finalScore: number;
  bestScore: number;
  accentColor: string;
  leaderboard: LeaderboardEntry[];
  playerRank: number | null; // rank if entered top 10, null otherwise
  onRestart: () => void;
  onMainMenu: () => void;
}

export default function GameOverWithLeaderboard({
  finalScore,
  bestScore,
  accentColor,
  leaderboard,
  playerRank,
  onRestart,
  onMainMenu,
}: GameOverWithLeaderboardProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Animated gradient accent */}
      <div
        className="absolute pointer-events-none opacity-20 blur-3xl"
        style={{
          width: "400px",
          height: "400px",
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          top: "-50%",
          right: "-50%",
          animation: "pulse 4s ease-in-out infinite"
        }}
      />

      <div
        className="motion-safe:animate-panel-in flex w-full max-w-md flex-col gap-6 rounded-3xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] p-8 text-center text-white shadow-2xl ring-1 ring-white/10 relative z-10 backdrop-blur-xl"
        style={{
          boxShadow: `0 0 60px -20px ${accentColor}40, 0 20px 60px -12px rgba(0,0,0,0.5)`
        }}
      >
        {/* Header Section */}
        <div className="space-y-3">
          <div className="text-6xl drop-shadow-lg">🎉</div>
          <div>
            <h2
              className="text-3xl font-extrabold tracking-tight mb-2"
              style={{ color: accentColor }}
            >
              게임 완료!
            </h2>
            <div className="h-px w-12 mx-auto bg-gradient-to-r" style={{
              background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`
            }} />
          </div>
        </div>

        {/* Score Section */}
        <div className="space-y-3 bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/70">최종 점수</p>
            <p className="text-4xl font-extrabold" style={{ color: accentColor }}>
              {finalScore}
            </p>
          </div>

          {playerRank && (
            <div
              className="px-4 py-2 rounded-xl font-bold text-sm"
              style={{
                background: `${accentColor}22`,
                border: `1px solid ${accentColor}44`,
                color: accentColor
              }}
            >
              🏆 리더보드 #{playerRank}에 등록!
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60">최고 기록</span>
            <span className="font-bold text-white/80">{bestScore}</span>
          </div>
        </div>

        {/* Leaderboard Section */}
        {leaderboard.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white/70 uppercase tracking-wider">📊 TOP 10 랭킹</p>
              <p className="text-xs text-white/50">{leaderboard.length}명</p>
            </div>

            <div className="space-y-1.5 bg-black/30 rounded-2xl p-4 max-h-48 overflow-y-auto border border-white/5">
              {leaderboard.map((entry, idx) => {
                const isPlayerScore = entry.score === finalScore && playerRank;
                const rank = idx + 1;

                let medal = "";
                let rankColor = "#b3bcc9";
                if (rank === 1) { medal = "🥇"; rankColor = "#ffd700"; }
                else if (rank === 2) { medal = "🥈"; rankColor = "#c0c0c0"; }
                else if (rank === 3) { medal = "🥉"; rankColor = "#cd7f32"; }

                return (
                  <div
                    key={`${entry.score}-${entry.timestamp}`}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                      isPlayerScore
                        ? "bg-gradient-to-r from-white/15 to-transparent ring-1 ring-white/30 scale-105 origin-left"
                        : "hover:bg-white/5"
                    }`}
                    style={{
                      background: isPlayerScore
                        ? `linear-gradient(to right, ${accentColor}22, transparent)`
                        : undefined
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-base w-4 text-center">
                        {medal || <span style={{ color: rankColor }} className="font-bold text-sm">#{rank}</span>}
                      </span>
                      <span className={`text-sm font-semibold ${isPlayerScore ? "text-white" : "text-white/60"}`}>
                        {isPlayerScore ? "YOU" : `#${rank}`}
                      </span>
                    </div>
                    <span
                      className="font-mono font-bold text-sm"
                      style={{
                        color: isPlayerScore ? accentColor : "white",
                        fontSize: isPlayerScore ? "1.1rem" : "1rem"
                      }}
                    >
                      {entry.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 relative px-6 py-3.5 rounded-xl font-bold text-white transition-all duration-300 active:scale-95 overflow-hidden group hover:shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              boxShadow: `0 8px 20px ${accentColor}40`
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              🎮 다시 하기
              <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
          </button>

          <button
            onClick={onMainMenu}
            className="flex-1 px-6 py-3.5 rounded-xl font-bold text-white transition-all duration-300 active:scale-95 hover:shadow-lg"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <span className="flex items-center justify-center gap-2">
              🏠 메인 메뉴
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
