/**
 * Builds the 194 Central Plains board: terrain, the 가도 network, and each city's 영역.
 *
 * Terrain is painted by rule rather than hand-drawn ASCII so it stays adjustable, and
 * the roads are carved by actually tracing lines between the cities they connect — that
 * way the highway network can never drift out of sync with where the cities sit.
 */
import {
  axialToOffset,
  hexDistance,
  hexLine,
  hexesInRange,
  offsetToAxial,
  type HexCoord,
} from "./hex";
import { DOMAIN_RADIUS, MAP_HEIGHT, MAP_WIDTH } from "./constants";
import type { CityId, GameMap, TerrainType, Tile } from "./types";

export interface CityAnchor {
  id: CityId;
  col: number;
  row: number;
}

/** Pairs of cities joined by a 가도. Order is irrelevant. */
export type RoadLink = readonly [CityId, CityId];

export function tileIndex(map: GameMap, col: number, row: number): number {
  return row * map.width + col;
}

export function inBounds(col: number, row: number): boolean {
  return col >= 0 && col < MAP_WIDTH && row >= 0 && row < MAP_HEIGHT;
}

/** Tile at an axial coord, or null when off the board. */
export function tileAt(map: GameMap, h: HexCoord): Tile | null {
  const { col, row } = axialToOffset(h);
  if (col < 0 || col >= map.width || row < 0 || row >= map.height) return null;
  return map.tiles[row * map.width + col] ?? null;
}

export function isLand(t: Tile | null): boolean {
  return t !== null && t.terrain !== "water";
}

/**
 * Where the 황하 sits in a given column. It winds so the crossings are not a straight wall,
 * and it is the reason 수군 can be deferred honestly: the north bank is a separate theatre
 * reachable only through the fords.
 *
 * The band is deliberately pinned to rows 2-4. Letting it wander further south wedged 복양
 * against the bank and left it with six buildable tiles, which quietly crippled 여포.
 */
function riverRowFor(col: number): number {
  return 3 + Math.round(0.5 + 0.5 * Math.sin(col * 0.4));
}

/** Rows the river occupies in a column: the meander row and the one above it. */
function isRiver(col: number, row: number): boolean {
  const river = riverRowFor(col);
  return row === river || row === river - 1;
}

function baseTerrain(col: number, row: number): TerrainType {
  // 관중 — a fertile basin ringed by mountain, reachable from the east only through the
  // 함곡관 pass. That single gap is what lets 장안 be safe and poor at the same time.
  if (col <= 1) return "mountain";
  if (col <= 6 && (row <= 5 || row >= 14)) return "mountain";
  if (col === 6) return row >= 8 && row <= 10 ? "hill" : "mountain";
  if (col <= 5) return col === 2 || row === 6 || row === 13 ? "hill" : "plain";

  // 황하.
  if (isRiver(col, row)) return "water";

  // The war-ravaged belt around 낙양 — 화계 country, and why the ruined capital is poor.
  if (col >= 7 && col <= 12 && row >= 6 && row <= 10) return "wasteland";

  // Southern forest and hill country thickens toward the border. Driven by a hash rather
  // than a modulo: `%` produced visible diagonal stripes that read as a texture bug.
  const n = noise2(col, row);
  if (row >= 16) return n < 0.4 ? "forest" : n < 0.62 ? "hill" : "plain";
  if (row >= 13) return n < 0.26 ? "forest" : n < 0.38 ? "hill" : "plain";

  // Scattered high ground so the central plain is not a featureless sheet.
  if (n < 0.07) return "hill";
  if (n < 0.13) return "forest";
  return "plain";
}

