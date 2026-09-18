/**
 * Unit commands: 출진, 이동, 귀환, and razing.
 *
 * Player clicks and AI decisions both come through here. That is deliberate — if the AI had
 * its own movement code the two would drift, and the AI would end up playing a slightly
 * different game from the one on screen.
 *
 * Unit moves apply IMMEDIATELY rather than being queued. Reacting to what just happened is
 * the tactical layer; an order queue would need a ghost renderer, conflict resolution and an
 * undo affordance, and the AI would still have to execute immediately anyway.
 */
import { hexEquals, hexKey, type HexCoord } from "./hex";
import { BALANCE, UNIT_TYPES } from "./constants";
import { tileAt } from "./map";
import { pathFrom, reachable } from "./pathfinding";
import type { GameEvent } from "./events";
import type {
  CityId, FacilityType, GameState, OfficerId, Unit, UnitId, UnitType,
} from "./types";

export interface CommandResult {
  ok: boolean;
  reason?: string;
  events?: GameEvent[];
}

const OK: CommandResult = { ok: true };

export function unitFoodCapacity(troops: number): number {
  return Math.round((troops / 100) * BALANCE.supplyMonths);
}

export function dispatchCost(troops: number): { gold: number; food: number } {
  return {
    gold: Math.round(troops * BALANCE.dispatchGoldPerTroop),
    food: unitFoodCapacity(troops),
  };
}

/** Where a new unit from this city can stand: the city hex itself, else an adjacent one. */
export function dispatchSpot(state: GameState, cityId: CityId): HexCoord | null {
  const city = state.cities[cityId];
  if (!city) return null;
  const home = tileAt(state.map, city.coord);
  if (home && home.unitId == null) return city.coord;
  // Fall back to any free adjacent land tile — a besieged city can still sortie sideways.
  for (const n of neighborsOf(city.coord)) {
    const tile = tileAt(state.map, n);
    if (!tile || tile.unitId != null || tile.cityId) continue;
    if (tile.terrain === "water") continue;
    return n;
  }
  return null;
}

function neighborsOf(h: HexCoord): HexCoord[] {
  return [
    { q: h.q + 1, r: h.r }, { q: h.q + 1, r: h.r - 1 }, { q: h.q, r: h.r - 1 },
    { q: h.q - 1, r: h.r }, { q: h.q - 1, r: h.r + 1 }, { q: h.q, r: h.r + 1 },
  ];
}

export interface DispatchRequest {
  cityId: CityId;
  officerIds: OfficerId[];
  type: UnitType;
  troops: number;
}

export function validateDispatch(state: GameState, req: DispatchRequest): CommandResult {
  const city = state.cities[req.cityId];
  if (!city) return { ok: false, reason: "도시가 없습니다." };
  if (!city.faction) return { ok: false, reason: "무소속 도시는 출진할 수 없습니다." };
  if (req.officerIds.length < 1 || req.officerIds.length > 3) {
    return { ok: false, reason: "무장은 1~3명까지 편성합니다." };
  }
  for (const id of req.officerIds) {
    const officer = state.officers[id];
    if (!officer) return { ok: false, reason: "없는 무장입니다." };
    if (officer.cityId !== req.cityId) return { ok: false, reason: "이 도시의 무장이 아닙니다." };
    if (officer.duty !== "idle") return { ok: false, reason: "이미 다른 일을 맡은 무장입니다." };
  }
  if (req.troops < 1000) return { ok: false, reason: "1,000명 미만으로는 출진할 수 없습니다." };
  if (req.troops > city.troops) return { ok: false, reason: "병사가 모자랍니다." };

  const cost = dispatchCost(req.troops);
  if (cost.gold > city.gold) return { ok: false, reason: "금이 모자랍니다." };
  if (cost.food > city.food) return { ok: false, reason: "병량이 모자랍니다." };
  if (!dispatchSpot(state, req.cityId)) return { ok: false, reason: "부대를 세울 자리가 없습니다." };
  return OK;
}

/**
 * Form a field army. It marches out with half its movement already spent, so a 출진 cannot
 * double as a full-speed surprise attack in the same month.
 */
export function dispatch(state: GameState, req: DispatchRequest): CommandResult {
  const check = validateDispatch(state, req);
  if (!check.ok) return check;

  const city = state.cities[req.cityId]!;
  const spot = dispatchSpot(state, req.cityId)!;
  const cost = dispatchCost(req.troops);
  const spec = UNIT_TYPES[req.type];

  city.troops -= req.troops;
  city.gold -= cost.gold;
  city.food -= cost.food;

  const id: UnitId = state.nextUnitId++;
  const unit: Unit = {
    id,
    faction: city.faction!,
    coord: spot,
    type: req.type,
    troops: req.troops,
    maxTroops: req.troops,
    // A well-policed city sends out a confident army; a lawless one sends out a mob.
    morale: Math.round(Math.min(100, BALANCE.moraleBase + city.order * 0.3)),
    energy: 100,
    food: cost.food,
    officerIds: [...req.officerIds],
    homeCityId: city.id,
    movesLeft: Math.floor(spec.moves / 2),
    hasActed: false,
    status: { confused: 0, slowed: 0, fired: 0 },
    unsuppliedTurns: 0,
  };

  state.units[id] = unit;
  tileAt(state.map, spot)!.unitId = id;
  for (const officerId of req.officerIds) {
    const officer = state.officers[officerId];
    officer.duty = "marching";
    officer.unitId = id;
  }
  return OK;
}

