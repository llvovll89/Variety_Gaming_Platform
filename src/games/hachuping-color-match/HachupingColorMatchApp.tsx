import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import PlayField from "./components/PlayField";
import StartMenu from "./components/StartMenu";
import PauseDialog from "./components/PauseDialog";
import GameOverWithLeaderboard from "./components/GameOverWithLeaderboard";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { useLeaderboard } from "../../shared/hooks/useLeaderboard";
import { gameStorageKey, safeGetItem, safeSetItem } from "../../shared/storage";
import { emptySnapshot } from "./game/uiStore";
import { ColorMatchEngine } from "./game/engine";
import { setMuted as setSoundMuted } from "./game/sound";
import { DEFAULT_DIFFICULTY, DIFFICULTY_CONFIGS, type DifficultyLevel } from "./game/constants";
import type { GameProps } from "../../platform/types";
import "./color-match.css";

type Screen = "menu" | "playing" | "game-over";

const GAME_ID = "hachuping-color-match";
const FALLBACK_SNAPSHOT = emptySnapshot();
const PREFS_KEY = gameStorageKey(GAME_ID, "prefs");

interface Prefs { difficulty: DifficultyLevel; patterns: boolean; muted: boolean }

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(safeGetItem(PREFS_KEY) ?? "{}") as Partial<Prefs>;
    return {
      difficulty: raw.difficulty && raw.difficulty in DIFFICULTY_CONFIGS ? raw.difficulty : DEFAULT_DIFFICULTY,
      patterns: raw.patterns === true,
      muted: raw.muted === true,
    };
  } catch {
    return { difficulty: DEFAULT_DIFFICULTY, patterns: false, muted: false };
  }
}

export default function HachupingColorMatchApp({ onExit }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  const [engine, setEngine] = useState<ColorMatchEngine | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [previousBest, setPreviousBest] = useState(0);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const { highScore, submitScore } = useHighScore(GAME_ID);
  const { leaderboard, submitScore: submitToLeaderboard } = useLeaderboard(GAME_ID);
  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  // The engine reports game over from inside its loop; keep the latest callbacks without restarting it.
  const finish = useRef<(score: number) => void>(() => {});
  finish.current = (score: number) => {
    setPreviousBest(highScore);
    setFinalScore(score);
    submitScore(score);
    setPlayerRank(submitToLeaderboard(score));
    setScreen("game-over");
  };

  useEffect(() => { setSoundMuted(prefs.muted); safeSetItem(PREFS_KEY, JSON.stringify(prefs)); }, [prefs]);

  const begin = useCallback((difficulty: DifficultyLevel) => {
    setPrefs((p) => ({ ...p, difficulty }));
    setPlayerRank(null);
    const next = new ColorMatchEngine(highScore, (score) => finish.current(score), difficulty);
    setEngine(next);
    setScreen("playing");
    next.startGame();
  }, [highScore]);

  const toMenu = useCallback(() => {
    setEngine(null);
    setScreen("menu");
  }, []);

  const togglePause = useCallback(() => {
    if (!engine) return;
    const status = engine.getGameState().status;
    if (status === "playing") engine.pauseGame();
    else if (status === "paused") engine.resumeGame();
  }, [engine]);

  // Leaving the tab or app pauses the clock; keys: 1–6 pick a pot, Esc / P pause.
  useEffect(() => {
    if (!engine || screen !== "playing") return;
    const pause = () => engine.pauseGame();
    const onVisibility = () => { if (document.hidden) pause(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "Escape" || e.key.toLowerCase() === "p") { e.preventDefault(); togglePause(); return; }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 6 && engine.getGameState().status === "playing") { e.preventDefault(); engine.selectOptionAt(n - 1); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", pause);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", pause);
      window.removeEventListener("keydown", onKey);
    };
  }, [engine, screen, togglePause]);

  useEffect(() => () => engine?.destroy(), [engine]);

  return (
    <div className="cm-app">
      {screen === "menu" && (
        <>
          <button className="cm-back" onClick={onExit}><ArrowLeftIcon size={14} weight="bold" /> 허브로</button>
          <StartMenu
            initialDifficulty={prefs.difficulty}
            patterns={prefs.patterns}
            bestScore={highScore}
            onTogglePatterns={() => setPrefs((p) => ({ ...p, patterns: !p.patterns }))}
            onStart={begin}
          />
        </>
      )}
      {screen !== "menu" && engine && (
        <PlayField
          snapshot={snapshot}
          patterns={prefs.patterns}
          muted={prefs.muted}
          onToggleMute={() => setPrefs((p) => ({ ...p, muted: !p.muted }))}
          onPause={togglePause}
          onSelect={engine.selectOption}
        />
      )}
      {screen === "playing" && snapshot.status === "paused" && (
        <PauseDialog score={snapshot.score} seconds={Math.ceil(snapshot.timeRemaining)} onResume={togglePause} onMainMenu={toMenu} />
      )}
      {screen === "game-over" && (
        <GameOverWithLeaderboard
          finalScore={finalScore}
          previousBest={previousBest}
          snapshot={snapshot}
          leaderboard={leaderboard}
          playerRank={playerRank}
          onRestart={() => begin(prefs.difficulty)}
          onMainMenu={toMenu}
        />
      )}
    </div>
  );
}
