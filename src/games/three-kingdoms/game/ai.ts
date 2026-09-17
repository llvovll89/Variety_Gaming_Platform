/**
 * Enemy faction behaviour.
 *
 * One assessment pass, one goal per army, and — the load-bearing decision — the AI judges
 * every engagement by calling the real combat functions. It therefore respects 병종 상성,
 * terrain and 사기 automatically, without a second copy of the balance living in here that
 * could drift away from the one the player sees.
 *
 * Output is a list of commands, not mutations. turn.ts feeds them to the step machine one at
 * a time so each becomes an animation the player can follow.
 */
import { BALANCE, FACILITIES, UNIT_TYPES } from "./constants";
import { hexDistance, hexEquals, hexKey, type HexCoord } from "./hex";
import { tileAt } from "./map";
import { citiesOf, idleOfficers, unitsOf } from "./state";
import {
  barracksBonus, buildableTiles, developmentCap, facilityCount, previewInternal, queueInternal,
} from "./internal";
import { dispatchCost, validateDispatch } from "./commands";
import { attackPower, availableTactics, defensePower, expectedCasualties, unitStats } from "./combat";
import { canCapture } from "./siege";
import { attackTargets, pathFrom, reachable, routeTo } from "./pathfinding";
import { TACTICS } from "./constants";
import type {
  City, CityId, FactionId, GameState, TacticId, Unit, UnitId, UnitType,
} from "./types";

export type AiCommand =
  | { kind: "dispatch"; cityId: CityId; officerIds: string[]; type: UnitType; troops: number }
  | { kind: "move"; unitId: UnitId; to: HexCoord }
  | { kind: "attack"; unitId: UnitId; target: HexCoord; tactic?: TacticId }
  | { kind: "capture"; unitId: UnitId; cityId: CityId }
  | { kind: "return"; unitId: UnitId };

// --- assessment ---------------------------------------------------------------

function threatTo(state: GameState, city: City): number {
  let threat = 0;
  for (const unit of Object.values(state.units)) {
    if (unit.faction === city.faction) continue;
    const d = hexDistance(unit.coord, city.coord);
    if (d > 5) continue;
    threat += unit.troops / (d + 1);
  }
  return threat;
}

function strengthAt(state: GameState, city: City): number {
  let total = city.troops;
  for (const unit of unitsOf(state, city.faction ?? "")) {
    if (hexDistance(unit.coord, city.coord) <= 3) total += unit.troops;
  }
  return total;
}

/** Value of an enemy city as a target: cheap ones first, defended ones last. */
function targetValue(state: GameState, city: City): number {
  let nearby = 0;
  for (const unit of Object.values(state.units)) {
    if (unit.faction === city.faction && hexDistance(unit.coord, city.coord) <= 2) {
      nearby += unit.troops;
    }
  }
  return city.troops + city.defense / 4 + nearby;
}

// --- internal affairs ----------------------------------------------------------

/**
 * Greedy officer assignment. Order first, then walls under threat, then men, then the
 * economy. Never dips below the gold reserve, so a faction always keeps enough to react.
 */
