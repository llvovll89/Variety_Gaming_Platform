import { useCallback, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import PauseOverlay from "../../shared/components/PauseOverlay";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { MemoryGameEngine } from "./game/engine";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";

type Screen = "menu" | "playing";

const GAME_ID = "hachuping-memory";
const ACCENT_COLOR = "#ff6fa5";
const FALLBACK_SNAPSHOT = emptySnapshot({
  stage: 1,
  sequence: [],
  playerSequence: [],
  cards: [],
  isPlayingSequence: false,
  isPlayerTurn: false,
  gameOver: false,
  score: 0,
  highScore: 0,
  message: "시작하세요!",
  status: "idle",
});

export default function HachupingMemoryApp({ onExit }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [engine, setEngine] = useState<MemoryGameEngine | null>(null);
  const { highScore } = useHighScore(GAME_ID);

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  const handleStart = useCallback(() => {
    const newEngine = new MemoryGameEngine();
    setEngine(newEngine);
    setScreen("playing");
    newEngine.startGame();
  }, []);

  const handleMainMenu = useCallback(() => {
    setEngine(null);
    setScreen("menu");
  }, []);

  const handleTogglePause = useCallback(() => {
    engine?.togglePause();
  }, [engine]);

  const gameActive = screen === "playing";
  const isPaused = snapshot.status === "paused";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
        position: "relative",
        boxSizing: "border-box",
        padding: "12px",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        paddingLeft: "max(12px, env(safe-area-inset-left))",
        paddingRight: "max(12px, env(safe-area-inset-right))",
      }}
    >
      {gameActive && engine && (
        <GameCanvas engine={engine} onReady={setEngine} />
      )}
      {gameActive && engine && (
        <>
          <HUD snapshot={snapshot} onPause={handleTogglePause} />
        </>
      )}
      {screen === "menu" && (
        <>
          <button
            onClick={onExit}
            style={{
              position: "absolute",
              left: "max(16px, env(safe-area-inset-left))",
              top: "max(16px, env(safe-area-inset-top))",
              zIndex: 100,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#ff6fa5",
              border: "none",
              color: "white",
              padding: "12px 20px",
              borderRadius: "24px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "0 4px 12px rgba(255, 111, 165, 0.4)",
              transition: "transform 0.2s, box-shadow 0.2s",
              transformOrigin: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 111, 165, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 111, 165, 0.4)";
            }}
          >
            <ArrowLeftIcon size={18} weight="bold" />
            허브로 🏠
          </button>
          <StartMenu highScore={highScore} onStart={handleStart} />
        </>
      )}
      {isPaused && (
        <PauseOverlay
          score={snapshot.score}
          accentColor={ACCENT_COLOR}
          onResume={handleTogglePause}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
