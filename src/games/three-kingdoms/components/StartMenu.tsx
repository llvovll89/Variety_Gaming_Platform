import { useMemo, useState, type CSSProperties } from 'react';
import { FACTION_BLURBS, PLAYABLE_FACTIONS } from '../game/scenario';
import { SCENARIO_START } from '../game/constants';
import { loadGame } from '../game/save';
import { OFFICER_COUNT } from '../game/officers';
import { createGameState, citiesOf } from '../game/state';
import { OfficerPortrait } from './OfficerPortrait';
import { CampaignAtlas } from './CampaignAtlas';
import type { FactionId } from '../game/types';

interface Props {
  onStart: (factionId: FactionId) => void;
  onResume: () => void;
  onExit: () => void;
}

const DIFFICULTY: Record<FactionId, string> = {
  caocao: '입문 추천', liubei: '매우 어려움', lubu: '어려움', yuanshao: '보통',
  yuanshu: '보통', liubiao: '보통', lijue: '어려움',
};

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

  return <main className="tk-start" style={{ '--faction-color': faction.color } as CSSProperties}>
    <header className="tk-titlebar"><span>歷史戰略 · POWER UP KIT</span><button onClick={onExit}>← 게임 목록</button></header>
    <div className="tk-start-layout">
      <section className="tk-title-scene">
        <div className="tk-title-lockup"><span className="tk-seal-mark" aria-hidden="true">覇</span><div><p>군웅의 시대, 당신의 천하.</p><h1>三國志 <span>패업</span><small>PK</small></h1><span className="tk-title-sub">중원 쟁패 · {SCENARIO_START.year}년 6월</span></div></div>
        <div className="tk-scenario-heading"><span>01</span><div><h2>중원 쟁패</h2><p>동탁 이후, 다시 갈라진 천하</p></div><b>가상 시나리오</b></div>
        <div className="tk-atlas-frame"><CampaignAtlas state={state} selectedFaction={selected} onFaction={setSelected}/><div className="tk-atlas-caption"><span>中原勢力圖</span><span>성 이름을 눌러 세력을 선택하세요.</span></div></div>
        <p className="tk-scenario-story">조조와 여포가 연주를 놓고 맞서고, 유비는 서주를 물려받았다. 황하 너머 원소의 군세가 움직인다. 성을 다스리고 인재를 모아, 중원의 주인이 되어라.</p>
        <div className="tk-scenario-facts"><span><b>12</b> 도시</span><span><b>7</b> 세력</span><span><b>{OFFICER_COUNT}</b> 무장</span><span><b>10일</b> 순 단위 진행</span></div>
      </section>
      <section className="tk-faction-setup" aria-label="세력 선택">
        <div className="tk-section-heading"><span>出師表</span><h2>천하를 이끌 군주</h2><p>세력마다 출발 조건과 난이도가 다릅니다.</p></div>
        <div className="tk-faction-list">{PLAYABLE_FACTIONS.map(id => <button key={id} aria-pressed={selected===id} onClick={()=>setSelected(id)}><span className="tk-faction-emblem" style={{background:state.factions[id].color}}>{state.factions[id].hanja[0]}</span><strong>{state.factions[id].name}</strong><small>{DIFFICULTY[id]}</small><span className="tk-choice-mark" aria-hidden="true">{selected===id?'◆':'◇'}</span></button>)}</div>
        <div className="tk-lord-summary" aria-live="polite"><div className="tk-lord-heading">{leader&&<OfficerPortrait officer={leader} state={state} size={72}/>}<div><small>{DIFFICULTY[selected]}</small><h3>{faction.name} <span>{faction.hanja}</span></h3><p>{cities.map(c=>c.name).join(' · ')}의 군주</p></div></div><p className="tk-faction-blurb">{FACTION_BLURBS[selected]}</p><dl className="tk-start-resources"><div><dt>병력</dt><dd>{total('troops')}</dd></div><div><dt>금</dt><dd>{total('gold')}</dd></div><div><dt>병량</dt><dd>{total('food')}</dd></div></dl><div className="tk-start-generals"><span>주요 무장 · 전체 {officers.length}명</span><div>{generals.map(o=><div key={o.id}><OfficerPortrait officer={o} state={state} size={36}/><span>{o.name}</span></div>)}</div></div></div>
        <button className="tk-campaign-start" onClick={()=>onStart(selected)}><span>{faction.name}로 천하에 나서다</span><span aria-hidden="true">→</span></button>
        {saved&&<button className="tk-resume" onClick={onResume}><strong>저장된 국면 이어하기</strong><span>{saved.factions[saved.playerFactionId]?.name} · {saved.year}년 {saved.month}월</span></button>}
        <p className="tk-start-note">여러 시대의 영웅이 함께하는 가상 시나리오입니다.<br/>장수·신장수 편집은 게임 내 PK 메뉴에서 이용할 수 있습니다.</p>
      </section>
    </div>
    <footer className="tk-start-footer"><span>삼국지 패업 · POWER UP KIT</span><span>도시를 다스리고, 전장을 지휘하라.</span></footer>
  </main>;
}
