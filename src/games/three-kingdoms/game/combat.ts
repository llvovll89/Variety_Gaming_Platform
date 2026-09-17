/**
 * Field battle and siege.
 *
 * One damage formula serves both. A siege is the same attack aimed at a wall instead of a
 * body, scaled by how suited the unit is to breaking masonry — which is why cavalry, brutal
 * in the open, are nearly useless against a gate, and why a mixed army is the right answer.
 *
 * Everything rolls through the seeded RNG carried on GameState, so a battle replays exactly.
 */
import {
  BALANCE,
  TACTICS,
  TERRAIN_ATTACK,
  TERRAIN_DEFENSE,
  TYPE_COUNTER,
  UNIT_TYPES,
} from "./constants";
import { hexDistance, type HexCoord } from "./hex";
import { tileAt } from "./map";
import { absorbUnit, destroyUnit } from "./commands";
import { nearestFriendlyCity, officersOfUnit } from "./state";
import { createRng } from "./rng";
import { routeTo } from "./pathfinding";
import type { GameEvent } from "./events";
import type { City, GameState, TacticId, Tile, Unit } from "./types";

export interface EffectiveStats {
  lead: number;
  war: number;
  int: number;
  cha: number;
}

/**
 * 대장 dominates and 부장 contribute at the margin, capped so a three-star stack cannot run
 * away with the game. This is the only place officer quality enters combat.
 */
export function unitStats(state: GameState, unit: Unit): EffectiveStats {
  const officers = officersOfUnit(state, unit);
  if (officers.length === 0) return { lead: 40, war: 40, int: 40, cha: 40 };
  const pick = (get: (o: (typeof officers)[number]) => number): number => {
    const values = officers.map(get).sort((a, b) => b - a);
    const total = values[0] + values.slice(1).reduce((sum, v) => sum + v * BALANCE.deputyWeight, 0);
    return Math.min(BALANCE.statCeiling, total);
  };
  return {
    lead: pick((o) => o.lead),
    war: pick((o) => o.war),
    int: pick((o) => o.int),
    cha: pick((o) => o.cha),
  };
}

function terrainAttackMult(tile: Tile | null, unit: Unit): number {
  if (!tile) return 1;
  return TERRAIN_ATTACK[tile.terrain]?.[unit.type] ?? 1;
}

function terrainDefenseMult(state: GameState, tile: Tile | null, defender: Unit | null): number {
  if (!tile) return 1;
  let mult = TERRAIN_DEFENSE[tile.terrain];
  const fort = tile.facility;
  if (fort && fort.type === "fort" && fort.buildTurnsLeft === 0 && defender) {
    // 창병 dig in better than anyone; the 진지 is their bonus to exploit.
    if (fort.faction === defender.faction) mult *= defender.type === "spear" ? 1.4 : 1.3;
  }
  if (tile.cityId && state.cities[tile.cityId]) mult *= 1.6;
  return mult;
}

export interface AttackPlan {
  tacticMult: number;
  /** Did a contested tactic land? Null when no tactic was used. */
  tacticLanded: boolean | null;
  noCounter: boolean;
  ignoreTerrainDefense: boolean;
}

function planFor(
  state: GameState,
  attacker: Unit,
  defenderInt: number,
  tactic: TacticId | undefined,
): AttackPlan {
  if (!tactic) {
    return { tacticMult: 1, tacticLanded: null, noCounter: false, ignoreTerrainDefense: false };
  }
  const spec = TACTICS[tactic];
  const stats = unitStats(state, attacker);
  let landed = true;
  if (spec.contested) {
    const rng = createRng(state.rngSeed);
    const chance = Math.max(0.15, Math.min(0.95, 0.4 + (stats.int - defenderInt) / 150));
    landed = rng.chance(chance);
    state.rngSeed = rng.seed();
  }
  return {
    // A failed tactic still burns the 기력 and the action. That is the gamble.
    tacticMult: landed ? spec.damageMult || 1 : 1,
    tacticLanded: landed,
    noCounter: tactic === "charge" && landed,
    ignoreTerrainDefense: tactic === "volley" && landed,
  };
}

