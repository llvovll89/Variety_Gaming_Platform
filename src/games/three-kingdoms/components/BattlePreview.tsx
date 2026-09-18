import { useEffect, useRef } from 'react';
import { resolveAttack } from '../game/combat';
import { TACTICS } from '../game/constants';
import type { GameEngine } from '../game/engine';
import { tileAt } from '../game/map';
import type { UISnapshot } from '../game/types';

export function BattlePreview({ engine, snapshot }: { engine: GameEngine; snapshot: UISnapshot }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const target = engine.pendingAttack(), state = engine.getState();
  if (!target || snapshot.selected.kind !== 'unit') return null;
  const attacker = state.units[snapshot.selected.unitId];
  if (!attacker) return null;
  const tile = tileAt(state.map, target);
  const defender = tile?.unitId != null ? state.units[tile.unitId] : null;
  const city = tile?.cityId ? state.cities[tile.cityId] : null;
  // Simulate on a clone so preview never spends actions or advances the live RNG.
  const simulated = structuredClone(state);
  const outcome = resolveAttack(simulated, simulated.units[attacker.id], target, snapshot.pendingTactic ?? undefined);
  const battles = outcome.events.filter(e => e.kind === 'battle' || e.kind === 'siege');
  const dealt = battles.reduce((n, e) => n + e.dealt, 0), taken = battles.reduce((n, e) => n + e.taken, 0);
  const displaced = outcome.events.some(e => e.kind === 'move');
  return <dialog ref={dialog} className="tk-battle-dialog" onCancel={e => { e.preventDefault(); engine.cancelAttack(); }}>
    <small>전투 명령 확인</small><h2>{state.officers[attacker.officerIds[0]]?.name} → {defender ? state.officers[defender.officerIds[0]]?.name : city?.name}</h2>
    <h3>{snapshot.pendingTactic ? TACTICS[snapshot.pendingTactic].label : '일반 공격'}</h3>
    <div className="tk-battle-numbers"><span>{city ? '성벽 / 수비 피해' : '적 병력 피해'}<strong>{dealt.toLocaleString()}</strong></span><span>아군 피해<strong>{taken.toLocaleString()}</strong></span></div>
    <p>{snapshot.pendingTactic ? TACTICS[snapshot.pendingTactic].desc : '공격 후 이번 턴의 행동과 이동이 종료됩니다.'}</p>
    {displaced && <p>적 부대가 뒤쪽 한 칸으로 밀려납니다.</p>}
    <footer><button onClick={() => engine.cancelAttack()}>취소</button><button onClick={() => engine.confirmAttack(true)}>즉시 결과</button><button className="tk-primary" onClick={() => engine.confirmAttack()}>전투 보기</button></footer>
  </dialog>;
}
