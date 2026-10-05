import { Battle, key, type Mode, type Point } from './game';

const actions: {mode:Mode;name:string;description:string}[] = [
  {mode:'cut',name:'다리 끊기',description:'빈 낡은 다리 옆에서 사용 · 남쪽 우회로 유지'},
  {mode:'push',name:'밀어내기',description:'인접 적을 한 칸 밀기 · 물에 추락하면 격파 · 보스 면역'},
  {mode:'ignite',name:'불붙이기',description:'3칸 내 풀밭 · 차례 종료마다 8 피해, 2회 · 아군도 피해'},
];
export function TerrainPanel({battle,mode,locked,onMode,onTarget,onHover}:{battle:Battle;mode:Mode;locked:boolean;onMode:(m:Mode)=>void;onTarget:(p:Point)=>void;onHover:(p:Point|null)=>void}) {
  const selected=actions.find(a=>a.mode===mode), targets=selected?battle.targets(mode):[];
  return <section className="ft-terrain-panel" aria-label="지형 전술" inert={locked}>
    <div className="ft-terrain-heading"><b>2부 · 지형 전술</b><span>각 행동은 이동 후 행동 1회를 사용해요.</span></div>
    <div className="ft-terrain-actions">{actions.map(a=><button key={a.mode} aria-pressed={mode===a.mode} disabled={!battle.canAct()||locked||!battle.targets(a.mode).length} onClick={()=>onMode(a.mode)}>{a.name}<small>{a.description}</small></button>)}</div>
    <p role="status">{selected?selected.description:'다리를 끊어 우회시키고, 적을 밀거나 불길로 이동을 유도하세요. 리아의 불꽃별·초신성도 풀밭에 불을 붙여요.'}</p>
    {selected&&<div className="ft-terrain-targets" aria-label={`${selected.name} 대상`}>{targets.length?targets.map(p=><button key={key(p)} disabled={!battle.canAct()||locked} onClick={()=>onTarget(p)} onMouseEnter={()=>onHover(p)} onMouseLeave={()=>onHover(null)}>{battle.at(p)?.name??`${p.x+1}열 ${p.y+1}행`}<small>{battle.preview(p,mode)}</small></button>):<span>사용할 수 있는 대상이 없어요. 먼저 가까이 이동하세요.</span>}</div>}
  </section>;
}
