import { NextGameActions, ScoreFeedback } from '../../platform/PlaySession';
import { useCallback, useState, useRef, useEffect } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import Victory from "./components/Victory";
import FlightPractice from './components/FlightPractice';
import { gameStorageKey, safeGetItem, safeSetItem } from '../../shared/storage';
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { CloudIcon } from '@phosphor-icons/react/dist/icons/Cloud';
import './jump.css';
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useRecords } from "../../platform/meta/api";
import { RewardStrip } from "../../platform/meta/RewardStrip";
import { useMeta } from "../../platform/meta/store";
import type { RunRewards, UnlockedAchievement } from "../../platform/meta/types";
import { usePlayClock } from "../../shared/kit/usePlayClock";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";
import type { JumpEngine } from "./game/engine";

type Screen = "menu" | "practice" | "playing" | "dead" | "won";

const GAME_ID = "hachuping-jump";
const PRACTICE_KEY = gameStorageKey(GAME_ID, 'flight-guide-v1');
const FALLBACK_SNAPSHOT = emptySnapshot();

export default function HachupingJumpApp({ onExit, profile }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playKey, setPlayKey] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [engine, setEngine] = useState<JumpEngine | null>(null);
  const { highScore, previousBest, submitScore } = useHighScore(GAME_ID);
  const records = useRecords();
  const worldsReached = useMeta().games[GAME_ID]?.progress.world ?? 1;
  // The world this run started from (0 = the first); the engine owns its callbacks for one run.
  const [startStage, setStartStage] = useState(0);
  const run = useRef({ startStage: 0, unlocked: [] as UnlockedAchievement[] });
  const [deathStage, setDeathStage] = useState(0);
  const [rewards, setRewards] = useState<RunRewards | null>(null);

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  const playClock = usePlayClock((screen === "playing") && snapshot.status === "playing" && snapshot.journeyPhase === "playing");
  // Remember a newly reached world as soon as it starts, even if the player leaves from the pause menu.
  useEffect(() => {
    if (screen !== "playing" || snapshot.stage + 1 <= worldsReached) return;
    run.current.unlocked.push(...records.reportProgress("world", snapshot.stage + 1));
  }, [screen, snapshot.stage, worldsReached, records]);

  const handleStart = useCallback((stage = 0) => {
    run.current = { startStage: stage, unlocked: [] };
    playClock.reset();
    setStartStage(stage);
    setRewards(null);
    setEngine(null);
    setFinalScore(null);
    setScreen(safeGetItem(PRACTICE_KEY)==='done' ? 'playing' : 'practice');
    setPlayKey((k) => k + 1);
  }, [playClock]);

  const startPractice = useCallback(() => {
    setEngine(null); setFinalScore(null); setScreen('practice'); setPlayKey(k=>k+1);
  }, []);
  const finishPractice = useCallback(() => {
    safeSetItem(PRACTICE_KEY, 'done');
    // Keep the world picked in the menu: practice came first only because it was not done yet.
    run.current = { startStage: run.current.startStage, unlocked: [] }; playClock.reset();
    setEngine(null); setFinalScore(null); setScreen('playing'); setPlayKey(k=>k+1);
  }, [playClock]);

  const handleDeath = useCallback(
    (score: number, cleared: boolean, stage: number) => {
      setFinalScore(score);
      setDeathStage(stage);
      const fromStart = run.current.startStage === 0;
      // The local best stays a full-journey record; a run started from a later world is its own mode.
      if (fromStart) submitScore(score);
      const unlocked = [...run.current.unlocked, ...records.reportProgress("world", stage + 1)];
      // Only a full journey from the first world earns the gold "all six worlds" achievement.
      if (fromStart && cleared) unlocked.push(...records.unlock("clear"));
      const result = records.reportRun({
        mode: fromStart ? "full" : `from-world-${run.current.startStage + 1}`,
        score, durationMs: playClock.elapsed(), outcome: cleared ? "win" : "lose",
        stats: { world: stage + 1 },
      });
      setRewards({ ...result, unlocked: [...unlocked, ...result.unlocked] });
      setScreen(cleared ? "won" : "dead");
    },
    [submitScore, records, playClock],
  );

  const handleRestart = useCallback((stage = run.current.startStage) => {
    run.current = { startStage: stage, unlocked: [] };
    playClock.reset();
    setStartStage(stage);
    setRewards(null);
    setEngine(null);
    setFinalScore(null);
    setScreen("playing");
    setPlayKey((k) => k + 1);
  }, [playClock]);

  const handleMainMenu = useCallback(() => {
    setEngine(null);
    setScreen("menu");
  }, []);

  const handleTogglePause = useCallback(() => {
    engine?.togglePause();
  }, [engine]);

  const gameActive = screen === "practice" || screen === "playing" || screen === "dead" || screen === "won";
  const isPaused = snapshot.status === "paused";

  return (
    <div className="jump-app relative h-full w-full">
      {gameActive && (
        <GameCanvas
          key={playKey}
          characterImageUrl={profile.characterImage}
          bestScore={highScore}
          onDeath={handleDeath}
          onReady={setEngine}
          practice={screen==='practice'}
          startStage={startStage}
        />
      )}
      {gameActive && engine && (
        <>
          {screen!=='practice' && <HUD snapshot={snapshot} />}
          {snapshot.status === "playing" && (
            <button className="jump-pause" aria-label="일시정지" onClick={handleTogglePause}><PauseIcon size={22} weight="fill"/></button>
          )}
        </>
      )}
      {screen==='practice' && snapshot.practice && !isPaused && <FlightPractice practice={snapshot.practice} onFlap={()=>engine?.flap()} onStart={finishPractice} onMenu={handleMainMenu}/>}
      {screen === "menu" && (
        <>
          <button
            onClick={onExit}
            className="jump-exit"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            허브로
          </button>
          <StartMenu profile={profile} bestScore={highScore} onStart={() => handleStart(0)} onPractice={startPractice} worldsReached={worldsReached} onStartWorld={handleStart} />
        </>
      )}
      {isPaused && (
        <div className="jump-dialog" role="dialog" aria-modal="true" aria-labelledby="jump-pause-title"><div className="jump-dialog-panel"><CloudIcon size={48} weight="duotone"/><h2 id="jump-pause-title">구름 위에서 잠깐 쉬어요</h2><p className="jump-final-score">{snapshot.score.toLocaleString()}<small> 점</small></p><button autoFocus className="jump-button jump-button-primary" onClick={handleTogglePause}>계속하기</button><button className="jump-button" onClick={handleMainMenu}>메인 메뉴</button><NextGameActions/></div></div>
      )}
      {screen === "won" && <Victory previousBest={previousBest} score={finalScore ?? 0} onRestart={() => handleRestart(0)} onMenu={handleMainMenu} fromWorld={startStage + 1} rewards={<RewardStrip rewards={rewards} audience="general"/>} />}
      {screen === "dead" && finalScore !== null && (
        <div className="jump-dialog" role="dialog" aria-modal="true" aria-labelledby="jump-end-title"><div className="jump-dialog-panel"><CloudIcon size={48} weight="duotone"/><h2 id="jump-end-title">잠깐, 구름에 쉬어가요!</h2><p>다시 날아오르면 더 멀리 갈 수 있어요.</p><p className="jump-final-score">{finalScore.toLocaleString()}<small> 점</small></p><p>최고 기록 {highScore.toLocaleString()}점</p>{startStage === 0 && <ScoreFeedback score={finalScore} previousBest={previousBest}/>}<RewardStrip rewards={rewards} audience="general"/>{deathStage > 0 && <button autoFocus className="jump-button jump-button-primary" onClick={() => handleRestart(deathStage)}>{deathStage + 1}번째 세계부터 다시</button>}<button autoFocus={deathStage === 0} className={deathStage > 0 ? "jump-button" : "jump-button jump-button-primary"} onClick={() => handleRestart(0)}>처음부터 다시</button><button className="jump-button" onClick={handleMainMenu}>메인 메뉴</button><NextGameActions/></div></div>
      )}
    </div>
  );
}
