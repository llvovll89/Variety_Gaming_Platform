import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, MapTrifoldIcon } from '@phosphor-icons/react';
import { FACTION_BLURBS, PLAYABLE_FACTIONS } from '../game/scenario';
import { SCENARIO_START } from '../game/constants';
import { loadGame } from '../game/save';
import { OFFICER_COUNT } from '../game/officers';
import { createGameState, citiesOf } from '../game/state';
import { OfficerPortrait } from './OfficerPortrait';
import { CampaignAtlas } from './CampaignAtlas';
import type { FactionId } from '../game/types';
interface Props { onStart: (factionId: FactionId) => void; onResume: () => void; onExit: () => void }
const DIFFICULTY: Record<FactionId, string> = { caocao: '입문 추천', liubei: '매우 어려움', lubu: '어려움', yuanshao: '보통', yuanshu: '보통', liubiao: '보통', lijue: '어려움' };
export function StartMenu({ onStart, onResume, onExit }: Props) {
  const [selected, setSelected] = useState<FactionId>('caocao');
  const state = useMemo(() => createGameState('caocao', 194), []);
  const saved = useMemo(() => loadGame(), []);
  const faction = state.factions[selected];
  const cities = citiesOf(state, selected);
  const officers = Object.values(state.officers).filter(o => o.faction === selected);
  const leader = state.officers[faction.leaderId];
  const generals = [...officers].sort((a,b) => Math.max(b.war,b.int,b.pol)-Math.max(a.war,a.int,a.pol)).filter(o => o.id !== leader?.id).slice(0,5);
  const total = (field: 'troops' | 'gold' | 'food') => cities.reduce((sum,c) => sum+c[field],0).toLocaleString();
  return <main className="tk-start tk-pk-menu" style={{ '--faction-color': faction.color } as CSSProperties}>
    <div className="tk-menu-art" aria-hidden="true"/>
    <header className="tk-titlebar"><span className="tk-wordmark">三國志 <b>패업</b><small>PK</small></span><button onClick={onExit}><ArrowLeftIcon size={16} aria-hidden="true"/>게임 목록</button></header>
    <div className="tk-start-layout">
      <section className="tk-title-scene"><div className="tk-title-lockup"><p>{SCENARIO_START.year}년 6월, 중원 쟁패</p><h1>三國志<span>패업 <small>PK</small></span></h1><p className="tk-title-description">성을 다스리고, 인재를 모으고.<br/>갈라진 천하를 당신의 깃발 아래.</p></div>
        <div className="tk-scenario-dossier"><div><h2>중원 쟁패</h2><span>가상 시나리오</span></div><p>조조와 여포가 연주를 놓고 맞선다.<br/>황하 너머 원소의 군세가 움직이기 시작했다.</p><div className="tk-scenario-facts"><span><b>12</b> 도시</span><span><b>7</b> 세력</span><span><b>{OFFICER_COUNT}</b> 무장</span></div><details className="tk-scenario-atlas"><summary><MapTrifoldIcon size={18} aria-hidden="true"/>세력 지도 펼치기</summary><CampaignAtlas state={state} selectedFaction={selected} onFaction={setSelected}/></details></div>
      </section>
      <section className="tk-faction-setup" aria-label="세력 선택"><div className="tk-section-heading"><h2>천하를 이끌 군주</h2><p>당신의 첫 깃발을 선택하세요.</p></div>
        <div className="tk-faction-list">{PLAYABLE_FACTIONS.map(id => { const lord = state.officers[state.factions[id].leaderId]; return <button key={id} aria-pressed={selected===id} onClick={()=>setSelected(id)}>{lord && <OfficerPortrait officer={lord} state={state} size={42}/>}<span><strong>{state.factions[id].name}</strong><small>{DIFFICULTY[id]}</small></span>{selected===id && <CheckIcon className="tk-choice-mark" size={16} aria-hidden="true"/>}</button>; })}</div>
        <div className="tk-lord-summary" aria-live="polite"><div className="tk-lord-heading">{leader&&<OfficerPortrait officer={leader} state={state} size={80}/>}<div><small>{DIFFICULTY[selected]}</small><h3>{faction.name} <span>{faction.hanja}</span></h3><p>{cities.map(c=>c.name).join(' · ')}의 군주</p></div></div><p className="tk-faction-blurb">{FACTION_BLURBS[selected]}</p><dl className="tk-start-resources"><div><dt>병력</dt><dd>{total('troops')}</dd></div><div><dt>금</dt><dd>{total('gold')}</dd></div><div><dt>병량</dt><dd>{total('food')}</dd></div></dl><div className="tk-start-generals"><span>주요 무장 <small>전체 {officers.length}명</small></span><div>{generals.map(o=><div key={o.id}><OfficerPortrait officer={o} state={state} size={40}/><span>{o.name}</span></div>)}</div></div></div>
        <button className="tk-campaign-start" onClick={()=>onStart(selected)}><span>{faction.name}로 천하에 나서다</span><ArrowRightIcon size={20} aria-hidden="true"/></button>
        {saved&&<button className="tk-resume" onClick={onResume}><strong>저장된 국면 이어하기</strong><span>{saved.factions[saved.playerFactionId]?.name} · {saved.year}년 {saved.month}월</span></button>}
        <p className="tk-start-note">10일마다 내정과 전장이 함께 움직입니다.<br/>장수·신장수 편집은 게임 내 PK 메뉴에서 이용하세요.</p>
      </section>
    </div>
  </main>;
}
