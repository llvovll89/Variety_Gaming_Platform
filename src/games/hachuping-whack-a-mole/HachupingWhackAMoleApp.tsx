import { useCallback, useEffect, useState } from 'react';
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/icons/SpeakerHigh';
import { SpeakerSlashIcon } from '@phosphor-icons/react/dist/icons/SpeakerSlash';
import { PlayIcon } from '@phosphor-icons/react/dist/icons/Play';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/icons/ArrowLeft';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import StartMenu from './components/StartMenu';
import GameOverWithLeaderboard from './components/GameOverWithLeaderboard';
import GameDialog from './components/GameDialog';
import { useUISnapshot } from '../../shared/hooks/useUISnapshot';
import { useHighScore } from '../../shared/hooks/useHighScore';
import { useLeaderboard } from '../../shared/hooks/useLeaderboard';
import { emptySnapshot } from './game/uiStore';
import type { GameProps } from '../../platform/types';
import type { WhackAMoleEngine } from './game/engine';
import { DIFFICULTY_CONFIGS, type DifficultyLevel } from './game/constants';
import './mole.css';
const FALLBACK=emptySnapshot();
const ID='hachuping-whack-a-mole';
export default function HachupingWhackAMoleApp({onExit}:GameProps) {
  const [screen,setScreen]=useState<'menu'|'playing'|'game-over'>('menu');
  const [playKey,setPlayKey]=useState(0);
  const [engine,setEngine]=useState<WhackAMoleEngine|null>(null);
  const [difficulty,setDifficulty]=useState<DifficultyLevel>('normal');
  const [muted,setMuted]=useState(false);
  const [rank,setRank]=useState<number|null>(null);
  const {highScore,submitScore}=useHighScore(ID);
  const {leaderboard,submitScore:submitRanking}=useLeaderboard(ID);
  const s=useUISnapshot(engine?.uiStore??null,FALLBACK);
  const start=useCallback((d:DifficultyLevel)=>{setDifficulty(d);setEngine(null);setRank(null);setPlayKey(k=>k+1);setScreen('playing');},[]);
  const finish=useCallback((score:number)=>{submitScore(score);submitRanking(score);setRank(leaderboard.filter(e=>e.score>=score).length<10?leaderboard.filter(e=>e.score>=score).length+1:null);setScreen('game-over');},[submitScore,submitRanking,leaderboard]);
  const menu=useCallback(()=>{engine?.destroy();setEngine(null);setScreen('menu');},[engine]);
  useEffect(()=>{if(engine){engine.setMuted(muted);if(screen==='playing'&&engine.getGameState().status==='idle')engine.startGame();}},[engine,screen,muted]);
  return <div className="mole-game">
    {screen==='menu'?<StartMenu onStart={start} onExit={onExit} bestScore={highScore} initialDifficulty={difficulty}/>:<>
      <header className="mole-play-nav"><span><b>두더지 잡기</b><small>{DIFFICULTY_CONFIGS[difficulty].name} · 30초 챌린지</small></span><div><button className="mole-icon-button" onClick={()=>setMuted(m=>!m)} aria-label={muted?'소리 켜기':'소리 끄기'} aria-pressed={muted}>{muted?<SpeakerSlashIcon size={21}/>:<SpeakerHighIcon size={21}/>}</button><button className="mole-icon-button" onClick={()=>engine?.pauseGame()} aria-label="일시정지" disabled={s.status==='game-over'}><PauseIcon size={21} weight="fill"/></button></div></header>
      <GameCanvas key={playKey} bestScore={highScore} onGameOver={finish} onReady={setEngine} difficulty={difficulty} engine={engine} activeMoles={s.activeMoles} onBack={menu}/>
      <HUD uiSnapshot={s}/>
      {s.status==='ready'&&<div className="mole-countdown" role="status"><span>손가락 준비!</span><strong key={Math.ceil(s.countdown)}>{Math.max(1,Math.ceil(s.countdown))}</strong><p>두더지가 올라오면 톡!</p></div>}
      {s.status==='paused'&&<GameDialog label="일시정지" onClose={()=>engine?.resumeGame()}><div className="mole-pause-panel"><PauseIcon size={36} weight="fill"/><h2>잠깐, 숨 고르기.</h2><p>남은 시간 {Math.ceil(s.timeRemaining)}초 · 현재 {s.score}점</p><button autoFocus className="mole-primary" onClick={()=>engine?.resumeGame()}><PlayIcon size={19} weight="fill"/> 계속하기</button><button className="mole-quiet" onClick={menu}><ArrowLeftIcon size={18}/> 메뉴로 돌아가기</button></div></GameDialog>}
      {screen==='game-over'&&<GameOverWithLeaderboard finalScore={s.finalScore??s.score} bestScore={highScore} leaderboard={leaderboard} playerRank={rank} onRestart={()=>start(difficulty)} onMainMenu={menu} snapshot={s}/>}
    </>}
  </div>;
}