/** Raw offensive output. Exported so the AI can evaluate an engagement with the real numbers. */
export function attackPower(
  state: GameState,
  attacker: Unit,
  defenderType: Unit["type"] | null,
  tacticMult = 1,
): number {
  const stats = unitStats(state, attacker);
  const tile = tileAt(state.map, attacker.coord);
  const counter = defenderType ? TYPE_COUNTER[attacker.type][defenderType] : 1;
  return (
    BALANCE.attackBase *
    (attacker.troops / 1000) *
    (0.6 + stats.lead / 250) *
    (0.7 + attacker.morale / 200) *
    (0.5 + attacker.energy / 200) *
    (1 + stats.war / 400) *
    counter *
    terrainAttackMult(tile, attacker) *
    (attacker.status.fired > 0 ? 1.15 : 1) *
    tacticMult
  );
}

export function defensePower(
  state: GameState,
  defender: Unit,
  ignoreTerrain = false,
): number {
  const stats = unitStats(state, defender);
  const tile = tileAt(state.map, defender.coord);
  return (
    (0.6 + stats.lead / 250) *
    (0.7 + defender.morale / 200) *
    (ignoreTerrain ? 1 : terrainDefenseMult(state, tile, defender)) *
    (defender.status.confused > 0 ? 0.7 : 1)
  );
}

/** Casualties one side would inflict on another right now. Pure — the AI calls it to plan. */
export function expectedCasualties(
  state: GameState,
  attacker: Unit,
  defender: Unit,
  tacticMult = 1,
): number {
  const power = attackPower(state, attacker, defender.type, tacticMult);
  const guard = defensePower(state, defender);
  return Math.min(
    defender.troops,
    Math.max(BALANCE.minCasualties, Math.round(power / Math.max(0.1, guard))),
  );
}

function applyMorale(unit: Unit, delta: number): void {
  unit.morale = Math.max(0, Math.min(100, unit.morale + delta));
}

/** Lost troops sap morale on top of the win/lose swing: 1 point per 5% of the army. */
function moraleFromLosses(unit: Unit, lost: number): number {
  if (unit.maxTroops <= 0) return 0;
  return -Math.round((lost / unit.maxTroops) * 20);
}

export interface AttackOutcome {
  events: GameEvent[];
}

/**
 * Resolve one attack, including the defender's counterblow and any rout it causes.
 * `targetHex` may hold a unit or an enemy city.
 */
