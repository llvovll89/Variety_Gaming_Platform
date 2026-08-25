import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import GameOverWithLeaderboard from "./components/GameOverWithLeaderboard";
import PauseButton from "../../shared/components/PauseButton";
import PauseOverlay from "../../shared/components/PauseOverlay";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { useLeaderboard } from "../../shared/hooks/useLeaderboard";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";
import type { WhackAMoleEngine } from "./game/engine";
import type { DifficultyLevel } from "./game/constants";

type Screen = "menu" | "playing" | "game-over";

const GAME_ID = "hachuping-whack-a-mole";
const ACCENT_COLOR = "#ff9020";
const FALLBACK_SNAPSHOT = emptySnapshot();

export default function HachupingWhackAMoleApp({ onExit }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playKey, setPlayKey] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [engine, setEngine] = useState<WhackAMoleEngine | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("normal");
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const { highScore, submitScore } = useHighScore(GAME_ID);
  const { leaderboard, submitScore: submitToLeaderboard } = useLeaderboard(GAME_ID);

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  const handleStart = useCallback((selectedDifficulty: DifficultyLevel) => {
    setDifficulty(selectedDifficulty);
    setFinalScore(null);
    setPlayerRank(null);
    setScreen("playing");
    setPlayKey((k) => k + 1);
  }, []);

  const handleGameOver = useCallback(
    (score: number) => {
      setFinalScore(score);
      submitScore(score);
      const rank = submitToLeaderboard(score);
      setPlayerRank(rank);
      setScreen("game-over");
    },
    [submitScore, submitToLeaderboard],
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
    if (engine?.getGameState().status === "playing") {
      engine.pauseGame();
    } else if (engine?.getGameState().status === "paused") {
      engine.resumeGame();
    }
  }, [engine]);

  // Start the game when engine is ready
  useEffect(() => {
    if (engine && screen === "playing" && engine.getGameState().status === "idle") {
      engine.startGame();
    }
  }, [engine, screen]);

  const gameActive = screen === "playing" || screen === "game-over";
  const isPaused = snapshot.status === "paused";

  return (
    <div className="relative h-full w-full">
      {gameActive && (
        <GameCanvas
          key={playKey}
          bestScore={highScore}
          onGameOver={handleGameOver}
          onReady={setEngine}
          difficulty={difficulty}
        />
      )}
      {gameActive && engine && (
        <>
          <HUD uiSnapshot={snapshot} />
          {snapshot.status === "playing" && (
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
          <StartMenu onStart={handleStart} />
        </>
      )}
      {screen === "game-over" && (
        <GameOverWithLeaderboard
          finalScore={finalScore ?? 0}
          bestScore={highScore}
          accentColor={ACCENT_COLOR}
          leaderboard={leaderboard}
          playerRank={playerRank}
          onRestart={handleRestart}
          onMainMenu={handleMainMenu}
        />
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
