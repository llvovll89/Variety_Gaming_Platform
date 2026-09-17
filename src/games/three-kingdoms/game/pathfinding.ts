/**
 * Movement over the hex grid: reachable sets and shortest paths, both Dijkstra over
 * movement points.
 *
 * Two rules do most of the tactical work here.
 *
 * ZOC (제압): leaving a hex adjacent to an enemy costs 4 extra movement points. Without it
 * two armies simply walk past each other and a 12-MP cavalry stack strolls into an empty
 * capital; with it, a screening force actually screens.
 *
 * Occupancy: one unit per hex, and an enemy hex is never passable. Enemy CITY hexes are not
 * passable either — you reduce the wall and then enter, you do not march through the gate.
 */
import { hexKey, hexNeighbors, type HexCoord } from "./hex";
import { BALANCE, TERRAIN_MOVE_COST } from "./constants";
import { tileAt } from "./map";
import { UNIT_TYPES } from "./constants";
import type { FactionId, GameState, Unit } from "./types";

export interface ReachEntry {
  hex: HexCoord;
  cost: number;
  /** Key of the previous hex on the cheapest path, or null for the origin. */
  from: string | null;
}

export type ReachMap = Map<string, ReachEntry>;

/** Can this faction's unit stand on that tile at all, ignoring movement cost? */
export function isPassable(state: GameState, hex: HexCoord, factionId: FactionId): boolean {
  const tile = tileAt(state.map, hex);
  if (!tile) return false;
  if (!Number.isFinite(TERRAIN_MOVE_COST[tile.terrain])) return false;
  // Any occupied hex blocks: friendly stacks do not merge, enemies must be fought.
  if (tile.unitId != null) return false;
  // A city hex is only enterable when it is already yours.
  if (tile.cityId) {
    const city = state.cities[tile.cityId];
    if (!city || city.faction !== factionId) return false;
  }
  return true;
}

function isAdjacentToEnemy(state: GameState, hex: HexCoord, factionId: FactionId): boolean {
  for (const n of hexNeighbors(hex)) {
    const tile = tileAt(state.map, n);
    if (tile?.unitId == null) continue;
    const other = state.units[tile.unitId];
    if (other && other.faction !== factionId) return true;
  }
  return false;
}

/**
 * Every hex the unit can reach with the movement it has left, keyed by hexKey.
 * The origin is always present at cost 0.
 */
export function reachable(state: GameState, unit: Unit, budget = unit.movesLeft): ReachMap {
  const start = hexKey(unit.coord);
  const best: ReachMap = new Map([[start, { hex: unit.coord, cost: 0, from: null }]]);

  // Small frontier; a binary heap would be overkill for a 12-MP radius on this board.
  const frontier: string[] = [start];
  while (frontier.length > 0) {
    let pick = 0;
    for (let i = 1; i < frontier.length; i++) {
      if (best.get(frontier[i])!.cost < best.get(frontier[pick])!.cost) pick = i;
    }
    const key = frontier.splice(pick, 1)[0];
    const current = best.get(key)!;

    // Leaving a hex under enemy control costs extra, so this is charged on exit.
    const exitPenalty = isAdjacentToEnemy(state, current.hex, unit.faction)
      ? BALANCE.zocPenalty
      : 0;

    for (const next of hexNeighbors(current.hex)) {
      if (!isPassable(state, next, unit.faction)) continue;
      const tile = tileAt(state.map, next)!;
      const cost = current.cost + TERRAIN_MOVE_COST[tile.terrain] + exitPenalty;
      if (cost > budget) continue;
      const nextKey = hexKey(next);
      const known = best.get(nextKey);
      if (known && known.cost <= cost) continue;
      best.set(nextKey, { hex: next, cost, from: key });
      if (!frontier.includes(nextKey)) frontier.push(nextKey);
    }
  }
  return best;
}

/** Walk the reach map backwards into a path from origin to target, origin excluded. */
export function pathFrom(reach: ReachMap, target: HexCoord): HexCoord[] | null {
  const entry = reach.get(hexKey(target));
  if (!entry) return null;
  const path: HexCoord[] = [];
  let cursor: ReachEntry | undefined = entry;
  while (cursor && cursor.from !== null) {
    path.push(cursor.hex);
    cursor = reach.get(cursor.from);
  }
  return path.reverse();
}

/** Cost for this unit to step onto `target` this turn, or null if out of reach. */
export function costTo(state: GameState, unit: Unit, target: HexCoord): number | null {
  return reachable(state, unit).get(hexKey(target))?.cost ?? null;
}

/**
 * Long-range path for the AI, ignoring the movement budget. Used to pick a direction to
 * march over several turns, not to validate a single move.
 */
export function routeTo(
  state: GameState,
  unit: Unit,
  target: HexCoord,
  maxCost = 400,
): HexCoord[] | null {
  const reach = reachable(state, unit, maxCost);
  const direct = pathFrom(reach, target);
  if (direct) return direct;

  // The target itself may be blocked (an enemy city, or an occupied hex). Settle for the
  // cheapest hex adjacent to it, which is exactly where a besieger wants to stand anyway.
  let best: { cost: number; hex: HexCoord } | null = null;
  for (const n of hexNeighbors(target)) {
    const entry = reach.get(hexKey(n));
    if (!entry) continue;
    if (!best || entry.cost < best.cost) best = { cost: entry.cost, hex: entry.hex };
  }
  return best ? pathFrom(reach, best.hex) : null;
}

/** Enemy units and enemy cities this unit could strike from where it stands. */
export function attackTargets(state: GameState, unit: Unit): HexCoord[] {
  const range = UNIT_TYPES[unit.type].range;
  const out: HexCoord[] = [];
  const seen = new Set<string>();
  const frontier: { hex: HexCoord; dist: number }[] = [{ hex: unit.coord, dist: 0 }];
  seen.add(hexKey(unit.coord));

  while (frontier.length > 0) {
    const { hex, dist } = frontier.shift()!;
    if (dist >= range) continue;
    for (const n of hexNeighbors(hex)) {
      const key = hexKey(n);
      if (seen.has(key)) continue;
      seen.add(key);
      const tile = tileAt(state.map, n);
      if (!tile) continue;

      let hostile = false;
      if (tile.unitId != null) {
        const other = state.units[tile.unitId];
        hostile = Boolean(other && other.faction !== unit.faction);
      } else if (tile.cityId) {
        const city = state.cities[tile.cityId];
        hostile = Boolean(city && city.faction !== unit.faction);
      }
      if (hostile) out.push(n);
      // Archers shoot over intervening terrain, so keep expanding regardless.
      frontier.push({ hex: n, dist: dist + 1 });
    }
  }
  return out;
}
