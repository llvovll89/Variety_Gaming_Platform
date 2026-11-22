import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useBest, useRecords } from "../../platform/meta/api";
import { hasRewards, RewardStrip } from "../../platform/meta/RewardStrip";
import type { RunRewards } from "../../platform/meta/types";
import { settingsStore } from "../../shared/kit/settings";
import { SPEEDS, type MemorySpeed } from "./game/constants";
import { memorySound } from "./game/sound";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import { GameDialog } from "../../shared/kit/GameDialog";
import { PauseDialog } from "../../shared/kit/PauseDialog";
import { ResultPanel } from "../../shared/kit/ResultPanel";
import { useAutoPause } from "../../shared/kit/useAutoPause";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { MemoryGameEngine } from "./game/engine";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";
import "./memory.css";

type Screen = "menu" | "playing";

const GAME_ID = "hachuping-memory";
/** Game kit theme: the pink of the board and menu, so pause and result screens match the game. */
const KIT_THEME = {
  "--kit-surface": "#fff5f9",
  "--kit-ink": "#4a1d33",
  "--kit-muted": "#8a5470",
  "--kit-line": "#f3c2d8",
  "--kit-accent": "#cc2f70",
  "--kit-on-accent": "#fff",
  "--kit-radius": "28px",
  "--kit-backdrop": "#4a1d3366",
} as CSSProperties;
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
  // Remembered between visits, like the other games' difficulty.
  const [speed, setSpeed] = useState<MemorySpeed>(() => {
    const extra = settingsStore.get().games[GAME_ID]?.extra;
    // The speed is what this game reports as the run's difficulty, so "오늘의 도전" asks for it under
    // that name. Accept either spelling rather than silently ignoring the day's choice.
    for (const saved of [extra?.speed, extra?.difficulty]) {
      if (typeof saved === "string" && Object.hasOwn(SPEEDS, saved)) return saved as MemorySpeed;
    }
    return "normal";
  });
  const chooseSpeed = (next: MemorySpeed) => { setSpeed(next); settingsStore.setGame(GAME_ID, { extra: { speed: next, difficulty: next } }); };
  // 빠르기를 바꾸면 엔진과 판을 새로 연다. 기록은 빠르기별로 따로 남는다.
  return <MemorySession key={speed} onExit={onExit} speed={speed} chooseSpeed={chooseSpeed} />;
}

function MemorySession({ onExit, speed, chooseSpeed }: Pick<GameProps, "onExit"> & { speed: MemorySpeed; chooseSpeed: (speed: MemorySpeed) => void }) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [engine, setEngine] = useState<MemoryGameEngine | null>(null);
  const best = useBest(undefined, speed) ?? 0;
  const resultTitle = useId();

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);
  useEffect(() => () => engine?.destroy(), [engine]);
  // Time actually spent playing: pauses and hidden tabs do not count as play time.
  const played = useRef({ ms: 0, since: 0 });
  useEffect(() => {
    const clock = played.current;
    if (snapshot.status === "playing") { clock.since = performance.now(); return; }
    if (clock.since) { clock.ms += performance.now() - clock.since; clock.since = 0; }
  }, [snapshot.status]);
  const records = useRecords();
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const reported = useRef<MemoryGameEngine | null>(null);
  useEffect(() => {
    if (snapshot.status !== 'game-over' || !engine || reported.current === engine) return;
    reported.current = engine; // once per run, also under StrictMode
    // A memory run only ends on a mistake: 'lose', so a 3-second slip is not a win or a streak day.
    setRewards(records.reportRun({ score: snapshot.score, durationMs: played.current.ms, outcome: 'lose', difficulty: speed, stats: { stage: snapshot.gameState.stage } }));
  }, [snapshot.status, snapshot.score, snapshot.gameState.stage, engine, records, speed]);

  const handleStart = useCallback(() => {
    engine?.destroy();
    // Start is a tap: wake the audio here, or strict browsers (iOS) stay silent for the first pattern.
    memorySound.unlock();
    const newEngine = new MemoryGameEngine(best, speed);
    played.current = { ms: 0, since: 0 };
    setRewards(null);
    setEngine(newEngine);
    setScreen("playing");
    newEngine.startGame();
  }, [engine, best, speed]);

  const handleMainMenu = useCallback(() => {
    setEngine(null);
    setScreen("menu");
  }, []);

  const handleTogglePause = useCallback(() => {
    engine?.togglePause();
  }, [engine]);

  const gameActive = screen === "playing";
  // Escape, P or looking away pauses (the game had no keyboard pause before).
  // togglePause would resume if two triggers (blur + hidden tab) arrive together, so only pause a running game.
  const pauseIfPlaying = useCallback(() => { if (engine?.uiStore.getSnapshot().status === "playing") engine.togglePause(); }, [engine]);
  useAutoPause({ active: gameActive && snapshot.status === "playing", onPause: pauseIfPlaying });
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
        ...KIT_THEME,
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
              backgroundColor: "#cc2f70",
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
          <StartMenu highScore={best} onStart={handleStart} speed={speed} onSpeedChange={chooseSpeed} />
        </>
      )}
      {isPaused && (
        <PauseDialog
          title="잠깐 쉬어 가요"
          summary={`지금까지 ${snapshot.score}점`}
          onResume={handleTogglePause}
          onQuit={handleMainMenu}
          quitLabel="처음 화면으로"
        />
      )}
      {snapshot.status === 'game-over' && <GameDialog labelledBy={resultTitle} onClose={handleMainMenu}>
        <ResultPanel
          titleId={resultTitle}
          eyebrow="동물 친구 기억력"
          headline="이번 한 판 완료!"
          score={{ value: snapshot.score, unit: "점", previousBest: rewards?.previousBest ?? 0 }}
          stats={[{ label: "최고 기록", value: `${best}점` }, { label: "도달 단계", value: `${snapshot.gameState.stage}단계` }]}
          rewards={hasRewards(rewards) ? <RewardStrip rewards={rewards} audience="kids" /> : undefined}
          primary={{ label: "다시 시작", onClick: handleStart }}
          secondary={[{ label: "처음 화면으로", onClick: handleMainMenu }]}
        />
      </GameDialog>}
    </div>
  );
}
