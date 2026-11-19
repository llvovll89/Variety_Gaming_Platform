import { TimerIcon } from '@phosphor-icons/react/dist/icons/Timer';
import { comboMultiplier } from '../game/constants';
import { useEffect, useRef, useState } from 'react';
import { TrophyIcon } from '@phosphor-icons/react/dist/icons/Trophy';
import { LightningIcon } from '@phosphor-icons/react/dist/icons/Lightning';
import type { UISnapshot } from '../game/types';
export default function HUD({uiSnapshot:s}:{uiSnapshot:UISnapshot}) {
  const seconds=Math.ceil(s.timeRemaining);
  return <div className="mole-hud">
    <div className="mole-score"><span>내 점수</span><strong>{s.score.toLocaleString().padStart(3,'0')}</strong><small><TrophyIcon weight="fill"/> BEST {Math.max(s.bestScore,s.score)}</small></div>
    <div className="mole-timer" data-urgent={seconds<=5}><div><TimerIcon size={20}/><strong>{seconds}</strong><span>초</span></div><progress max={30} value={s.timeRemaining} aria-label="남은 시간"/></div>
    <div className="mole-combo" data-active={s.combo>1}><LightningIcon size={21} weight="fill"/><span>{s.combo>1?<><b>{s.combo}</b> COMBO{comboMultiplier(s.combo)>1&&<em className="mole-multiplier"> ×{comboMultiplier(s.combo)}</em>}</>:'보이면 바로 톡!'}</span></div>
    <RoundBanner round={s.round}/>
    <div className="mole-bottom-stats"><span>잡은 두더지 <b>{s.totalMolesHit}</b></span><span>최고 콤보 <b>{s.bestCombo}</b></span><span className="mole-key-hint">Q W E · A S D · Z X C</span></div>
  </div>;
}

/**
 * "Round 2 · faster!" for 1.6 seconds when a new round starts. A pause and resume keeps the same
 * round, so it does not show again. The live region stays mounted so screen readers announce it.
 */
function RoundBanner({round}:{round:number}) {
  const seen=useRef(round);
  const [shown,setShown]=useState<number|null>(null);
  useEffect(()=>{
    if(round<=seen.current){seen.current=round;return;}
    seen.current=round;setShown(round);
    const timer=setTimeout(()=>setShown(null),1600);
    return ()=>clearTimeout(timer);
  },[round]);
  return <>
    <span className="sr-only" role="status">{shown?`${shown}라운드, 더 빨라져요`:''}</span>
    {shown&&<div key={shown} className="mole-round" aria-hidden="true">{shown}라운드 · 더 빨라져요!</div>}
  </>;
}