export function planInternal(state: GameState, factionId: FactionId): void {
  const faction = state.factions[factionId];
  if (!faction?.alive) return;

  for (const city of citiesOf(state, factionId)) {
    const threat = threatTo(state, city);
    const roster = idleOfficers(state, city.id);
    // Reserve the best fighters for the field. Without this the AI files every single
    // officer under paperwork, leaves nobody to lead an army, and never goes to war at all —
    // which is exactly what the first all-AI simulation showed.
    const reserved = new Set(
      [...roster]
        .sort((a, b) => b.lead + b.war - (a.lead + a.war))
        .slice(0, Math.min(2, Math.floor(roster.length / 2)))
        .map((o) => o.id),
    );
    let available = roster.filter((o) => !reserved.has(o.id)).sort((a, b) => b.pol - a.pol);
    if (available.length === 0) continue;

    const assign = (kind: Parameters<typeof previewInternal>[2], who: string[], ...rest: unknown[]): boolean => {
      const [at, type] = rest as [HexCoord | undefined, keyof typeof FACILITIES | undefined];
      const result = queueInternal(state, city.id, kind, who, at, type);
      if (result.ok) available = available.filter((o) => !who.includes(o.id));
      return result.ok;
    };

    // 1. Lawlessness starves everything else, so it goes first.
    if (city.order < 50 && available.length > 0) {
      const best = [...available].sort((a, b) => b.cha - a.cha)[0];
      assign("order", [best.id]);
    }
    // 2. Patch the wall while somebody is actually coming.
    if (available.length > 0 && threat > 0 && city.defense < city.maxDefense * 0.6) {
      assign("repair", [available[0].id]);
    }
    // 3. Fill the barracks.
    const troopCap = city.maxTroops + barracksBonus(state, city);
    if (available.length > 0 && city.troops < troopCap * 0.4) {
      const best = [...available].sort((a, b) => b.cha - a.cha)[0];
      if (city.gold > BALANCE.aiGoldReserve) assign("draft", [best.id]);
    }
    // 4. Grain if the granary is thin, otherwise money.
    if (available.length > 0) {
      const annualNeed = (city.troops / BALANCE.cityUpkeepDivisor) * 12;
      const kind = city.food < annualNeed * 3 ? "agriculture" : "commerce";
      const cap = developmentCap(state, city, kind);
      const current = kind === "commerce" ? city.commerce : city.agriculture;
      if (current < cap) assign(kind, [available[0].id]);
    }
    // 5. Spare talent and spare cash go into the ground — away from the border, so the
    //    player is not handed a free target to burn.
    if (
      available.length > 0 &&
      available[0].pol >= 70 &&
      city.gold > BALANCE.aiGoldReserve + 800 &&
      facilityCount(state, city.id) < 6
    ) {
      const type = city.agriculture < city.commerce ? "farm" : "market";
      const spots = buildableTiles(state, city.id, type);
      const enemyCity = nearestEnemyCity(state, city);
      const safest = spots.sort((a, b) => {
        if (!enemyCity) return 0;
        return hexDistance(b, enemyCity.coord) - hexDistance(a, enemyCity.coord);
      })[0];
      if (safest) assign("build", [available[0].id], safest, type);
    }
  }
}

