import { TimerIcon } from '@phosphor-icons/react/dist/icons/Timer';
import { comboMultiplier } from '../game/constants';
import { TrophyIcon } from '@phosphor-icons/react/dist/icons/Trophy';
import { LightningIcon } from '@phosphor-icons/react/dist/icons/Lightning';
import type { UISnapshot } from '../game/types';
export default function HUD({uiSnapshot:s}:{uiSnapshot:UISnapshot}) {
  const seconds=Math.ceil(s.timeRemaining);
  return <div className="mole-hud">
    <div className="mole-score"><span>내 점수</span><strong>{s.score.toLocaleString().padStart(3,'0')}</strong><small><TrophyIcon weight="fill"/> BEST {Math.max(s.bestScore,s.score)}</small></div>
    <div className="mole-timer" data-urgent={seconds<=5}><div><TimerIcon size={20}/><strong>{seconds}</strong><span>초</span></div><progress max={30} value={s.timeRemaining} aria-label="남은 시간"/></div>
    <div className="mole-combo" data-active={s.combo>1}><LightningIcon size={21} weight="fill"/><span>{s.combo>1?<><b>{s.combo}</b> COMBO{comboMultiplier(s.combo)>1&&<em className="mole-multiplier"> ×{comboMultiplier(s.combo)}</em>}</>:'보이면 바로 톡!'}</span></div>
    {s.round>1&&s.status==='playing'&&<div key={s.round} className="mole-round" role="status">{s.round}라운드 · 더 빨라져요!</div>}
    <div className="mole-bottom-stats"><span>잡은 두더지 <b>{s.totalMolesHit}</b></span><span>최고 콤보 <b>{s.bestCombo}</b></span><span className="mole-key-hint">Q W E · A S D · Z X C</span></div>
  </div>;
}
