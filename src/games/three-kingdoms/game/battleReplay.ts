import type { City, GameState, Officer, TacticId, Unit } from './types';
import type { GameEvent } from './events';

export interface BattleSide {
  name: string;
  faction: string | null;
  officer: Officer | null;
  type: Unit['type'] | 'city';
  before: number;
  after: number;
  wallBefore?: number;
  wallAfter?: number;
}
export interface BattleReplay {
  attacker: BattleSide;
  defender: BattleSide;
  tactic?: TacticId;
  displaced: boolean;
  tacticLanded: boolean | null;
}
export function battleSide(state: GameState, unit: Unit | null, city: City | null): BattleSide {
  const officer = unit ? state.officers[unit.officerIds[0]] : city ? state.officers[city.officerIds[0]] : null;
  return {
    name: unit ? officer?.name ?? '부대' : city?.name ?? '수비군',
    faction: unit?.faction ?? city?.faction ?? null,
    officer: officer ? structuredClone(officer) : null,
    type: unit?.type ?? 'city', before: unit?.troops ?? city?.troops ?? 0, after: unit?.troops ?? city?.troops ?? 0,
    wallBefore: city?.defense, wallAfter: city?.defense,
  };
}
export function finishBattleReplay(report: BattleReplay, state: GameState, attackerId: number, defenderId: number | null, cityId: string | null, events: GameEvent[]): BattleReplay {
  report.attacker.after = state.units[attackerId]?.troops ?? 0;
  report.defender.after = defenderId !== null ? state.units[defenderId]?.troops ?? 0 : cityId ? state.cities[cityId].troops : 0;
  if (cityId) report.defender.wallAfter = state.cities[cityId].defense;
  report.displaced = events.some(e => e.kind === 'move');
  const tactic = events.find(e => e.kind === 'tactic');
  report.tacticLanded = tactic?.kind === 'tactic' ? tactic.landed : null;
  return report;
}
