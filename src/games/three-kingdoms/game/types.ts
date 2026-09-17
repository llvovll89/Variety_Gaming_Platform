/** Shared type vocabulary for the whole game. No logic lives here. */
import type { HexCoord } from "./hex";

export type FactionId = string;
export type CityId = string;
export type OfficerId = string;
export type UnitId = number;

export type TerrainType = "plain" | "forest" | "hill" | "mountain" | "water" | "road" | "wasteland";
/** 농지 / 시장 / 병영 / 진지 / 궁노대 */
export type FacilityType = "farm" | "market" | "barracks" | "fort" | "tower";
/** 창병 / 기병 / 궁병. 병기(siege engines) is deliberately out of the first slice. */
export type UnitType = "spear" | "cavalry" | "archer";
export type TacticId = "charge" | "pike" | "volley" | "fire" | "confuse" | "rally";
/** 상업 / 농업 / 치안 / 징병 / 훈련 / 수리 / 건설 */
export type InternalKind = "commerce" | "agriculture" | "order" | "draft" | "train" | "repair" | "build";

export interface Facility {
  type: FacilityType;
  ownerCity: CityId;
  faction: FactionId;
  /** > 0 while under construction; effects stay inactive until it reaches 0. */
  buildTurnsLeft: number;
  /** Officer tied up by the construction, freed on completion. */
  builderId: OfficerId | null;
}

export interface Tile {
  q: number;
  r: number;
  terrain: TerrainType;
  /** Set only on a city's own hex. */
  cityId: CityId | null;
  /** City whose 영역 this tile belongs to. Facilities may only be built here. */
  domainOf: CityId | null;
  facility: Facility | null;
  /** Occupancy index — at most one unit per hex. Only commands.ts writes this. */
  unitId: UnitId | null;
}

export interface GameMap {
  width: number;
  height: number;
  /** Odd-r offset, row-major: tiles[row * width + col]. */
  tiles: Tile[];
}

export interface Officer {
  id: OfficerId;
  name: string;
  hanja: string;
  /** 통솔 / 무력 / 지력 / 정치 / 매력 */
  lead: number;
  war: number;
  int: number;
  pol: number;
  cha: number;
  faction: FactionId | null;
  cityId: CityId;
  duty: "idle" | "internal" | "marching" | "captured";
  unitId: UnitId | null;
  tactics: TacticId[];
}

export interface City {
  id: CityId;
  name: string;
  hanja: string;
  coord: HexCoord;
  /** null = 중립 (unowned). */
  faction: FactionId | null;
  scale: "small" | "mid" | "large" | "capital";
  gold: number;
  food: number;
  troops: number;
  maxTroops: number;
  /** 상업 / 농업 development, each capped by the facilities built in the domain. */
  commerce: number;
  agriculture: number;
  /** 치안 0-100. Scales income and 징병 yield. */
  order: number;
  /** 내구 — the wall. Siege damages this, not the garrison. */
  defense: number;
  maxDefense: number;
  officerIds: OfficerId[];
  neighborCityIds: CityId[];
}

export interface Unit {
  id: UnitId;
  faction: FactionId;
  coord: HexCoord;
  type: UnitType;
  troops: number;
  maxTroops: number;
  /** 사기 0-100. Hits 0 and the unit routs. */
  morale: number;
  /** 기력 0-100. Attacks and tactics spend it. */
  energy: number;
  /** 병량 carried on the march. */
  food: number;
  /** officerIds[0] is 대장; the rest are 부장. Max 3. */
  officerIds: OfficerId[];
  homeCityId: CityId;
  movesLeft: number;
  hasActed: boolean;
  status: { confused: number; slowed: number; fired: number };
  /** Consecutive turns cut off from supply. Drives starvation. */
  unsuppliedTurns: number;
}

export interface Faction {
  id: FactionId;
  name: string;
  hanja: string;
  leaderId: OfficerId;
  color: string;
  isPlayer: boolean;
  alive: boolean;
  /** AI caution. Lower attacks at a smaller advantage. 조조 0.85 / 유표 1.4 */
  aggression: number;
}

export interface InternalOrder {
  cityId: CityId;
  kind: InternalKind;
  officerIds: OfficerId[];
  buildAt?: HexCoord;
  buildType?: FacilityType;
  /** Gold debited up front, refunded verbatim if the order is cancelled. */
  goldSpent: number;
}

export interface LogEntry {
  turn: number;
  text: string;
  /** Tap-to-pan target for the battle log. */
  focus: HexCoord | null;
  kind: "info" | "battle" | "capture" | "alert";
}

export interface GameState {
  turn: number;
  year: number;
  month: number;
  phase: "player" | "ai" | "resolve" | "ended";
  /** Index into factionOrder; meaningful during the 'ai' phase. */
  activeIndex: number;
  playerFactionId: FactionId;
  /** The player is always index 0, so they never get hit before acting on turn 1. */
  factionOrder: FactionId[];
  factions: Record<FactionId, Faction>;
  cities: Record<CityId, City>;
  officers: Record<OfficerId, Officer>;
  units: Record<UnitId, Unit>;
  nextUnitId: UnitId;
  map: GameMap;
  /** Queued 내정 for every faction, consumed wholesale in the resolve phase. */
  internalOrders: InternalOrder[];
  log: LogEntry[];
  rngSeed: number;
  result: "playing" | "victory" | "defeat";
}

// --- UI projection -----------------------------------------------------------
// React never sees GameState. The engine publishes this flat, display-ready view.

export interface FactionStanding {
  id: FactionId;
  name: string;
  color: string;
  cities: number;
  troops: number;
}

export interface UISnapshot {
  screen: "menu" | "playing" | "ended";
  year: number;
  month: number;
  turn: number;
  result: GameState["result"];
  player: {
    name: string;
    color: string;
    gold: number;
    food: number;
    cities: number;
    units: number;
    officers: number;
  } | null;
  selected: { kind: "none" } | { kind: "city"; cityId: CityId } | { kind: "unit"; unitId: UnitId };
  log: LogEntry[];
  /** True while the step machine is draining — panels lock and TopBar offers 가속. */
  busy: boolean;
  standings: FactionStanding[];
}
