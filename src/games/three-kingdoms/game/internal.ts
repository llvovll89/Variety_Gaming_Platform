/**
 * 내정 — the monthly city economy.
 *
 * Orders are QUEUED, not applied on click. That month boundary is the whole reason internal
 * affairs is a resource-allocation puzzle instead of a click-to-increment button: assigning
 * an officer costs you that officer for the month, and gold is debited up front so the
 * trade-off is visible while you are still deciding.
 *
 * Every function here mutates GameState in place. The rules layer is deliberately imperative
 * and deterministic rather than persistent — what makes it testable is that it is DOM-free
 * and seeded, not that it copies objects.
 */
import {
  BALANCE,
  DEV_CAP_BY_SCALE,
  DEV_CAP_PER_FACILITY,
  FACILITY_SLOTS,
  FACILITIES,
  HARVEST_MONTH,
} from "./constants";
import { tileAt } from "./map";
import { idleOfficers } from "./state";
import type { GameEvent } from "./events";
import type {
  City, CityId, FacilityType, GameState, InternalKind, InternalOrder, Officer, OfficerId,
} from "./types";
import { hexDistance, type HexCoord } from "./hex";

/** Lead officer dominates; deputies help at 60%. Mirrors how combat weights a 부장. */
function weighted(officers: Officer[], stat: (o: Officer) => number): number {
  if (officers.length === 0) return 0;
  const values = officers.map(stat).sort((a, b) => b - a);
  return values[0] + values.slice(1).reduce((sum, v) => sum + v * 0.6, 0);
}

export function developmentCap(state: GameState, city: City, kind: "commerce" | "agriculture"): number {
  const wanted: FacilityType = kind === "commerce" ? "market" : "farm";
  let bonus = 0;
  for (const tile of state.map.tiles) {
    if (tile.domainOf !== city.id) continue;
    const f = tile.facility;
    if (f && f.buildTurnsLeft === 0 && f.type === wanted) bonus += DEV_CAP_PER_FACILITY;
  }
  return DEV_CAP_BY_SCALE[city.scale] + bonus;
}

/** Facilities standing or under construction in this city's 영역. */
export function facilityCount(state: GameState, cityId: CityId): number {
  let n = 0;
  for (const tile of state.map.tiles) {
    if (tile.domainOf === cityId && tile.facility) n++;
  }
  return n;
}

/** Every tile in the domain where this facility could legally go right now. */
export function buildableTiles(
  state: GameState,
  cityId: CityId,
  type: FacilityType,
): HexCoord[] {
  if (facilityCount(state, cityId) >= FACILITY_SLOTS) return [];
  const out: HexCoord[] = [];
  for (const tile of state.map.tiles) {
    if (tile.domainOf !== cityId || tile.cityId || tile.facility) continue;
    if (!FACILITIES[type].terrain.includes(tile.terrain)) continue;
    out.push({ q: tile.q, r: tile.r });
  }
  return out;
}

export function barracksBonus(state: GameState, city: City): number {
  let bonus = 0;
  for (const tile of state.map.tiles) {
    if (tile.domainOf !== city.id) continue;
    const f = tile.facility;
    if (f && f.buildTurnsLeft === 0 && f.type === "barracks") bonus += 500;
  }
  return bonus;
}

export interface OrderPreview {
  /** How much the stat/troops/wall would move. */
  delta: number;
  gold: number;
  food: number;
  /** Non-null when the order cannot be issued as configured. */
  problem: string | null;
}

/**
 * What an order would cost and achieve right now. The panel shows this before committing,
 * so the player never discovers a price after the fact.
 */