/** Deterministic value noise in [0, 1). Same board on every machine, no seed plumbing. */
function noise2(col: number, row: number): number {
  let h = Math.imul(col + 0x9e37, 0x85ebca6b) ^ Math.imul(row + 0x79b9, 0xc2b2ae35);
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Carve a 가도 along the straight hex line between two cities. Where the line crosses the
 * 황하 the road becomes a ford, which is exactly how the only northern crossings appear.
 */
function carveRoad(map: GameMap, from: HexCoord, to: HexCoord): void {
  for (const h of hexLine(from, to)) {
    const t = tileAt(map, h);
    if (!t) continue;
    // Mountains stay mountains; a road through a pass would trivialise the western wall.
    if (t.terrain === "mountain") continue;
    t.terrain = "road";
  }
}

/**
 * Assign every land tile within DOMAIN_RADIUS of a city to its nearest city. Ties break on
 * the lower city id so the result is identical on every machine and in every replay.
 */
function assignDomains(map: GameMap, anchors: readonly CityAnchor[]): void {
  const best = new Map<number, { id: CityId; dist: number }>();
  for (const a of anchors) {
    const center = offsetToAxial(a.col, a.row);
    for (const h of hexesInRange(center, DOMAIN_RADIUS)) {
      const { col, row } = axialToOffset(h);
      if (!inBounds(col, row)) continue;
      const idx = row * map.width + col;
      const tile = map.tiles[idx];
      if (tile.terrain === "water") continue;
      const dist = hexDistance(center, h);
      const cur = best.get(idx);
      if (!cur || dist < cur.dist || (dist === cur.dist && a.id < cur.id)) {
        best.set(idx, { id: a.id, dist });
      }
    }
  }
  for (const [idx, pick] of best) map.tiles[idx].domainOf = pick.id;
}

/**
 * Relative neighbourhood graph over the cities: B neighbours A when no third city is
 * closer to both. Gives a sparse, connected "who borders whom" graph without hand-listing
 * it, which the AI uses to pick targets and the supply BFS uses to reason about corridors.
 */
export function computeCityNeighbors(anchors: readonly CityAnchor[]): Record<CityId, CityId[]> {
  const coords = new Map<CityId, HexCoord>(
    anchors.map((a) => [a.id, offsetToAxial(a.col, a.row)] as const),
  );
  const out: Record<CityId, CityId[]> = {};
  for (const a of anchors) {
    const ca = coords.get(a.id)!;
    const neighbors: CityId[] = [];
    for (const b of anchors) {
      if (b.id === a.id) continue;
      const cb = coords.get(b.id)!;
      const dab = hexDistance(ca, cb);
      let blocked = false;
      for (const c of anchors) {
        if (c.id === a.id || c.id === b.id) continue;
        const cc = coords.get(c.id)!;
        if (Math.max(hexDistance(ca, cc), hexDistance(cb, cc)) < dab) {
          blocked = true;
          break;
        }
      }
      if (!blocked) neighbors.push(b.id);
    }
    out[a.id] = neighbors;
  }
  return out;
}

export function createMap(anchors: readonly CityAnchor[], roads: readonly RoadLink[]): GameMap {
  const tiles: Tile[] = [];
  for (let row = 0; row < MAP_HEIGHT; row++) {
    for (let col = 0; col < MAP_WIDTH; col++) {
      const { q, r } = offsetToAxial(col, row);
      tiles.push({
        q,
        r,
        terrain: baseTerrain(col, row),
        cityId: null,
        domainOf: null,
        facility: null,
        unitId: null,
      });
    }
  }
  const map: GameMap = { width: MAP_WIDTH, height: MAP_HEIGHT, tiles };

  // Cities always sit on solid, passable ground regardless of what the rules painted.
  const anchorCoord = new Map<CityId, HexCoord>();
  for (const a of anchors) {
    const h = offsetToAxial(a.col, a.row);
    anchorCoord.set(a.id, h);
    const t = tileAt(map, h);
    if (!t) throw new Error(`city ${a.id} is off the map at ${a.col},${a.row}`);
    t.terrain = "plain";
    t.cityId = a.id;
  }

  for (const [from, to] of roads) {
    const a = anchorCoord.get(from);
    const b = anchorCoord.get(to);
    if (!a || !b) throw new Error(`road links unknown city: ${from} -> ${to}`);
    carveRoad(map, a, b);
  }

  // Re-stamp the city hexes: carveRoad runs straight through them.
  for (const a of anchors) {
    const t = tileAt(map, anchorCoord.get(a.id)!)!;
    t.terrain = "plain";
    t.cityId = a.id;
  }

  assignDomains(map, anchors);
  return map;
}