export function resolveAttack(
  state: GameState,
  attacker: Unit,
  targetHex: HexCoord,
  tactic?: TacticId,
): AttackOutcome {
  const events: GameEvent[] = [];
  const spec = UNIT_TYPES[attacker.type];
  const distance = hexDistance(attacker.coord, targetHex);
  const tile = tileAt(state.map, targetHex);
  if (!tile) return { events };

  if (tactic) {
    attacker.energy = Math.max(0, attacker.energy - TACTICS[tactic].energy);
  } else {
    attacker.energy = Math.max(0, attacker.energy - BALANCE.energyPerAttack);
  }
  attacker.hasActed = true;
  attacker.movesLeft = 0;

  const defender = tile.unitId != null ? state.units[tile.unitId] : null;
  const city = !defender && tile.cityId ? state.cities[tile.cityId] : null;

  if (defender) {
    const defStats = unitStats(state, defender);
    const plan = planFor(state, attacker, defStats.int, tactic);

    if (tactic === "rally") {
      applyMorale(attacker, BALANCE.moraleRallyBonus);
      events.push({ kind: "tactic", unitId: attacker.id, tactic, at: attacker.coord, landed: true });
      return { events };
    }
    if (tactic === "confuse") {
      if (plan.tacticLanded) {
        const rng = createRng(state.rngSeed);
        defender.status.confused = rng.int(1, 2);
        state.rngSeed = rng.seed();
      }
      events.push({
        kind: "tactic", unitId: attacker.id, tactic, at: targetHex, landed: Boolean(plan.tacticLanded),
      });
      return { events };
    }

    const power = attackPower(state, attacker, defender.type, plan.tacticMult);
    const guard = defensePower(state, defender, plan.ignoreTerrainDefense);
    const dealt = Math.min(
      defender.troops,
      Math.max(BALANCE.minCasualties, Math.round(power / Math.max(0.1, guard))),
    );
    defender.troops -= dealt;

    if (tactic === "pike" && plan.tacticLanded) applyMorale(defender, -8);
    if (tactic) {
      events.push({
        kind: "tactic", unitId: attacker.id, tactic, at: targetHex, landed: Boolean(plan.tacticLanded),
      });
    }

    // Counterblow: only at melee range, only with the energy to swing back.
    let taken = 0;
    const canCounter =
      !plan.noCounter &&
      distance <= 1 &&
      defender.troops > 0 &&
      defender.energy >= BALANCE.minCounterEnergy;
    if (canCounter) {
      const back = attackPower(state, defender, attacker.type) * UNIT_TYPES[defender.type].counterRate;
      const attackerGuard = defensePower(state, attacker);
      taken = Math.min(
        attacker.troops,
        Math.max(BALANCE.minCasualties, Math.round(back / Math.max(0.1, attackerGuard))),
      );
      attacker.troops -= taken;
      defender.energy = Math.max(0, defender.energy - BALANCE.energyPerAttack);
    }

    applyMorale(attacker, (dealt >= taken ? BALANCE.moraleWin : -BALANCE.moraleLoss) + moraleFromLosses(attacker, taken));
    applyMorale(defender, (taken > dealt ? BALANCE.moraleWin : -BALANCE.moraleLoss) + moraleFromLosses(defender, dealt));

    events.push({
      kind: "battle",
      at: targetHex,
      attackerId: attacker.id,
      defenderId: defender.id,
      dealt,
      taken,
      ranged: distance > 1,
    });

    events.push(...settle(state, defender));
    events.push(...settle(state, attacker));
    return { events };
  }

  if (city) {
    const plan = planFor(state, attacker, 40, tactic);
    const power = attackPower(state, attacker, null, plan.tacticMult) * spec.siegeMult;
    // The garrison is what holds the wall up. A full one makes the city roughly two and a
    // half times tougher than an empty one, so stripping a city to field an army is a real
    // gamble rather than a free optimisation.
    const manned = 0.5 + Math.min(1, city.troops / Math.max(1, city.maxTroops)) * 0.8;
    const wall =
      (0.6 + Math.min(BALANCE.statCeiling, cityLead(state, city)) / 250) *
      (0.5 + city.order / 200) *
      manned;
    const dealt = Math.max(
      BALANCE.minCasualties,
      Math.round(power / Math.max(0.1, wall)),
    );

    // A siege is two stages. While the wall stands it absorbs almost everything and the
    // garrison only bleeds; once it is down every blow falls on the defenders themselves.
    // Without the second stage a city with a garrison could never be taken at all, because
    // nothing else in the game reduces city.troops.
    let garrisonLost = 0;
    if (city.defense > 0) {
      const spent = Math.min(city.defense, dealt);
      city.defense -= spent;
      const overflow = dealt - spent;
      garrisonLost = Math.round(spent * BALANCE.siegeGarrisonBleed + overflow);
    } else {
      garrisonLost = dealt;
    }
    garrisonLost = Math.min(city.troops, garrisonLost);
    city.troops -= garrisonLost;

    // The garrison shoots back, and the walls take their own toll on the attackers.
    let taken = Math.round(attacker.troops * BALANCE.siegeWallBleed);
    if (city.troops > 0) {
      taken += Math.round(
        (city.troops / 1000) *
          BALANCE.cityCounterBase *
          (0.6 + cityLead(state, city) / 250) *
          (0.5 + city.order / 200),
      );
    }
    taken = Math.min(attacker.troops, taken);
    attacker.troops -= taken;
    applyMorale(attacker, -BALANCE.moraleLoss + moraleFromLosses(attacker, taken));

    if (tactic) {
      events.push({
        kind: "tactic", unitId: attacker.id, tactic, at: targetHex, landed: Boolean(plan.tacticLanded),
      });
    }
    events.push({
      kind: "siege",
      at: targetHex,
      cityId: city.id,
      unitId: attacker.id,
      dealt,
      taken,
      garrisonLost,
      breached: city.defense <= 0,
    });
    events.push(...settle(state, attacker));
    return { events };
  }

  return { events };
}