export function previewInternal(
  state: GameState,
  cityId: CityId,
  kind: InternalKind,
  officerIds: OfficerId[],
  buildType?: FacilityType,
): OrderPreview {
  const city = state.cities[cityId];
  const none: OrderPreview = { delta: 0, gold: 0, food: 0, problem: "도시가 없습니다." };
  if (!city) return none;

  const officers = officerIds.map((id) => state.officers[id]).filter(Boolean);
  if (officers.length === 0) return { delta: 0, gold: 0, food: 0, problem: "무장을 배정하십시오." };
  if (officers.some((o) => o.duty !== "idle")) {
    return { delta: 0, gold: 0, food: 0, problem: "이미 다른 일을 맡은 무장입니다." };
  }

  const pol = weighted(officers, (o) => o.pol);
  const cha = weighted(officers, (o) => o.cha);

  switch (kind) {
    case "commerce":
    case "agriculture": {
      const cap = developmentCap(state, city, kind);
      const current = kind === "commerce" ? city.commerce : city.agriculture;
      const delta = Math.min(Math.floor(pol / 8), Math.max(0, cap - current));
      return {
        delta, gold: 0, food: 0,
        problem: delta === 0 ? `이미 상한(${cap})입니다. 시설을 지어야 합니다.` : null,
      };
    }
    case "order": {
      const delta = Math.min(Math.floor(cha / 6), 100 - city.order);
      return { delta, gold: 0, food: 0, problem: delta === 0 ? "치안이 이미 최대입니다." : null };
    }
    case "draft": {
      const cap = city.maxTroops + barracksBonus(state, city);
      const room = Math.max(0, cap - city.troops);
      const wanted = Math.min(Math.floor(cha * BALANCE.draftPerCharisma * (city.order / 100)), room);
      // Bounded by gold AND food AND the barracks cap, all at once.
      const affordable = Math.min(
        wanted,
        Math.floor(city.gold / BALANCE.draftGoldPerTroop),
        Math.floor(city.food / BALANCE.draftFoodPerTroop),
      );
      const delta = Math.max(0, affordable);
      return {
        delta,
        gold: Math.round(delta * BALANCE.draftGoldPerTroop),
        food: Math.round(delta * BALANCE.draftFoodPerTroop),
        problem: delta === 0
          ? room === 0 ? "병사가 이미 가득합니다." : "금이나 병량이 모자랍니다."
          : null,
      };
    }
    case "train": {
      return {
        delta: BALANCE.moraleTrainBonus,
        gold: BALANCE.trainGold,
        food: 0,
        problem: city.gold < BALANCE.trainGold ? "금이 모자랍니다." : null,
      };
    }
    case "repair": {
      const room = Math.max(0, city.maxDefense - city.defense);
      const wanted = Math.min(Math.round(pol * 3), room);
      const affordable = Math.min(wanted, Math.floor(city.gold / BALANCE.repairGoldPerPoint));
      return {
        delta: affordable,
        gold: Math.round(affordable * BALANCE.repairGoldPerPoint),
        food: 0,
        problem: affordable === 0
          ? room === 0 ? "성벽이 온전합니다." : "금이 모자랍니다."
          : null,
      };
    }
    case "build": {
      if (!buildType) return { delta: 0, gold: 0, food: 0, problem: "시설을 고르십시오." };
      const spec = FACILITIES[buildType];
      const turns = Math.ceil((spec.baseTurns * 100) / (50 + pol));
      return {
        delta: turns,
        gold: spec.gold,
        food: 0,
        problem: city.gold < spec.gold ? "금이 모자랍니다." : null,
      };
    }
  }
}

export interface CommandResult {
  ok: boolean;
  reason?: string;
}

/** Is this tile a legal spot for that facility, for this city, right now? */
export function canBuildAt(
  state: GameState,
  cityId: CityId,
  at: HexCoord,
  type: FacilityType,
): CommandResult {
  const city = state.cities[cityId];
  const tile = tileAt(state.map, at);
  if (!city || !tile) return { ok: false, reason: "그런 자리는 없습니다." };
  if (tile.domainOf !== cityId) return { ok: false, reason: "이 도시의 영역이 아닙니다." };
  if (tile.cityId) return { ok: false, reason: "도시 위에는 지을 수 없습니다." };
  if (tile.facility) return { ok: false, reason: "이미 시설이 있습니다." };
  if (facilityCount(state, cityId) >= FACILITY_SLOTS) {
    return { ok: false, reason: `시설은 도시마다 ${FACILITY_SLOTS}개까지입니다.` };
  }
  if (!FACILITIES[type].terrain.includes(tile.terrain)) {
    return { ok: false, reason: "이 지형에는 지을 수 없습니다." };
  }
  return { ok: true };
}

