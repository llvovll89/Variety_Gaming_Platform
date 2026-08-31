import { useState } from "react";
import type { DifficultyLevel } from "../game/constants";

interface StartMenuProps {
  onStart: (difficulty: DifficultyLevel) => void;
}

export default function StartMenu({ onStart }: StartMenuProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("normal");

  const handleStart = () => {
    onStart(selectedDifficulty);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/40 backdrop-blur-sm pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-20"
          style={{
            background: "radial-gradient(circle, #ff9020 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-1/2 -left-1/4 w-full h-full rounded-full blur-3xl opacity-15"
          style={{
            background: "radial-gradient(circle, #ffa040 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
      </div>

      <div className="motion-safe:animate-panel-in flex flex-col items-center gap-8 rounded-3xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] p-8 shadow-2xl ring-1 ring-white/10 w-full max-w-md sm:max-w-lg backdrop-blur-xl"
        style={{
          boxShadow: "0 20px 60px -12px rgba(255, 144, 32, 0.3), 0 0 40px -12px rgba(255, 144, 32, 0.2)"
        }}
      >
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-5xl drop-shadow-lg">🔨</div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            두더지 잡기
          </h1>
          <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-orange-400 to-transparent opacity-50" />
        </div>

        {/* Description */}
        <div className="space-y-2 text-center">
          <p className="text-base font-semibold text-white/90">
            떠오르는 두더지를 재빠르게 잡아보세요!
          </p>
          <p className="text-sm text-white/60">
            30초 동안 최대한 많은 두더지를 맞춘 후 리더보드에 올라가세요
          </p>
        </div>

        {/* Difficulty Selection */}
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/80 block">난이도 선택</label>
            <div className="grid grid-cols-3 gap-3">
              {(["easy", "normal", "hard"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(level)}
                  className={`relative px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 overflow-hidden group ${
                    selectedDifficulty === level
                      ? "text-white shadow-lg scale-105"
                      : "text-white/70 hover:text-white"
                  }`}
                  style={{
                    background: selectedDifficulty === level
                      ? "linear-gradient(135deg, #ff9020 0%, #ff7020 100%)"
                      : "rgba(255, 255, 255, 0.05)",
                    border: selectedDifficulty === level
                      ? "1px solid rgba(255, 144, 32, 0.5)"
                      : "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <span className="relative z-10">
                    {level === "easy" && "쉬움"}
                    {level === "normal" && "보통"}
                    {level === "hard" && "어려움"}
                  </span>
                  {selectedDifficulty === level && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Description */}
          <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-semibold text-orange-400 mb-1">
              {selectedDifficulty === "easy" && "🟢 쉬운 난이도"}
              {selectedDifficulty === "normal" && "🟡 보통 난이도 (추천)"}
              {selectedDifficulty === "hard" && "🔴 어려운 난이도"}
            </p>
            <p className="text-xs text-white/70 leading-relaxed">
              {selectedDifficulty === "easy" && "천천하고 쉬운 속도. 게임 초보자에게 추천합니다."}
              {selectedDifficulty === "normal" && "적절한 도전감으로 모든 플레이어에게 즐거운 경험을 제공합니다."}
              {selectedDifficulty === "hard" && "빠르고 어려운 난이도. 숙련된 플레이어를 위한 도전입니다."}
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="w-full space-y-2">
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">💡 팁</p>
          <ul className="space-y-1 text-xs text-white/60">
            <li className="flex gap-2">
              <span className="text-orange-400 flex-shrink-0">▪</span>
              <span>두더지가 보일 때만 클릭하면 10점을 얻습니다</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-400 flex-shrink-0">▪</span>
              <span>높은 점수는 자동으로 리더보드에 저장됩니다</span>
            </li>
            <li className="flex gap-2">
              <span className="text-orange-400 flex-shrink-0">▪</span>
              <span>난이도에 따라 두더지의 속도가 달라집니다</span>
            </li>
          </ul>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full mt-4 px-8 py-4 rounded-xl font-bold text-lg text-white transition-all duration-300 active:scale-95 hover:shadow-xl relative overflow-hidden group"
          style={{
            background: "linear-gradient(135deg, #ff9020 0%, #ff7020 100%)",
            boxShadow: "0 8px 20px rgba(255, 144, 32, 0.3)"
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            게임 시작
            <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0px, 0px); }
          50% { transform: translate(30px, -30px); }
        }
      `}</style>
    </div>
  );
}
