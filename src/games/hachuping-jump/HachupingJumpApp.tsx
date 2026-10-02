import { useCallback, useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/icons/ArrowLeft";
import Victory from "./components/Victory";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { CloudIcon } from '@phosphor-icons/react/dist/icons/Cloud';
import './jump.css';
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";
import type { JumpEngine } from "./game/engine";

type Screen = "menu" | "playing" | "dead" | "won";

const GAME_ID = "hachuping-jump";
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
    (score: number, cleared = false) => {
      setFinalScore(score);
      submitScore(score);
      setScreen(cleared ? "won" : "dead");
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

  const gameActive = screen === "playing" || screen === "dead" || screen === "won";
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
        />
      )}
      {gameActive && engine && (
        <>
          <HUD snapshot={snapshot} />
          {snapshot.status === "playing" && (
            <button className="jump-pause" aria-label="일시정지" onClick={handleTogglePause}><PauseIcon size={22} weight="fill"/></button>
          )}
        </>
      )}
      {screen === "menu" && (
        <>
          <button
            onClick={onExit}
            className="jump-exit"
          >
            <ArrowLeftIcon size={14} weight="bold" />
            허브로
          </button>
          <StartMenu profile={profile} bestScore={highScore} onStart={handleStart} />
        </>
      )}
      {isPaused && (
        <div className="jump-dialog" role="dialog" aria-modal="true" aria-labelledby="jump-pause-title"><div className="jump-dialog-panel"><CloudIcon size={48} weight="duotone"/><h2 id="jump-pause-title">구름 위에서 잠깐 쉬어요</h2><p className="jump-final-score">{snapshot.score.toLocaleString()}<small> 점</small></p><button autoFocus className="jump-button jump-button-primary" onClick={handleTogglePause}>계속하기</button><button className="jump-button" onClick={handleMainMenu}>메인 메뉴</button></div></div>
      )}
      {screen === "won" && <Victory score={finalScore ?? 0} onRestart={handleRestart} onMenu={handleMainMenu} />}
      {screen === "dead" && finalScore !== null && (
        <div className="jump-dialog" role="dialog" aria-modal="true" aria-labelledby="jump-end-title"><div className="jump-dialog-panel"><CloudIcon size={48} weight="duotone"/><h2 id="jump-end-title">잠깐, 구름에 쉬어가요!</h2><p>다시 날아오르면 더 멀리 갈 수 있어요.</p><p className="jump-final-score">{finalScore.toLocaleString()}<small> 점</small></p><p>최고 기록 {highScore.toLocaleString()}점</p><button autoFocus className="jump-button jump-button-primary" onClick={handleRestart}>다시 시작</button><button className="jump-button" onClick={handleMainMenu}>메인 메뉴</button></div></div>
      )}
    </div>
  );
}
