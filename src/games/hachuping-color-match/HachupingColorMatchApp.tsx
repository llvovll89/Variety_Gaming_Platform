import { keyOf } from "../../shared/kit/keys";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import PlayField from "./components/PlayField";
import StartMenu from "./components/StartMenu";
import PauseDialog from "./components/PauseDialog";
import GameOverWithLeaderboard from "./components/GameOverWithLeaderboard";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { useLeaderboard, type LeaderboardEntry } from "../../shared/hooks/useLeaderboard";
import { useRecords } from "../../platform/meta/api";
import { usePlayClock } from "../../shared/kit/usePlayClock";
import { RewardStrip } from "../../platform/meta/RewardStrip";
import type { RunRewards } from "../../platform/meta/types";
import { gameStorageKey, safeGetItem, safeSetItem } from "../../shared/storage";
import { settingsStore } from "../../shared/kit/settings";
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

const isDifficulty = (value: unknown): value is DifficultyLevel => typeof value === "string" && value in DIFFICULTY_CONFIGS;

/**
 * The arcade settings hold the chosen level, so "오늘의 도전" can open the game on the level it asks
 * for. The game's own prefs are only a fallback, for players who chose before the move.
 */
function readDifficulty(fallback: unknown): DifficultyLevel {
  const shared = settingsStore.get().games[GAME_ID]?.extra?.difficulty;
  if (isDifficulty(shared)) return shared;
  return isDifficulty(fallback) ? fallback : DEFAULT_DIFFICULTY;
}

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(safeGetItem(PREFS_KEY) ?? "{}") as Partial<Prefs>;
    return {
      difficulty: readDifficulty(raw.difficulty),
      patterns: raw.patterns === true,
      muted: raw.muted === true,
    };
  } catch {
    return { difficulty: DEFAULT_DIFFICULTY, patterns: false, muted: false };
  }
}

export default function HachupingColorMatchApp({ onExit }: GameProps) {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);
  // Records from before they were split by difficulty; kept apart because their difficulty is unknown.
  const { highScore: legacyBest } = useHighScore(GAME_ID);
  const { leaderboard: legacyLeaderboard } = useLeaderboard(GAME_ID);
  // The menu remounts with the new difficulty, so it puts keyboard focus back on the chosen level.
  const [focusDifficulty, setFocusDifficulty] = useState(false);
  const choose: SessionProps["chooseDifficulty"] = (difficulty) => { setFocusDifficulty(true); settingsStore.setGame(GAME_ID, { extra: { difficulty } }); setPrefs((p) => ({ ...p, difficulty })); };
  // Only that one remount: a later return to the menu (after a game) must not pull focus.
  useEffect(() => { if (focusDifficulty) setFocusDifficulty(false); }, [focusDifficulty]);
  useEffect(() => { setSoundMuted(prefs.muted); safeSetItem(PREFS_KEY, JSON.stringify(prefs)); }, [prefs]);
  // Score hooks load on mount, so each difficulty gets its own session (and its own best and TOP 10).
  return <DifficultySession key={prefs.difficulty} prefs={prefs} setPrefs={setPrefs} chooseDifficulty={choose} focusDifficulty={focusDifficulty} legacyBest={legacyBest} legacyLeaderboard={legacyLeaderboard} onExit={onExit} />;
}

interface SessionProps extends Pick<GameProps, "onExit"> {
  prefs: Prefs;
  setPrefs: Dispatch<SetStateAction<Prefs>>;
  chooseDifficulty: (difficulty: DifficultyLevel) => void;
  focusDifficulty: boolean;
  legacyBest: number;
  legacyLeaderboard: LeaderboardEntry[];
}

function DifficultySession({ onExit, prefs, setPrefs, chooseDifficulty, focusDifficulty, legacyBest, legacyLeaderboard }: SessionProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [engine, setEngine] = useState<ColorMatchEngine | null>(null);
  const [finalScore, setFinalScore] = useState(0);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const recordId = `${GAME_ID}:${prefs.difficulty}`;
  const { highScore, previousBest, submitScore } = useHighScore(recordId);
  const { leaderboard, submitScore: submitToLeaderboard } = useLeaderboard(recordId);
  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  // The engine reports game over from inside its loop; keep the latest callbacks without restarting it.
  const records = useRecords();
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const playClock = usePlayClock(screen === "playing" && snapshot.status === "playing");
  const finish = useRef<(score: number) => void>(() => {});
  finish.current = (score: number) => {
    setFinalScore(score);
    submitScore(score);
    const final = engine?.uiStore.getSnapshot();
    const tries = final ? final.totalCorrect + final.totalWrong : 0;
    setRewards(records.reportRun({
      difficulty: prefs.difficulty, score, durationMs: playClock.elapsed(), outcome: "complete",
      stats: final ? { correct: final.totalCorrect, streak: final.bestStreak, accuracy: tries ? Math.round(final.totalCorrect / tries * 100) : 0 } : undefined,
    }));
    setPlayerRank(submitToLeaderboard(score));
    setScreen("game-over");
  };

  const begin = useCallback(() => {
    setPlayerRank(null);
    setRewards(null);
    playClock.reset();
    const next = new ColorMatchEngine(highScore, (score) => finish.current(score), prefs.difficulty);
    setEngine(next);
    setScreen("playing");
    next.startGame();
  }, [highScore, prefs.difficulty, playClock]);

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
      if (e.key === "Escape" || keyOf(e) === "p") { e.preventDefault(); togglePause(); return; }
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
            difficulty={prefs.difficulty}
            onDifficultyChange={chooseDifficulty}
            focusDifficulty={focusDifficulty}
            patterns={prefs.patterns}
            bestScore={highScore}
            legacyBest={legacyBest}
            legacyLeaderboard={legacyLeaderboard}
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
          difficultyName={DIFFICULTY_CONFIGS[prefs.difficulty].name}
          rewards={<RewardStrip rewards={rewards} audience="kids" />}
          playerRank={playerRank}
          onRestart={begin}
          onMainMenu={toMenu}
        />
      )}
    </div>
  );
}
