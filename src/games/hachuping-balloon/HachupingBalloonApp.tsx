import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import PauseButton from "../../shared/components/PauseButton";
import PauseOverlay from "../../shared/components/PauseOverlay";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";
import type { BalloonEngine } from "./game/engine";

type Screen = "menu" | "playing";

const GAME_ID = "hachuping-balloon";
const ACCENT_COLOR = "#ffb020";
const FALLBACK_SNAPSHOT = emptySnapshot();

export default function HachupingBalloonApp({ onExit, profile }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playKey, setPlayKey] = useState(0);
  const [engine, setEngine] = useState<BalloonEngine | null>(null);
  const { highScore, submitScore } = useHighScore(GAME_ID);

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  // No fail state here — the running "popped so far" score is saved as the best the moment
  // it beats the record, not just when the session ends.
  useEffect(() => {
    if (snapshot.score > 0) submitScore(snapshot.score);
  }, [snapshot.score, submitScore]);

  const handleStart = useCallback(() => {
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

  const gameActive = screen === "playing";
  const isPaused = snapshot.status === "paused";

  return (
    <div className="relative h-full w-full">
      {gameActive && (
        <GameCanvas key={playKey} characterImageUrl={profile.characterImage} bestScore={highScore} onReady={setEngine} />
      )}
      {gameActive && engine && (
        <>
          <HUD snapshot={snapshot} />
          <PauseButton paused={isPaused} onClick={handleTogglePause} />
        </>
      )}
      {screen === "menu" && (
        <>
          <button
            onClick={onExit}
            className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/50 sm:left-4 sm:top-4"
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
    </div>
  );
}
