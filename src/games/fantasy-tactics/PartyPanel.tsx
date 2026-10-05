import { Battle } from './game';
import { Portrait } from './Portrait';

export function PartyPanel({battle,onUpdate}:{battle:Battle;onUpdate:()=>void}) {
  return <section className="ft-growth" aria-label="동료 영입과 출전 편성"><h2>원정대 편성 · 출전 4명</h2><p>대기 동료와 교체할 출전 동료를 선택하세요. 대기 동료도 승리 경험치를 받습니다.</p>
    {(['sera','kai'] as const).filter(id=>!battle.roster.some(u=>u.id===id)).map(id=><article key={id}><div><b>{id==='sera'?'세라 · 덫을 놓는 궁수':'카이 · 적의 뒤를 잡는 도적'}</b><p>{id==='sera'?'1장 이후 영입 가능':'2장 이후 영입 가능'}</p></div><button className="ft-secondary" disabled={battle.stage<(id==='sera'?0:1)} onClick={()=>{if(battle.recruit(id))onUpdate();}}>영입하기</button></article>)}
    {battle.roster.map(u=><article key={u.id}><Portrait role={u.role} promoted={u.promoted}/><div><b>{u.name} · Lv.{u.level}</b><p>{battle.allies.includes(u)?'출전 중':'대기 중'}</p></div>{battle.reserve.includes(u)&&<label>교체할 출전 동료<select aria-label={`${u.name}과 교체할 동료`} value="" onChange={e=>{if(battle.swapParty(e.target.value,u.id))onUpdate();}}><option value="" disabled>동료 선택</option>{battle.allies.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>}</article>)}
  </section>;
}
