import { useEffect, useRef } from 'react';
import { TACTICS } from '../game/constants';
import type { GameState, Officer } from '../game/types';
import { OfficerPortrait } from './OfficerPortrait';

export function OfficerDetails({officer,state,onClose}:{officer:Officer;state:GameState;onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  const stats=[['통솔',officer.lead],['무력',officer.war],['지력',officer.int],['정치',officer.pol],['매력',officer.cha]] as const;
  const duties={idle:'대기',internal:'내정 임무',marching:'출진 중',captured:'포로'};
  return <dialog ref={dialog} className="tk-officer-detail" aria-label={`${officer.name} 장수 상세`} onClick={e=>e.stopPropagation()} onCancel={e=>{e.preventDefault();onClose();}}>
    <header><span>武將列傳 · 장수 상세</span><button autoFocus onClick={onClose}>닫기</button></header>
    <div className="tk-officer-detail-body"><OfficerPortrait officer={officer} state={state} size={240}/><section><small>{state.factions[officer.faction??'']?.name??'재야'} · {state.cities[officer.cityId]?.name}</small><h2>{officer.name} <span>{officer.hanja}</span></h2><p>{duties[officer.duty]}</p><dl>{stats.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><h3>사용 가능한 전법</h3><div className="tk-detail-tactics">{officer.tactics.map(id=><span key={id} title={TACTICS[id].desc}>{TACTICS[id].label}</span>)}{!officer.tactics.length&&<p>능력치에 따라 전법이 열립니다.</p>}</div></section></div>
  </dialog>;
}