export function queueInternal(
  state: GameState,
  cityId: CityId,
  kind: InternalKind,
  officerIds: OfficerId[],
  buildAt?: HexCoord,
  buildType?: FacilityType,
): CommandResult {
  const city = state.cities[cityId];
  if (!city) return { ok: false, reason: "도시가 없습니다." };
  if (officerIds.length < 1 || officerIds.length > 3) {
    return { ok: false, reason: "무장은 1~3명까지 배정합니다." };
  }
  if (kind === "build") {
    if (!buildAt || !buildType) return { ok: false, reason: "지을 자리를 고르십시오." };
    const legal = canBuildAt(state, cityId, buildAt, buildType);
    if (!legal.ok) return legal;
  }

  const preview = previewInternal(state, cityId, kind, officerIds, buildType);
  if (preview.problem) return { ok: false, reason: preview.problem };
  if (preview.gold > city.gold) return { ok: false, reason: "금이 모자랍니다." };
  if (preview.food > city.food) return { ok: false, reason: "병량이 모자랍니다." };

  city.gold -= preview.gold;
  city.food -= preview.food;
  for (const id of officerIds) state.officers[id].duty = "internal";

  state.internalOrders.push({
    cityId, kind, officerIds: [...officerIds], buildAt, buildType,
    goldSpent: preview.gold, foodSpent: preview.food, delta: preview.delta,
  });
  return { ok: true };
}

/** Free undo inside the player's own phase: refunds the gold and releases the officers. */
export function cancelInternal(state: GameState, index: number): CommandResult {
  const order = state.internalOrders[index];
  if (!order) return { ok: false, reason: "그런 지시가 없습니다." };
  const city = state.cities[order.cityId];
  if (city) {
    city.gold += order.goldSpent;
    city.food += order.foodSpent;
  }
  for (const id of order.officerIds) {
    const officer = state.officers[id];
    if (officer && officer.duty === "internal") officer.duty = "idle";
  }
  state.internalOrders.splice(index, 1);
  return { ok: true };
}

export function ordersForCity(state: GameState, cityId: CityId): InternalOrder[] {
  return state.internalOrders.filter((o) => o.cityId === cityId);
}

// --- resolution --------------------------------------------------------------

/** Apply every queued order. Called once, in the resolve phase. */
export function resolveInternalOrders(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  for (const order of state.internalOrders) {
    const city = state.cities[order.cityId];
    if (!city) continue;
    const officers = order.officerIds.map((id) => state.officers[id]).filter(Boolean);
    const names = officers.map((o) => o.name);
    const pol = weighted(officers, (o) => o.pol);
    const cha = weighted(officers, (o) => o.cha);
    let delta = 0;

    switch (order.kind) {
      case "commerce": {
        const cap = developmentCap(state, city, "commerce");
        delta = Math.min(Math.floor(pol / 8), Math.max(0, cap - city.commerce));
        city.commerce += delta;
        break;
      }
      case "agriculture": {
        const cap = developmentCap(state, city, "agriculture");
        delta = Math.min(Math.floor(pol / 8), Math.max(0, cap - city.agriculture));
        city.agriculture += delta;
        break;
      }
      case "order": {
        delta = Math.min(Math.floor(cha / 6), 100 - city.order);
        city.order += delta;
        break;
      }
      case "draft": {
        // Gold and food were taken at queue time; deliver exactly the headcount promised,
        // still respecting the cap in case a barracks was razed in the meantime.
        const cap = city.maxTroops + barracksBonus(state, city);
        delta = Math.min(order.delta, Math.max(0, cap - city.troops));
        city.troops += delta;
        // Conscription is unpopular.
        city.order = Math.max(0, city.order - 3);
        break;
      }
      case "train": {
        delta = BALANCE.moraleTrainBonus;
        for (const unit of Object.values(state.units)) {
          if (unit.faction !== city.faction) continue;
          const tile = tileAt(state.map, unit.coord);
          if (tile?.domainOf !== city.id) continue;
          unit.morale = Math.min(100, unit.morale + BALANCE.moraleTrainBonus);
        }
        break;
      }
      case "repair": {
        delta = Math.min(order.delta, city.maxDefense - city.defense);
        city.defense += delta;
        break;
      }
      case "build": {
        if (!order.buildAt || !order.buildType) break;
        const tile = tileAt(state.map, order.buildAt);
        if (!tile || tile.facility || !city.faction) break;
        const turns = Math.ceil((FACILITIES[order.buildType].baseTurns * 100) / (50 + pol));
        tile.facility = {
          type: order.buildType,
          ownerCity: city.id,
          faction: city.faction,
          buildTurnsLeft: turns,
          builderId: order.officerIds[0] ?? null,
        };
        delta = turns;
        break;
      }
    }

    // Construction keeps its officer busy until the work is done; everyone else clocks off.
    const keepBusy = order.kind === "build";
    for (const officer of officers) {
      if (!keepBusy || officer.id !== order.officerIds[0]) officer.duty = "idle";
    }

    if (order.kind !== "build") {
      events.push({ kind: "internal", cityId: city.id, order: order.kind, delta, officers: names });
    }
  }
  state.internalOrders = [];
  return events;
}

