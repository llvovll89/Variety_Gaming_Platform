import { LightningIcon } from '@phosphor-icons/react/dist/icons/Lightning';
import { MAX_LEVEL } from '../game/progression';
import type { UISnapshot } from '../game/types';

export default function HUD({ snapshot: s }: { snapshot: UISnapshot }) {
  return <>
    <div className="slither-hud">
      <div className="slither-hud-title"><span>별빛 정원</span><strong>LV <b>{s.level}</b></strong></div>
      <div className="slither-xp-label"><span>{s.level === MAX_LEVEL ? '최고 레벨' : '다음 레벨까지'}</span><span>{s.level === MAX_LEVEL ? 'MAX' : Math.floor(s.xp) + ' / ' + s.xpNext + ' XP'}</span></div>
      <progress className="slither-xp" aria-label="레벨 경험치" max={s.xpNext} value={s.level === MAX_LEVEL ? s.xpNext : s.xp} />
      <div className="slither-hud-numbers"><div><small>길이</small><strong>{s.score}</strong></div><div><small>현재 순위</small><strong>{s.rank || '-'}<small> / {s.totalAlive}</small></strong></div></div>
    </div>
    <div className="slither-stats"><span>이동 <b>{s.speed}</b></span><span>수집 반경 <b>+{s.pickupBonus}</b></span><span>부스트 소모 <b>{s.boostDrain.toFixed(1)}/초</b></span></div>
    <div className={'slither-boost-note' + (s.boosting ? ' is-boosting' : '')}>
      <LightningIcon size={14} weight="fill" />{s.boosting ? '질주 중 · 길이 소모' : s.canBoost ? '꾹 눌러 부스트' : '길이 23부터 부스트'}
    </div>
  </>;
}