function nearestEnemyCity(state: GameState, from: City): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const city of Object.values(state.cities)) {
    if (city.faction === from.faction) continue;
    const d = hexDistance(from.coord, city.coord);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

// --- military ------------------------------------------------------------------

function pickUnitType(state: GameState, city: City): UnitType {
  // Counter whatever is actually threatening this city; default to spears, the safe pick.
  const counts: Record<UnitType, number> = { spear: 0, cavalry: 0, archer: 0 };
  for (const unit of Object.values(state.units)) {
    if (unit.faction === city.faction) continue;
    if (hexDistance(unit.coord, city.coord) > 6) continue;
    counts[unit.type] += unit.troops;
  }
  const worst = (Object.keys(counts) as UnitType[]).sort((a, b) => counts[b] - counts[a])[0];
  if (counts[worst] === 0) return "spear";
  return worst === "cavalry" ? "spear" : worst === "archer" ? "cavalry" : "archer";
}

/**
 * Everything this faction could throw at a target. The radius matches the candidate filter
 * below: a tighter one made every target look unaffordable, the AI never committed, and so
 * it never raised an army in the first place.
 */
const REACH = 12;

function mobilizable(state: GameState, factionId: FactionId, at: HexCoord): number {
  let total = 0;
  for (const unit of unitsOf(state, factionId)) {
    if (hexDistance(unit.coord, at) <= REACH) total += unit.troops;
  }
  for (const city of citiesOf(state, factionId)) {
    if (hexDistance(city.coord, at) <= REACH) total += Math.max(0, city.troops - 2500);
  }
  return total;
}

export function planMilitary(state: GameState, factionId: FactionId): AiCommand[] {
  const faction = state.factions[factionId];
  if (!faction?.alive) return [];

  const commands: AiCommand[] = [];
  const cities = citiesOf(state, factionId);
  const armies = unitsOf(state, factionId);
  // Bounding the army count bounds the animation budget as much as the difficulty.
  const maxUnits = 2 + cities.length;

  // --- goals per unit ---
  //
  // Objectives persist on the unit. Recomputing them from scratch every month made armies
  // oscillate between two similarly-priced targets and march back and forth without ever
  // arriving: 262 moves produced 22 battles.
  const goals = new Map<UnitId, HexCoord>();
  for (const unit of armies) {
    const held = unit.orderTarget;
    if (held?.kind === "city" && held.id) {
      const city = state.cities[held.id];
      if (city && city.faction !== factionId) goals.set(unit.id, city.coord);
      else unit.orderTarget = undefined;
    }
  }
  const threatened = cities
    .map((c) => ({ city: c, threat: threatTo(state, c), strength: strengthAt(state, c) }))
    .filter((e) => e.threat > 0.8 * e.strength)
    .sort((a, b) => b.threat - a.threat);

  const assigned = new Set<UnitId>();
  for (const { city } of threatened) {
    const helper = armies
      .filter((u) => !assigned.has(u.id))
      .sort((a, b) => hexDistance(a.coord, city.coord) - hexDistance(b.coord, city.coord))[0];
    if (!helper) continue;
    assigned.add(helper.id);
    helper.orderTarget = undefined;
    goals.set(helper.id, city.coord);
  }

  // Offensive target: the softest enemy city we can commit decisively against.
  //
  // This is evaluated even while something of ours is under threat. Gating it on "nothing is
  // threatened" made every faction permanently defensive as soon as a single army wandered
  // near a border, and the whole map froze into a stalemate.
  let offensive: City | null = null;
  {
    const committed = [...assigned].reduce((sum, id) => sum + (state.units[id]?.troops ?? 0), 0);
    const candidates = Object.values(state.cities)
      .filter((c) => c.faction !== factionId)
      .map((c) => ({
        city: c,
        value: targetValue(state, c),
        distance: Math.min(...cities.map((own) => hexDistance(own.coord, c.coord))),
      }))
      .filter((e) => e.distance <= REACH)
      .sort((a, b) => a.value / (a.distance + 1) - b.value / (b.distance + 1));

    for (const candidate of candidates) {
      // Troops already tied down defending cannot be counted twice.
      const force = mobilizable(state, factionId, candidate.city.coord) - committed;
      // Aggression scales the margin: 조조 at 0.85 moves on a 1.36x edge, 유표 at 1.4 needs 2.24x.
      if (force > faction.aggression * BALANCE.aiCommitMargin * candidate.value) {
        offensive = candidate.city;
        break;
      }
    }
  }

  for (const unit of armies) {
    if (goals.has(unit.id)) continue;
    const broken =
      unit.troops < unit.maxTroops * BALANCE.aiRetreatTroopFraction ||
      unit.morale < BALANCE.aiRetreatMorale ||
      unit.unsuppliedTurns >= BALANCE.aiRetreatUnsupplied;
    if (broken) {
      unit.orderTarget = undefined;
      const home = cities.sort(
        (a, b) => hexDistance(a.coord, unit.coord) - hexDistance(b.coord, unit.coord),
      )[0];
      if (home) goals.set(unit.id, home.coord);
      continue;
    }
    if (goals.has(unit.id)) continue;   // already holding a standing objective
    if (offensive) {
      unit.orderTarget = { kind: "city", id: offensive.id };
      goals.set(unit.id, offensive.coord);
    }
  }

  // --- reinforce ---
  // Up to two new armies a month, and each takes the bulk of its city's garrison. Sending a
  // trickle of 3,000-man forces against a 9,000-point wall just feeds the defender; a
  // campaign is decided by committing a city's strength, not by dribbling it out.
  if (offensive) {
    const used = new Set<CityId>();
    for (let raised = 0; raised < 2 && armies.length + raised < maxUnits; raised++) {
      const source = cities
        .filter((c) => !used.has(c.id) && c.troops > 3000 && idleOfficers(state, c.id).length > 0)
        .sort(
          (a, b) => hexDistance(a.coord, offensive!.coord) - hexDistance(b.coord, offensive!.coord),
        )[0];
      if (!source) break;
      used.add(source.id);

      // Leave a garrison behind — an empty city is a gift.
      const spare = Math.max(0, source.troops - 2500);
      const troops = Math.min(
        Math.round(spare * 0.85),
        Math.floor(source.gold / BALANCE.dispatchGoldPerTroop),
        Math.floor((source.food / BALANCE.supplyMonths) * 100),
      );
      if (troops < 2000) continue;

      const leaders = idleOfficers(state, source.id)
        .sort((a, b) => b.lead + b.war - (a.lead + a.war))
        .slice(0, 2)
        .map((o) => o.id);
      const type = pickUnitType(state, source);
      const req = { cityId: source.id, officerIds: leaders, type, troops };
      const cost = dispatchCost(troops);
      if (cost.food <= source.food && validateDispatch(state, req).ok) {
        commands.push({ kind: "dispatch", ...req });
      }
    }
  }

  // --- act, unit by unit ---
  for (const unit of armies) {
    const goal = goals.get(unit.id);
    if (!goal) continue;

    // Sitting in one of our own cities: fold in only when the army is genuinely spent.
    // Dissolving a healthy army into a garrison looked like sensible defence but was a churn
    // loop — 7,000 men absorbed one month and re-raised the next, at full cost each time.
    // A unit that needs to hold a city holds it by standing on it.
    const here = tileAt(state.map, unit.coord);
    const holding = here?.cityId ? state.cities[here.cityId] : null;
    if (
      holding &&
      holding.faction === factionId &&
      unit.troops < unit.maxTroops * BALANCE.aiRetreatTroopFraction
    ) {
      commands.push({ kind: "return", unitId: unit.id });
      continue;
    }
    // A freshly taken city with no garrison is worth sitting on rather than marching past.
    if (holding && holding.faction === factionId && holding.troops < 2000 && threatTo(state, holding) > 0) {
      unit.orderTarget = undefined;
      continue;
    }

    if (!hexEquals(unit.coord, goal)) {
      const step = stepToward(state, unit, goal);
      if (step) commands.push({ kind: "move", unitId: unit.id, to: step });
    }

    const strike = bestStrike(state, unit, goal);
    if (strike) commands.push(strike);
  }

  return commands;
}

/** Furthest hex along the route we can actually reach this month. */
function stepToward(state: GameState, unit: Unit, goal: HexCoord): HexCoord | null {
  const route = routeTo(state, unit, goal);
  if (!route || route.length === 0) return null;
  const reach = reachable(state, unit);
  for (let i = route.length - 1; i >= 0; i--) {
    if (reach.has(hexKey(route[i]))) return route[i];
  }
  return null;
}

/**
 * Should this unit swing, and with what? Evaluated with the live combat functions, so the AI
 * declines a fight it would lose on the exchange and picks a tactic only when it is worth
 * the 기력.
 */
function bestStrike(state: GameState, unit: Unit, goal: HexCoord): AiCommand | null {
  if (unit.hasActed || unit.status.confused > 0) return null;

  // Walking into an empty enemy city is always right when the wall is down.
  for (const n of attackTargets(state, unit)) {
    const tile = tileAt(state.map, n);
    if (!tile?.cityId) continue;
    const city = state.cities[tile.cityId];
    if (city && canCapture(state, unit, city).ok) {
      return { kind: "capture", unitId: unit.id, cityId: city.id };
    }
  }

  const targets = attackTargets(state, unit);
  if (targets.length === 0) return null;

  let best: { target: HexCoord; tactic?: TacticId; score: number } | null = null;
  for (const target of targets) {
    const tile = tileAt(state.map, target);
    if (!tile) continue;

    if (tile.unitId != null) {
      const enemy = state.units[tile.unitId];
      if (!enemy) continue;
      const dealt = expectedCasualties(state, unit, enemy);
      const ranged = hexDistance(unit.coord, target) > 1;
      const back = ranged
        ? 0
        : Math.round(
            (attackPower(state, enemy, unit.type) * UNIT_TYPES[enemy.type].counterRate) /
              Math.max(0.1, defensePower(state, unit)),
          );
      const plainScore = dealt - back;
      if (plainScore <= 0) continue;
      if (!best || plainScore > best.score) best = { target, score: plainScore };

      // A tactic has to beat the plain swing by a fifth to be worth the energy.
      for (const tactic of availableTactics(state, unit)) {
        const spec = TACTICS[tactic];
        if (spec.damageMult <= 0) continue;
        const withTactic = expectedCasualties(state, unit, enemy, spec.damageMult);
        const counter = tactic === "charge" ? 0 : back;
        const score = withTactic - counter;
        if (score > plainScore * 1.2 && (!best || score > best.score)) {
          best = { target, tactic, score };
        }
      }
      continue;
    }

    if (tile.cityId) {
      const city = state.cities[tile.cityId];
      if (!city || city.faction === unit.faction) continue;
      // Only bother with the wall if this city is what we came for, or it is nearly down.
      const wanted = hexEquals(city.coord, goal) || city.defense < city.maxDefense * 0.35;
      if (!wanted) continue;
      const score = attackPower(state, unit, null) * UNIT_TYPES[unit.type].siegeMult;
      if (!best || score > best.score) best = { target, score };
    }
  }

  if (!best) return null;
  return { kind: "attack", unitId: unit.id, target: best.target, tactic: best.tactic };
}

/**
 * Why the AI decided what it decided. Exported so the headless balance simulation can show
 * the intermediate numbers instead of forcing a guess — this is the instrument the combat
 * and economy constants get tuned against.
 */
export function explainMilitary(state: GameState, factionId: FactionId): {
  cities: number;
  armies: number;
  maxUnits: number;
  garrison: number;
  gold: number;
  threatened: string[];
  candidates: { city: string; value: number; distance: number; force: number; need: number; ok: boolean }[];
  sources: { city: string; troops: number; idle: number; gold: number; food: number }[];
} {
  const faction = state.factions[factionId];
  const cities = citiesOf(state, factionId);
  const armies = unitsOf(state, factionId);
  const threatened = cities
    .filter((c) => threatTo(state, c) > 0.8 * strengthAt(state, c))
    .map((c) => c.name);
  const candidates = Object.values(state.cities)
    .filter((c) => c.faction !== factionId)
    .map((c) => {
      const distance = Math.min(...cities.map((own) => hexDistance(own.coord, c.coord)), Infinity);
      const value = targetValue(state, c);
      const force = mobilizable(state, factionId, c.coord);
      const need = faction.aggression * BALANCE.aiCommitMargin * value;
      return { city: c.name, value: Math.round(value), distance, force: Math.round(force), need: Math.round(need), ok: force > need };
    })
    .filter((e) => e.distance <= REACH)
    .sort((a, b) => a.value / (a.distance + 1) - b.value / (b.distance + 1));
  return {
    cities: cities.length,
    armies: armies.length,
    maxUnits: 2 + cities.length,
    garrison: cities.reduce((a, c) => a + c.troops, 0),
    gold: cities.reduce((a, c) => a + c.gold, 0),
    threatened,
    candidates: candidates.slice(0, 4),
    sources: cities.map((c) => ({
      city: c.name, troops: c.troops, idle: idleOfficers(state, c.id).length,
      gold: c.gold, food: c.food,
    })),
  };
}

/** Exported for the tests that assert the AI never issues something illegal. */
export function describeAi(state: GameState, factionId: FactionId): {
  cities: number;
  units: number;
  stats: ReturnType<typeof unitStats> | null;
} {
  const units = unitsOf(state, factionId);
  return {
    cities: citiesOf(state, factionId).length,
    units: units.length,
    stats: units[0] ? unitStats(state, units[0]) : null,
  };
}

export { pathFrom };
