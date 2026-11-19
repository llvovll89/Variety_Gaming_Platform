import { NextGameActions, ScoreFeedback } from '../../platform/PlaySession';
import { useHighScore } from "../../shared/hooks/useHighScore";
import { useCallback, useEffect, useRef, useState } from "react";
import { AUTOFOCUS, GameDialog } from '../../shared/kit/GameDialog';
import { useAutoPause } from '../../shared/kit/useAutoPause';
import { useRecords } from '../../platform/meta/api';
import { RewardStrip } from '../../platform/meta/RewardStrip';
import type { RunRewards } from '../../platform/meta/types';
import './slither.css';
import UpgradeDialog from './components/UpgradeDialog';
import DeathReport from './components/DeathReport';
import BoostButton from "./components/BoostButton";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import Leaderboard from "./components/Leaderboard";
import Minimap from "./components/Minimap";
import StartMenu from "./components/StartMenu";
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { PlayIcon } from '@phosphor-icons/react/dist/icons/Play';
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { emptySnapshot } from "./game/uiStore";
import { useBodyPalette } from "./useBodyPalette";
import type { GameProps } from "../../platform/types";
import type { GameEngine } from "./game/engine";
import type { RunEnd } from "./game/types";

type Screen = "menu" | "playing" | "dead";

const FALLBACK_SNAPSHOT = emptySnapshot();
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function HachupingSliderApp({ onExit, profile }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playKey, setPlayKey] = useState(0);
  const [result, setResult] = useState<RunEnd | null>(null);
  const [rewards, setRewards] = useState<RunRewards | null>(null);
  const records = useRecords();
  const reported = useRef<RunEnd | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const { highScore, previousBest, submitScore } = useHighScore("hachuping-slither");
  const bodyPalette = useBodyPalette();
  const [usePortrait, setUsePortrait] = useState(false);

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  const handleStart = useCallback(() => {
    setEngine(null);
    setResult(null);
    setRewards(null);
    setScreen("playing");
    setPlayKey((k) => k + 1);
  }, []);

  // The engine keeps the handler it was created with, so this one only stores the result.
  const handleDeath = useCallback((end: RunEnd) => {
    setResult(end);
    setScreen("dead");
  }, []);

  // A finished run is reported once: length is the score, kills and survival time go to the records.
  useEffect(() => {
    if (!result || reported.current === result) return;
    reported.current = result;
    submitScore(result.score);
    setRewards(records.reportRun({
      score: result.score, durationMs: Math.round(result.seconds * 1000), outcome: 'lose',
      stats: { kills: result.kills, survivalSec: Math.floor(result.seconds), level: result.level },
    }));
  }, [result, records, submitScore]);

  const handleMainMenu = useCallback(() => {
    setEngine(null);
    setScreen("menu");
  }, []);

  const handleTogglePause = useCallback(() => {
    engine?.togglePause();
  }, [engine]);

  const gameActive = screen === "playing" || screen === "dead";
  const isPaused = snapshot.status === "paused";
  // Escape / P pause too. Leaving the window is handled by the engine itself.
  useAutoPause({ active: screen === "playing" && snapshot.status === "playing", onPause: () => engine?.pause(), blur: false, visibility: false });

  return (
    <div className="slither relative h-full w-full">
      {gameActive && (
        <GameCanvas
          key={playKey}
          playerName={profile.name}
          characterImageUrl={usePortrait ? profile.characterImage : ''}
          bodyPaletteColors={bodyPalette.colors}
          onDeath={handleDeath}
          onReady={setEngine}
        />
      )}
      {gameActive && engine && (
        <>
          <HUD snapshot={snapshot} />
          <Leaderboard entries={snapshot.leaderboard} />
          <Minimap minimap={snapshot.minimap} />
          {(snapshot.status === "playing" || snapshot.status === "paused") && (
            <button className="slither-pause" aria-label={isPaused ? '계속하기' : '일시정지'} onClick={handleTogglePause}>{isPaused ? <PlayIcon size={20} weight="fill" /> : <PauseIcon size={20} weight="fill" />}</button>
          )}
          {snapshot.status === "playing" && (
            <BoostButton engine={engine} canBoost={snapshot.canBoost} />
          )}
        </>
      )}
      {screen === "menu" && (
        <>
          <StartMenu
            onExit={onExit}
            profile={profile}
            bodyPaletteId={bodyPalette.paletteId}
            onSelectBodyPalette={bodyPalette.setPaletteId}
            onStart={handleStart}
            usePortrait={usePortrait}
            onTogglePortrait={setUsePortrait}
          />
        </>
      )}
      {isPaused && (
        <GameDialog className="slither-result slither-session-dialog" labelledBy="slither-result-title" onClose={handleTogglePause}>
          <span className="slither-kicker">TAKE A BREATH</span><h2 id="slither-result-title">잠시 쉬어가기</h2>
          <p>길이 {snapshot.score} · LV {snapshot.level}</p>
          <button {...AUTOFOCUS} className="slither-primary" onClick={handleTogglePause}>계속하기</button><button onClick={handleMainMenu}>게임 메뉴</button>
        </GameDialog>
      )}
      {screen === 'playing' && snapshot.status === 'playing' && snapshot.pendingUpgrades > 0 && engine && <UpgradeDialog snapshot={snapshot} onChoose={key => engine.upgrade(key)} />}
      {screen === "dead" && result && (
        <GameDialog className="slither-result slither-session-dialog" labelledBy="slither-result-title" dismissible={false} onClose={handleMainMenu}>
          <span className="slither-kicker">JOURNEY ENDED</span><h2 id="slither-result-title">조금 더 자란 오늘.</h2><p>다음 정원에서는 더 멀리 가볼까요?</p>
          {snapshot.death && <DeathReport death={snapshot.death}/>}
          <div><span><strong>{result.score}</strong>최종 길이</span><span><strong>{result.kills}</strong>잡은 지렁이</span><span><strong>{formatTime(result.seconds)}</strong>생존 시간</span></div>
          <p>내 최고 길이 {highScore.toLocaleString()} · LV {result.level}</p><ScoreFeedback score={result.score} previousBest={previousBest} unit=""/><RewardStrip rewards={rewards} audience="general"/><button {...AUTOFOCUS} className="slither-primary" onClick={handleStart}>다시 출발</button><button onClick={handleMainMenu}>게임 메뉴</button><NextGameActions/>
        </GameDialog>
      )}
    </div>
  );
}
