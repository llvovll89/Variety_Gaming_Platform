import { useCallback, useEffect, useRef, useState } from 'react';
import { PauseIcon } from '@phosphor-icons/react/dist/icons/Pause';
import { SpeakerHighIcon } from '@phosphor-icons/react/dist/icons/SpeakerHigh';
import { SpeakerSlashIcon } from '@phosphor-icons/react/dist/icons/SpeakerSlash';
import { PlayIcon } from '@phosphor-icons/react/dist/icons/Play';
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/icons/ArrowLeft';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import StartMenu from './components/StartMenu';
import GameOverWithLeaderboard from './components/GameOverWithLeaderboard';
import { GameDialog, AUTOFOCUS } from '../../shared/kit/GameDialog';
import { SettingsPanel } from '../../shared/kit/SettingsPanel';
import { useAutoPause } from '../../shared/kit/useAutoPause';
import { effectiveAudio, settingsStore, useSettingsValue } from '../../shared/kit/settings';
import { useUISnapshot } from '../../shared/hooks/useUISnapshot';
import { useHighScore } from '../../shared/hooks/useHighScore';
import { useLeaderboard } from '../../shared/hooks/useLeaderboard';
import { emptySnapshot } from './game/uiStore';
import type { GameProps } from '../../platform/types';
import type { WhackAMoleEngine } from './game/engine';
import { DIFFICULTY_CONFIGS, GAME_TOTAL_TIME, type DifficultyLevel } from './game/constants';
import { useRecords } from '../../platform/meta/api';
import { RewardStrip } from '../../platform/meta/RewardStrip';
import type { RunRewards } from '../../platform/meta/types';
import './mole.css';
const FALLBACK=emptySnapshot();
const ID='hachuping-whack-a-mole';
export default function HachupingWhackAMoleApp({onExit}:GameProps) {
  // Difficulty and sound are remembered through the arcade settings.
  const [difficulty,setDifficulty]=useState<DifficultyLevel>(()=>{
    const saved=settingsStore.get().games[ID]?.extra?.difficulty;
    return typeof saved==='string'&&Object.hasOwn(DIFFICULTY_CONFIGS,saved)?saved as DifficultyLevel:'normal';
  });
  const muted=useSettingsValue(s=>effectiveAudio(s,ID).muted);
  // With every game muted from the arcade settings, this button cannot unmute just this one.
  const allMuted=useSettingsValue(s=>s.muted);
  const toggleMuted=()=>settingsStore.setGame(ID,{muted:!muted});
  const [focusDifficulty,setFocusDifficulty]=useState(false);
  const {highScore:legacyBest}=useHighScore(ID);
  const {leaderboard:legacyLeaderboard}=useLeaderboard(ID);
  const selectDifficulty=(d:DifficultyLevel)=>{setFocusDifficulty(true);setDifficulty(d);settingsStore.setGame(ID,{extra:{difficulty:d}});};
  // Score hooks load on mount: each difficulty owns a fresh record session.
  return <DifficultySession key={difficulty} difficulty={difficulty} onDifficultyChange={selectDifficulty} onExit={onExit} legacyBest={legacyBest} legacyLeaderboard={legacyLeaderboard} muted={muted} allMuted={allMuted} onMutedChange={toggleMuted} focusDifficulty={focusDifficulty}/>;
}
function DifficultySession({onExit,difficulty,onDifficultyChange,legacyBest,legacyLeaderboard,muted,allMuted,onMutedChange,focusDifficulty}:Pick<GameProps,'onExit'> & {
  difficulty:DifficultyLevel;onDifficultyChange:(d:DifficultyLevel)=>void;legacyBest:number;
  muted:boolean;allMuted:boolean;onMutedChange:()=>void;focusDifficulty:boolean;
  legacyLeaderboard:import('../../shared/leaderboard').LeaderboardEntry[];
}) {
  const [screen,setScreen]=useState<'menu'|'playing'|'game-over'>('menu');
  const [playKey,setPlayKey]=useState(0);
  const [engine,setEngine]=useState<WhackAMoleEngine|null>(null);
  const [rank,setRank]=useState<number|null>(null);
  const {highScore,previousBest,submitScore}=useHighScore(`${ID}:${difficulty}`);
  const {leaderboard,submitScore:submitRanking}=useLeaderboard(`${ID}:${difficulty}`);
  const s=useUISnapshot(engine?.uiStore??null,FALLBACK);
  const records=useRecords();
  const [rewards,setRewards]=useState<RunRewards|null>(null);
  const reportedFor=useRef(-1);
  const start=useCallback(()=>{setEngine(null);setRank(null);setRewards(null);setPlayKey(k=>k+1);setScreen('playing');},[]);
  const finish=useCallback((score:number)=>{submitScore(score);setRank(submitRanking(score));setScreen('game-over');},[submitScore,submitRanking]);
  const menu=useCallback(()=>{engine?.destroy();setEngine(null);setScreen('menu');},[engine]);
  useEffect(()=>{if(engine&&screen==='playing'&&engine.getGameState().status==='idle')engine.startGame();},[engine,screen]);
  // Tell the arcade how the run went (bests, achievements, today's challenge), once per run.
  useEffect(()=>{
    if(screen!=='game-over'||!engine||reportedFor.current===playKey) return;
    reportedFor.current=playKey;
    const g=engine.getGameState();
    setRewards(records.reportRun({difficulty,score:g.finalScore??g.score,durationMs:GAME_TOTAL_TIME*1000,outcome:'complete',
      stats:{hits:g.totalMolesHit,combo:g.bestCombo,accuracy:g.attempts?Math.round(g.totalMolesHit/g.attempts*100):0}}));
  },[screen,engine,playKey,records,difficulty]);
  // Looking away, Escape or P pauses; Escape on the pause dialog resumes.
  useAutoPause({active:!!engine&&screen==='playing'&&(s.status==='ready'||s.status==='playing'),onPause:()=>engine?.pauseGame()});
  return <div className="mole-game">
    {screen==='menu'?<StartMenu onStart={start} onExit={onExit} bestScore={highScore} difficulty={difficulty} onDifficultyChange={onDifficultyChange} legacyBest={legacyBest} legacyLeaderboard={legacyLeaderboard} focusDifficulty={focusDifficulty}/>:<>
      <header className="mole-play-nav"><span><b>두더지 잡기</b><small>{DIFFICULTY_CONFIGS[difficulty].name} · 30초 챌린지</small></span><div><button className="mole-icon-button" onClick={onMutedChange} disabled={allMuted} title={allMuted?'모든 게임 소리가 꺼져 있어요 (허브 설정)':undefined} aria-label={allMuted?'모든 게임 소리가 꺼져 있어요':muted?'소리 켜기':'소리 끄기'} aria-pressed={muted}>{muted?<SpeakerSlashIcon size={21}/>:<SpeakerHighIcon size={21}/>}</button><button className="mole-icon-button" onClick={()=>engine?.pauseGame()} aria-label="일시정지" disabled={s.status==='game-over'}><PauseIcon size={21} weight="fill"/></button></div></header>
      <GameCanvas key={playKey} bestScore={highScore} onGameOver={finish} onReady={setEngine} difficulty={difficulty} engine={engine} activeMoles={s.activeMoles} onBack={menu}/>
      <HUD uiSnapshot={s}/>
      {s.status==='ready'&&<div className="mole-countdown" role="status"><span>손가락 준비!</span><strong key={Math.ceil(s.countdown)}>{Math.max(1,Math.ceil(s.countdown))}</strong><p>두더지가 올라오면 톡!</p></div>}
      {s.status==='paused'&&<GameDialog label="일시정지" onClose={()=>engine?.resumeGame()} className="mole-dialog"><div className="mole-pause-panel"><PauseIcon size={36} weight="fill"/><h2>잠깐, 숨 고르기.</h2><p>남은 시간 {Math.ceil(s.timeRemaining)}초 · 현재 {s.score}점</p><button {...AUTOFOCUS} className="mole-primary" onClick={()=>engine?.resumeGame()}><PlayIcon size={19} weight="fill"/> 계속하기</button><button className="mole-quiet" onClick={menu}><ArrowLeftIcon size={18}/> 메뉴로 돌아가기</button><SettingsPanel compact gameId={ID} gameTitle="두더지 잡기"/></div></GameDialog>}
      {screen==='game-over'&&<GameOverWithLeaderboard difficulty={difficulty} previousBest={previousBest} finalScore={s.finalScore??s.score} bestScore={highScore} leaderboard={leaderboard} playerRank={rank} onRestart={start} onMainMenu={menu} snapshot={s} rewards={<RewardStrip rewards={rewards} audience="kids"/>}/>}
    </>}
  </div>;
}
