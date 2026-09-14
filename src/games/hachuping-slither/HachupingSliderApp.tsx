import { useCallback, useState } from "react";
import './slither.css';
import UpgradeDialog from './components/UpgradeDialog';
import BoostButton from "./components/BoostButton";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import Leaderboard from "./components/Leaderboard";
import Minimap from "./components/Minimap";
import StartMenu from "./components/StartMenu";
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { PlayIcon } from '@phosphor-icons/react/dist/icons/Play';
import SessionDialog from './components/SessionDialog';
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { emptySnapshot } from "./game/uiStore";
import { useBodyPalette } from "./useBodyPalette";
import type { GameProps } from "../../platform/types";
import type { GameEngine } from "./game/engine";

type Screen = "menu" | "playing" | "dead";

const FALLBACK_SNAPSHOT = emptySnapshot();

export default function HachupingSliderApp({ onExit, profile }: GameProps) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [playKey, setPlayKey] = useState(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [engine, setEngine] = useState<GameEngine | null>(null);
  const bodyPalette = useBodyPalette();

  const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK_SNAPSHOT);

  const handleStart = useCallback(() => {
    setFinalScore(null);
    setScreen("playing");
    setPlayKey((k) => k + 1);
  }, []);

  const handleDeath = useCallback((score: number) => {
    setFinalScore(score);
    setScreen("dead");
  }, []);

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
    <div className="slither relative h-full w-full">
      {gameActive && (
        <GameCanvas
          key={playKey}
          playerName={profile.name}
          characterImageUrl={profile.characterImage}
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
          />
        </>
      )}
      {isPaused && (
        <SessionDialog onCancel={handleTogglePause}>
          <span className="slither-kicker">TAKE A BREATH</span><h2 id="slither-result-title">잠시 쉬어가기</h2>
          <p>길이 {snapshot.score} · LV {snapshot.level}</p>
          <button autoFocus className="slither-primary" onClick={handleTogglePause}>계속하기</button><button onClick={handleMainMenu}>게임 메뉴</button>
        </SessionDialog>
      )}
      {screen === 'playing' && snapshot.status === 'playing' && snapshot.pendingUpgrades > 0 && engine && <UpgradeDialog snapshot={snapshot} onChoose={key => engine.upgrade(key)} />}
      {screen === "dead" && finalScore !== null && (
        <SessionDialog>
          <span className="slither-kicker">JOURNEY ENDED</span><h2 id="slither-result-title">조금 더 자란 오늘.</h2><p>다음 정원에서는 더 멀리 가볼까요?</p>
          <div><span><strong>{finalScore}</strong>최종 길이</span><span><strong>LV {snapshot.level}</strong>도달 레벨</span></div>
          <button autoFocus className="slither-primary" onClick={handleRestart}>다시 출발</button><button onClick={handleMainMenu}>게임 메뉴</button>
        </SessionDialog>
      )}
    </div>
  );
}