/** Tick construction countdowns and release the builder when a facility finishes. */
export function tickBuilds(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  for (const tile of state.map.tiles) {
    const f = tile.facility;
    if (!f || f.buildTurnsLeft <= 0) continue;
    f.buildTurnsLeft -= 1;
    if (f.buildTurnsLeft > 0) {
      events.push({
        kind: "build-progress",
        cityId: f.ownerCity,
        at: { q: tile.q, r: tile.r },
        facility: f.type,
        left: f.buildTurnsLeft,
      });
      continue;
    }
    if (f.builderId) {
      const officer = state.officers[f.builderId];
      if (officer && officer.duty === "internal") officer.duty = "idle";
      f.builderId = null;
    }
    events.push({
      kind: "build-complete",
      cityId: f.ownerCity,
      at: { q: tile.q, r: tile.r },
      facility: f.type,
    });
  }
  return events;
}

/**
 * Monthly income for one faction, plus the once-a-year harvest. Gold arrives every month;
 * grain only in month 9, which is what creates the autumn-campaign rhythm.
 */
export function collectIncome(state: GameState, factionId: string): GameEvent[] {
  let gold = 0;
  let food = 0;
  let harvested = 0;
  const events: GameEvent[] = [];

  for (const city of Object.values(state.cities)) {
    if (city.faction !== factionId) continue;
    const earned = Math.round(city.commerce * BALANCE.incomeCommerceMult * (city.order / 100));
    city.gold += earned;
    gold += earned;

    if (state.month === HARVEST_MONTH) {
      const grain = Math.round(city.agriculture * BALANCE.harvestAgricultureMult);
      city.food += grain;
      harvested += grain;
    }

    // Upkeep: the garrison eats, and so does everything this city sent into the field.
    let eaten = city.troops / BALANCE.cityUpkeepDivisor;
    for (const unit of Object.values(state.units)) {
      if (unit.homeCityId === city.id) eaten += unit.troops / BALANCE.unitUpkeepDivisor;
    }
    eaten = Math.round(eaten);
    food -= eaten;

    if (city.food >= eaten) {
      city.food -= eaten;
    } else {
      // An empty granary disbands troops rather than going negative.
      const shortfall = eaten - city.food;
      city.food = 0;
      const lost = Math.min(city.troops, shortfall * 10);
      city.troops -= lost;
      city.order = Math.max(0, city.order - 5);
      if (lost > 0) events.push({ kind: "famine", cityId: city.id, lost });
    }
  }

  events.unshift({ kind: "income", gold, food: food + harvested });
  if (harvested > 0) events.push({ kind: "harvest", food: harvested });
  return events;
}

/** Slow drift back toward order, and wall repair when nobody is at the gates. */
export function regenCities(state: GameState): void {
  for (const city of Object.values(state.cities)) {
    if (city.faction === null) {
      // Neutral cities rot slowly, which is why they are the softest early targets.
      city.order = Math.max(0, city.order - 1);
      continue;
    }
    const staffed = idleOfficers(state, city.id).length > 0;
    city.order = Math.max(0, Math.min(100, city.order + (staffed ? 2 : -1)));
    // Masons do not work with an army at the gate. Without this check a breached wall healed
    // between assaults and no siege could ever conclude.
    const besieged = Object.values(state.units).some(
      (u) => u.faction !== city.faction && hexDistance(u.coord, city.coord) <= 1,
    );
    if (!besieged) {
      city.defense = Math.min(
        city.maxDefense,
        city.defense + Math.round(city.maxDefense * (BALANCE.cityRegen / 100)),
      );
    }
  }
}