function cityLead(state: GameState, city: City): number {
  let best = 40;
  for (const id of city.officerIds) {
    const officer = state.officers[id];
    if (!officer || officer.duty === "marching" || officer.duty === "captured") continue;
    best = Math.max(best, officer.lead);
  }
  return best;
}

/**
 * Apply whatever the last blow implies: wipe-out, or a rout back toward home. Called for both
 * sides after every exchange so the board is never left holding a ghost army.
 */
export function settle(state: GameState, unit: Unit): GameEvent[] {
  if (!state.units[unit.id]) return [];

  if (unit.troops <= BALANCE.destroyTroops) {
    const events: GameEvent[] = [
      { kind: "destroy", unitId: unit.id, at: unit.coord, leader: leaderName(state, unit) },
    ];
    events.push(...scatterOfficers(state, unit));
    destroyUnit(state, unit);
    return events;
  }

  if (unit.morale <= 0) {
    const home = nearestFriendlyCity(state, unit.faction, unit.coord);
    const lost = Math.round(unit.troops * BALANCE.routTroopLoss);
    unit.troops -= lost;
    unit.energy = 0;
    unit.morale = BALANCE.routMorale;

    if (!home) {
      const events: GameEvent[] = [
        { kind: "rout", unitId: unit.id, at: unit.coord, leader: leaderName(state, unit), destroyed: true },
      ];
      events.push(...scatterOfficers(state, unit));
      destroyUnit(state, unit);
      return events;
    }

    const at = unit.coord;
    // A routed army runs all the way home rather than stopping in the open.
    const route = routeTo(state, unit, home.coord);
    const leader = leaderName(state, unit);
    if (route && route.length > 0) {
      absorbUnit(state, unit, home.id);
    } else {
      absorbUnit(state, unit, home.id);
    }
    return [{ kind: "rout", unitId: unit.id, at, leader, destroyed: false }];
  }

  return [];
}

function leaderName(state: GameState, unit: Unit): string {
  return state.officers[unit.officerIds[0]]?.name ?? "부대";
}

/**
 * When an army is wiped out its officers try to escape to the nearest friendly city.
 * 매력 buys goodwill on the road; whoever fails is taken and changes banner.
 */
function scatterOfficers(state: GameState, unit: Unit): GameEvent[] {
  const events: GameEvent[] = [];
  const refuge = nearestFriendlyCity(state, unit.faction, unit.coord);
  const rng = createRng(state.rngSeed);
  for (const id of unit.officerIds) {
    const officer = state.officers[id];
    if (!officer) continue;
    officer.unitId = null;
    const escaped = refuge !== null && rng.chance(BALANCE.officerEscapeBase + officer.cha / 400);
    if (escaped && refuge) {
      officer.duty = "idle";
      officer.cityId = refuge.id;
      if (!refuge.officerIds.includes(officer.id)) refuge.officerIds.push(officer.id);
    } else {
      officer.duty = "captured";
      events.push({ kind: "captured", officer: officer.name, at: unit.coord });
    }
    // Officers leave the roster of a city they are no longer in.
    for (const city of Object.values(state.cities)) {
      if (city.id === officer.cityId) continue;
      const idx = city.officerIds.indexOf(officer.id);
      if (idx >= 0) city.officerIds.splice(idx, 1);
    }
  }
  state.rngSeed = rng.seed();
  return events;
}

/** Tactics this unit may actually use right now, given 병종, 기력 and its 대장's learning. */
export function availableTactics(state: GameState, unit: Unit): TacticId[] {
  const leader = state.officers[unit.officerIds[0]];
  if (!leader) return [];
  return leader.tactics.filter((id) => {
    const spec = TACTICS[id];
    if (spec.unitType && spec.unitType !== unit.type) return false;
    return unit.energy >= spec.energy;
  });
}
