import { useCallback, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import GameOverScreen from "../../shared/components/GameOverScreen";
import PauseButton from "../../shared/components/PauseButton";
import PauseOverlay from "../../shared/components/PauseOverlay";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";
import type { JumpEngine } from "./game/engine";

type Screen = "menu" | "playing" | "dead";

const GAME_ID = "hachuping-jump";
const ACCENT_COLOR = "#4fd8ff";
const FALLBACK_SNAPSHOT = emptySnapshot();

export default function HachupingJumpApp({ onExit, profile }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playKey, setPlayKey] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [engine, setEngine] = useState<JumpEngine | null>(null);
  const { highScore, submitScore } = useHighScore(GAME_ID);

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  const handleStart = useCallback(() => {
    setFinalScore(null);
    setScreen("playing");
    setPlayKey((k) => k + 1);
  }, []);

  const handleDeath = useCallback(
    (score: number) => {
      setFinalScore(score);
      submitScore(score);
      setScreen("dead");
    },
    [submitScore],
  );

  const handleRestart = useCallback(() => {
    setFinalScore(null);
    setScreen("playing");
    setPlayKey((k) => k + 1);
  }, []);

  const handleMainMenu = useCallback(() => {
    setEngine(null);
    setScreen("menu");
  }, []);

  const handleTogglePause = useCallback(() => {
    engine?.togglePause();
  }, [engine]);

  const gameActive = screen === "playing" || screen === "dead";
  const isPaused = snapshot.status === "paused";

  return (
    <div className="relative h-full w-full">
      {gameActive && (
        <GameCanvas
          key={playKey}
          characterImageUrl={profile.characterImage}
          bestScore={highScore}
          onDeath={handleDeath}
          onReady={setEngine}
        />
      )}
      {gameActive && engine && (
        <>
          <HUD snapshot={snapshot} />
          {(snapshot.status === "playing" || snapshot.status === "paused") && (
            <PauseButton paused={isPaused} onClick={handleTogglePause} />
          )}
        </>
      )}
      {screen === "menu" && (
        <>
          <button
            onClick={onExit}
            className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm transition hover:bg-black/60 hover:text-white sm:left-4 sm:top-4"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            허브로
          </button>
          <StartMenu profile={profile} bestScore={highScore} onStart={handleStart} />
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
      {screen === "dead" && finalScore !== null && (
        <GameOverScreen
          finalScore={finalScore}
          bestScore={highScore}
          accentColor={ACCENT_COLOR}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
