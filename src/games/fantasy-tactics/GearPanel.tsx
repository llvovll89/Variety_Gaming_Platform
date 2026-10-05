import { useState } from 'react';
import { Battle } from './game';
import { EQUIPMENT, GEAR, SLOTS, SLOT_LABEL, type Slot } from './equipment';
import { Portrait } from './Portrait';
import './gear.css';

export function GearPanel({ battle, onUpdate }: { battle: Battle; onUpdate: () => void }) {
  const [owner,setOwner]=useState('arin'),[slot,setSlot]=useState<Slot>('weapon');
  const u=battle.roster.find(v=>v.id===owner)!, current=battle.loadouts[owner]?.[slot], stats=battle.stats(u), editable=battle.phase==='camp';
  const compatible=EQUIPMENT.filter(g=>battle.inventory.includes(g.id)&&g.slot===slot&&g.roles.includes(u.role));
  const rows: {label:string;key:'attack'|'defense'|'move'|'mpDiscount'|'healing'|'dash'}[]=[{label:'공격',key:'attack'},{label:'방어',key:'defense'},{label:'이동',key:'move'},{label:'MP 절약',key:'mpDiscount'},{label:'치유 보너스',key:'healing'},{label:'돌진 보너스',key:'dash'}];
  const candidates=[null,...compatible.map(g=>g.id)];
  return <section className="ft-gear" aria-label="원정대 장비">
    <h2>원정대 장비 <small>수집 {battle.inventory.length} / 24</small></h2>
    <p className="ft-gear-rule">{editable?'장착은 캠프에서 가능합니다. 같은 장비는 한 명만 사용할 수 있습니다.':'보유 장비를 확인할 수 있습니다. 장착 변경은 캠프에서 하세요.'}</p>
    <nav className="ft-gear-party" aria-label="장비를 확인할 동료">{battle.roster.map(v=><button key={v.id} aria-pressed={owner===v.id} onClick={()=>setOwner(v.id)}><Portrait role={v.role} promoted={v.promoted}/><span>{v.name}</span></button>)}</nav>
    <div className="ft-gear-slots">{SLOTS.map(s=><button key={s} aria-pressed={slot===s} onClick={()=>setSlot(s)}><span>{SLOT_LABEL[s]}</span><b>{battle.loadouts[owner]?.[s]?GEAR[battle.loadouts[owner][s]!].name:'장착 없음'}</b></button>)}</div>
    <div className="ft-gear-statline">{rows.filter(r=>stats[r.key]!==0||['attack','defense','move'].includes(r.key)).map(r=><span key={r.key}>{r.label} <b>{stats[r.key]}</b></span>)}</div>
    <div className="ft-gear-list">{candidates.map(id=>{
      const gear=id?GEAR[id]:null, used=id?Object.entries(battle.loadouts).find(([who,slots])=>who!==owner&&Object.values(slots).includes(id))?.[0]:undefined;
      const after=battle.stats(u,{...battle.loadouts[owner],[slot]:id??undefined}), diffs=rows.filter(r=>stats[r.key]!==after[r.key]);
      return <div className={`ft-gear-row ${id===current?'is-equipped':''}`} key={id??'none'}>
        <div><b>{gear?.name??'장착 해제'}{id===current&&<small> · 장착 중</small>}</b><p>{gear?.description??'이 슬롯의 장비를 가방으로 돌려보냅니다.'}</p>
          <span className="ft-gear-comparison">{diffs.length?diffs.map(r=><span key={r.key} className={after[r.key]>stats[r.key]?'is-up':'is-down'}>{r.label} {stats[r.key]} → {after[r.key]}</span>):'능력치 변화 없음'}</span></div>
        <button disabled={!editable||!!used||id===(current??null)} onClick={()=>{if(battle.equip(owner,slot,id))onUpdate();}}>{used?`${battle.roster.find(v=>v.id===used)?.name} 사용 중`:id===current?'장착 중':id?'장착':'해제'}</button>
      </div>;
    })}</div>
    <details className="ft-gear-catalog"><summary>전체 장비 도감 · 24종</summary>{EQUIPMENT.map(g=><p key={g.id}><span>{battle.inventory.includes(g.id)?'◆':'◇'} {g.name}</span><small>{SLOT_LABEL[g.slot]} · {g.description}{!battle.inventory.includes(g.id)&&' · 미획득'}</small></p>)}</details>
  </section>;
}
