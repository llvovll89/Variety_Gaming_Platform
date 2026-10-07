import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, PauseIcon, SpeakerHighIcon, SpeakerSlashIcon } from "@phosphor-icons/react";
import GameCanvas from "./components/GameCanvas";
import HUD from "./components/HUD";
import StartMenu from "./components/StartMenu";
import { useUISnapshot } from "../../shared/hooks/useUISnapshot";
import { useHighScore } from "../../shared/hooks/useHighScore";
import { emptySnapshot } from "./game/uiStore";
import type { GameProps } from "../../platform/types";
import type { BalloonEngine } from "./game/engine";
import "./balloon.css";
const FALLBACK = emptySnapshot();
export default function HachupingBalloonApp({ onExit, profile }: GameProps) {
 const [playing, setPlaying] = useState(false), [playKey, setPlayKey] = useState(0);
 const [engine, setEngine] = useState<BalloonEngine | null>(null);
 const [muted, setMuted] = useState(false);
 const { highScore, submitScore } = useHighScore("hachuping-balloon");
 const snapshot = useUISnapshot(engine?.uiStore ?? null, FALLBACK);
 useEffect(() => { if(snapshot.score > 0) submitScore(snapshot.score); }, [snapshot.score, submitScore]);
 useEffect(() => { engine?.setMuted(muted); }, [engine, muted]);
 useEffect(() => {
  if (playing && snapshot.status === "playing") document.querySelector<HTMLCanvasElement>(".balloon-app canvas")?.focus({ preventScroll: true });
 }, [playing, snapshot.status]);
 const start = useCallback(() => { setEngine(null); setPlaying(true); setPlayKey(k => k + 1); }, []);
 const menu = () => { setEngine(null); setPlaying(false); };
 useEffect(() => {
  const key = (e: KeyboardEvent) => { if(e.key === "Escape" && playing) engine?.togglePause(); };
  window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
 }, [engine, playing]);
 const paused = playing && snapshot.status === "paused";
 const ended = playing && snapshot.status === "gameover";
 return <div className="balloon-app relative h-full w-full">
 {playing ? <div className="absolute inset-0" inert={paused || ended}><GameCanvas key={playKey} characterImageUrl={profile.characterImage} bestScore={highScore} onReady={setEngine} />
 <HUD snapshot={snapshot} /><div className="balloon-tools">
 <button aria-label={muted ? "소리 켜기" : "소리 끄기"} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <SpeakerSlashIcon size={23} /> : <SpeakerHighIcon size={23} />}</button>
 <button aria-label="잠깐 쉬기" onClick={() => engine?.pause()}><PauseIcon size={23} weight="fill" /></button></div>
 {snapshot.score === 0 && !paused && !ended && <p className="balloon-help">떠오르는 풍선을 눌러보세요!</p>}
 </div> : <><StartMenu profile={profile} bestScore={highScore} onStart={start} /><button className="balloon-back" onClick={onExit}><ArrowLeftIcon size={18} />허브로</button></>}
 {(paused || ended) && <div className="balloon-overlay"><section className="balloon-dialog" role="dialog" aria-modal="true" aria-labelledby="balloon-dialog-title" onKeyDown={e => {
   if(e.key !== "Tab") return;
   const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
   if(e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
   if(!e.shiftKey && document.activeElement === buttons[buttons.length - 1]) { e.preventDefault(); buttons[0].focus(); }
 }}>
 <h2 id="balloon-dialog-title">{paused ? "잠깐 쉬어가요" : "하늘 가득 팡팡!"}</h2>
 <p>{paused ? "풍선들도 기다리고 있어요." : "60초 동안 터뜨린 풍선"}</p>
 <strong className="balloon-result">{snapshot.score}<small>개</small></strong>
 {ended && <p>내 최고 기록 {Math.max(highScore, snapshot.score)}개</p>}
 <button autoFocus className="balloon-primary" onClick={paused ? () => engine?.resume() : start}>{paused ? "계속 놀기" : "한 번 더 놀기"}</button>
 <button className="balloon-secondary" onClick={menu}>처음 화면으로</button>
 </section></div>}
 </div>;
}
