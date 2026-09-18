/**
 * Game state construction and read-only selectors. Everything here is pure and DOM-free
 * so the whole rules layer can be exercised from the Node test runner.
 */
import { hexDistance, type HexCoord } from "./hex";
import { tileAt } from "./map";
import { SCENARIO_START } from "./constants";
import { createOfficers, PK_ROSTER_VERSION } from "./officers";
import { createCities, createFactions, createScenarioMap, DEFAULT_FACTION } from "./scenario";
import type {
  City, CityId, Faction, FactionId, FactionStanding, GameState, Officer, OfficerId, Unit, UnitId,
} from "./types";

export function createGameState(
  playerFactionId: FactionId = DEFAULT_FACTION,
  seed = 20250917,
): GameState {
  const map = createScenarioMap();
  const cities = createCities();
  const officers = createOfficers();
  const factions = createFactions(playerFactionId);

  for (const officer of Object.values(officers)) {
    const city = cities[officer.cityId];
    if (!city) throw new Error(`officer ${officer.id} posted to unknown city ${officer.cityId}`);
    city.officerIds.push(officer.id);
  }

  // The player always acts first, so nobody can be attacked before taking a single action.
  const others = Object.keys(factions).filter((id) => id !== playerFactionId);
  const factionOrder = [playerFactionId, ...others];

  const player = factions[playerFactionId];
  return {
    turn: 1,
    day: 1,
    pkRosterVersion: PK_ROSTER_VERSION,
    year: SCENARIO_START.year,
    month: SCENARIO_START.month,
    phase: "player",
    activeIndex: 0,
    playerFactionId,
    factionOrder,
    factions,
    cities,
    officers,
    units: {},
    nextUnitId: 1,
    map,
    internalOrders: [],
    log: [
      {
        turn: 1,
        text: `${SCENARIO_START.year}년 ${SCENARIO_START.month}월, ${player.name}. 중원의 패권을 다툰다.`,
        focus: null,
        kind: "info",
      },
    ],
    rngSeed: seed >>> 0,
    result: "playing",
  };
}

// --- Lookups -----------------------------------------------------------------

export function cityAt(state: GameState, h: HexCoord): City | null {
  const tile = tileAt(state.map, h);
  if (!tile?.cityId) return null;
  return state.cities[tile.cityId] ?? null;
}

export function unitAt(state: GameState, h: HexCoord): Unit | null {
  const tile = tileAt(state.map, h);
  if (tile?.unitId == null) return null;
  return state.units[tile.unitId] ?? null;
}

export function citiesOf(state: GameState, factionId: FactionId): City[] {
  return Object.values(state.cities).filter((c) => c.faction === factionId);
}

export function unitsOf(state: GameState, factionId: FactionId): Unit[] {
  return Object.values(state.units).filter((u) => u.faction === factionId);
}

/** Officers currently sitting in the city, i.e. not marching and not captured. */
export function officersInCity(state: GameState, cityId: CityId): Officer[] {
  const city = state.cities[cityId];
  if (!city) return [];
  return city.officerIds
    .map((id) => state.officers[id])
    .filter((o): o is Officer => Boolean(o) && o.duty !== "marching" && o.duty !== "captured");
}

/** Officers free to take an order or join a 출진 this month. */
export function idleOfficers(state: GameState, cityId: CityId): Officer[] {
  return officersInCity(state, cityId).filter((o) => o.duty === "idle");
}

export function officersOfUnit(state: GameState, unit: Unit): Officer[] {
  return unit.officerIds.map((id) => state.officers[id]).filter(Boolean);
}

export function leaderOf(state: GameState, unit: Unit): Officer | null {
  return state.officers[unit.officerIds[0]] ?? null;
}

export function factionOf(state: GameState, id: FactionId | null): Faction | null {
  return id ? state.factions[id] ?? null : null;
}

/** Nearest city owned by `factionId`, used by retreat, rout and supply. */
export function nearestFriendlyCity(
  state: GameState,
  factionId: FactionId,
  from: HexCoord,
): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const city of citiesOf(state, factionId)) {
    const d = hexDistance(from, city.coord);
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

export function isOwnDomain(state: GameState, h: HexCoord, factionId: FactionId): boolean {
  const tile = tileAt(state.map, h);
  if (!tile?.domainOf) return false;
  return state.cities[tile.domainOf]?.faction === factionId;
}

// --- Aggregates --------------------------------------------------------------

export function factionGold(state: GameState, factionId: FactionId): number {
  return citiesOf(state, factionId).reduce((sum, c) => sum + c.gold, 0);
}

export function factionFood(state: GameState, factionId: FactionId): number {
  return citiesOf(state, factionId).reduce((sum, c) => sum + c.food, 0);
}

/** Garrison plus everything in the field — what the standings table shows. */
export function factionTroops(state: GameState, factionId: FactionId): number {
  const garrison = citiesOf(state, factionId).reduce((sum, c) => sum + c.troops, 0);
  const fielded = unitsOf(state, factionId).reduce((sum, u) => sum + u.troops, 0);
  return garrison + fielded;
}

export function factionOfficers(state: GameState, factionId: FactionId): Officer[] {
  return Object.values(state.officers).filter(
    (o) => o.faction === factionId && o.duty !== "captured",
  );
}

export function standings(state: GameState): FactionStanding[] {
  return Object.values(state.factions)
    .filter((f) => f.alive)
    .map((f) => ({
      id: f.id,
      name: f.name,
      color: f.color,
      cities: citiesOf(state, f.id).length,
      troops: factionTroops(state, f.id),
    }))
    .sort((a, b) => b.cities - a.cities || b.troops - a.troops);
}

export function unitById(state: GameState, id: UnitId): Unit | null {
  return state.units[id] ?? null;
}

export function officerById(state: GameState, id: OfficerId): Officer | null {
  return state.officers[id] ?? null;
}