/** Move along the cheapest path to `target`, spending movement points. */
export function moveUnit(state: GameState, unitId: UnitId, target: HexCoord): CommandResult {
  const unit = state.units[unitId];
  if (!unit) return { ok: false, reason: "부대가 없습니다." };
  if (unit.status.confused > 0) return { ok: false, reason: "혼란에 빠져 움직일 수 없습니다." };
  if (hexEquals(unit.coord, target)) return { ok: false, reason: "이미 그 자리입니다." };

  const reach = reachable(state, unit);
  const entry = reach.get(hexKey(target));
  if (!entry) return { ok: false, reason: "이번 순에는 거기까지 갈 수 없습니다." };
  const path = pathFrom(reach, target);
  if (!path || path.length === 0) return { ok: false, reason: "길이 없습니다." };

  const startMoves = unit.movesLeft;
  const events: GameEvent[] = [];

  tileAt(state.map, unit.coord)!.unitId = null;
  unit.coord = target;
  tileAt(state.map, target)!.unitId = unitId;
  unit.movesLeft = Math.max(0, unit.movesLeft - entry.cost);

  // Razing: an enemy facility under your feet is destroyed outright, and doing it costs the
  // rest of the month. This one rule is what makes where you build a tactical decision.
  const razed = razeAlong(state, unit, path);
  if (razed) {
    unit.movesLeft = 0;
    events.push(razed);
  }

  // A forced march tires the troops.
  const spec = UNIT_TYPES[unit.type];
  if (startMoves - unit.movesLeft > spec.moves * 0.8) {
    unit.energy = Math.max(0, unit.energy - BALANCE.energyForcedMarch);
  }

  return { ok: true, events };
}

function razeAlong(state: GameState, unit: Unit, path: HexCoord[]): GameEvent | null {
  const here = path[path.length - 1];
  const tile = tileAt(state.map, here);
  const facility = tile?.facility;
  if (!tile || !facility || facility.faction === unit.faction) return null;
  const type: FacilityType = facility.type;
  const ownerCity = facility.ownerCity;
  // Free the builder if the work was still in progress.
  if (facility.builderId) {
    const officer = state.officers[facility.builderId];
    if (officer && officer.duty === "internal") officer.duty = "idle";
  }
  tile.facility = null;
  return { kind: "raze", cityId: ownerCity, at: here, facility: type, by: unit.faction };
}

/** Fold a unit back into a friendly city: troops, grain and officers all come home. */
export function returnToCity(state: GameState, unitId: UnitId): CommandResult {
  const unit = state.units[unitId];
  if (!unit) return { ok: false, reason: "부대가 없습니다." };
  const tile = tileAt(state.map, unit.coord);
  const city = tile?.cityId ? state.cities[tile.cityId] : null;
  if (!city || city.faction !== unit.faction) {
    return { ok: false, reason: "아군 도시 위에서만 귀환할 수 있습니다." };
  }
  absorbUnit(state, unit, city.id);
  return OK;
}

/** Merge a unit into a city and remove it from the board. Shared by 귀환, rout and retreat. */
export function absorbUnit(state: GameState, unit: Unit, cityId: CityId): void {
  const city = state.cities[cityId];
  const tile = tileAt(state.map, unit.coord);
  if (tile?.unitId === unit.id) tile.unitId = null;
  if (city) {
    city.troops = Math.min(city.maxTroops * 2, city.troops + unit.troops);
    city.food += unit.food;
  }
  for (const officerId of unit.officerIds) {
    const officer = state.officers[officerId];
    if (!officer) continue;
    officer.duty = "idle";
    officer.unitId = null;
    if (city) officer.cityId = city.id;
  }
  delete state.units[unit.id];
}

/** Remove a unit entirely — used when it is wiped out rather than absorbed. */
export function destroyUnit(state: GameState, unit: Unit): void {
  const tile = tileAt(state.map, unit.coord);
  if (tile?.unitId === unit.id) tile.unitId = null;
  for (const officerId of unit.officerIds) {
    const officer = state.officers[officerId];
    if (officer) officer.unitId = null;
  }
  delete state.units[unit.id];
}
