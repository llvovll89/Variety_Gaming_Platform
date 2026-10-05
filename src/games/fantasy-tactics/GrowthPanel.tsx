import { Battle } from './game';
import { HIDDEN_LEVEL, JOBS, jobName, PROMOTION_LEVEL } from './progression';
import { Portrait } from './Portrait';

export function GrowthPanel({ battle, onUpdate }: { battle: Battle; onUpdate: () => void }) {
  return <section className="ft-growth" aria-label="전직과 히든스킬"><h2>별빛으로 성장하기</h2><p>Lv.{PROMOTION_LEVEL} 전직 · 첫 기술 강화 선택 · Lv.{HIDDEN_LEVEL} 히든스킬</p>
    {battle.roster.map(u => <article key={u.id}><Portrait role={u.role} promoted={u.promoted}/><div><b>{u.name} · Lv.{u.level} · {jobName(u)}</b><p>{u.promoted ? `전직 완료 · ${u.training==='power'?'위력 강화':'사거리·관통 강화'}` : `Lv.3 → ${JOBS[u.role]?.promoted}`}</p><small>{u.promoted&&u.level>=HIDDEN_LEVEL?'해금 완료':'Lv.5 전직 후 해금'} · {JOBS[u.role]?.hidden.name}</small></div>
      {!u.promoted && <div className="ft-growth-actions">{(['power','reach'] as const).map(choice => <button key={choice} className="ft-secondary" disabled={u.level<PROMOTION_LEVEL} onClick={()=>{if(battle.promote(u.id,choice))onUpdate();}}>{choice==='power'?'위력 강화로 전직':'사거리·관통 강화로 전직'}</button>)}</div>}
    </article>)}
  </section>;
}
