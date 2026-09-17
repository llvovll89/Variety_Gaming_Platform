/**
 * 병량 보급.
 *
 * An army carries six months of grain and eats one month's worth every turn. It refills
 * automatically whenever a corridor of friendly or unclaimed ground connects it to a city
 * with something in the granary — and an enemy unit or an enemy 진지 standing on that
 * corridor cuts it.
 *
 * This is the pressure that makes a deep push dangerous and makes cutting a supply line a
 * legitimate move, without anybody having to shepherd a baggage train around the map.
 */
import { BALANCE } from "./constants";
import { hexKey, hexNeighbors, type HexCoord } from "./hex";
import { tileAt } from "./map";
import { citiesOf } from "./state";
import { settle } from "./combat";
import type { GameEvent } from "./events";
import type { FactionId, GameState, Unit } from "./types";

/** Every hex this faction can push grain through, out to BALANCE.supplyRange steps. */
export function supplyReach(state: GameState, factionId: FactionId): Set<string> {
  const reached = new Set<string>();
  const frontier: { hex: HexCoord; depth: number }[] = [];

  for (const city of citiesOf(state, factionId)) {
    if (city.food <= 0) continue;
    reached.add(hexKey(city.coord));
    frontier.push({ hex: city.coord, depth: 0 });
  }

  while (frontier.length > 0) {
    const { hex, depth } = frontier.shift()!;
    if (depth >= BALANCE.supplyRange) continue;
    for (const next of hexNeighbors(hex)) {
      const key = hexKey(next);
      if (reached.has(key)) continue;
      const tile = tileAt(state.map, next);
      if (!tile || tile.terrain === "water") continue;

      // Grain moves through your own land and through nobody's land, never through someone
      // else's. That is what makes territory matter beyond income.
      if (tile.domainOf) {
        const owner = state.cities[tile.domainOf]?.faction;
        if (owner && owner !== factionId) continue;
      }
      // An enemy standing on the road, or a fort astride it, severs the line.
      if (tile.unitId != null) {
        const blocker = state.units[tile.unitId];
        if (blocker && blocker.faction !== factionId) continue;
      }
      if (tile.facility && tile.facility.type === "fort" && tile.facility.faction !== factionId) {
        continue;
      }

      reached.add(key);
      frontier.push({ hex: next, depth: depth + 1 });
    }
  }
  return reached;
}

function capacity(unit: Unit): number {
  return Math.round((unit.maxTroops / 100) * BALANCE.supplyMonths);
}

/**
 * Feed every army, then punish the ones nobody could reach. Runs once per turn, before any
 * other upkeep, so a besieging force that just lost its corridor feels it immediately.
 */
export function resolveSupply(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  const reachByFaction = new Map<FactionId, Set<string>>();

  for (const unit of Object.values(state.units)) {
    // Monthly ration first.
    const eaten = Math.max(1, Math.round(unit.troops / BALANCE.unitUpkeepDivisor));
    unit.food = Math.max(0, unit.food - eaten);

    let reach = reachByFaction.get(unit.faction);
    if (!reach) {
      reach = supplyReach(state, unit.faction);
      reachByFaction.set(unit.faction, reach);
    }

    if (reach.has(hexKey(unit.coord))) {
      unit.unsuppliedTurns = 0;
      const want = capacity(unit) - unit.food;
      if (want > 0) {
        // Draw from the nearest friendly city that still has grain.
        const source = citiesOf(state, unit.faction)
          .filter((c) => c.food > 0)
          .sort(
            (a, b) =>
              Math.abs(a.coord.q - unit.coord.q) + Math.abs(a.coord.r - unit.coord.r) -
              (Math.abs(b.coord.q - unit.coord.q) + Math.abs(b.coord.r - unit.coord.r)),
          )[0];
        if (source) {
          const given = Math.min(want, source.food);
          source.food -= given;
          unit.food += given;
        }
      }
      continue;
    }

    unit.unsuppliedTurns += 1;
    if (unit.food > 0) continue;

    // Out of supply and out of grain: the army starts coming apart.
    const lost = Math.round(unit.troops * (1 - BALANCE.starveTroopMult));
    unit.troops = Math.max(0, unit.troops - lost);
    unit.morale = Math.max(0, unit.morale - BALANCE.starveMorale);
    events.push({
      kind: "starve",
      unitId: unit.id,
      at: unit.coord,
      leader: state.officers[unit.officerIds[0]]?.name ?? "부대",
      lost,
    });
    events.push(...settle(state, unit));
  }

  return events;
}

/** Is this unit currently fed? Used by the panel and by the AI's retreat rule. */
export function isSupplied(state: GameState, unit: Unit): boolean {
  return supplyReach(state, unit.faction).has(hexKey(unit.coord));
}
