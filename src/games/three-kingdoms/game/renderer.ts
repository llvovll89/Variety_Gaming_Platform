/**
 * Canvas map renderer.
 *
 * Layer order matters and is the difference between an ink-wash map and a beige mush:
 * paper, terrain, territory BORDERS (not fills), facilities, cities, overlays, units, FX.
 * Saturated colour is reserved for cities and units so ownership never fights the terrain.
 *
 * Only the visible rectangle is drawn, so panning stays cheap without an offscreen cache.
 */
import {
  hexNeighbors,
  offsetToAxial,
  type HexCoord,
  type Point,
} from "./hex";
import {
  tileCenter,
  visibleOffsetRect,
  worldToScreen,
  type Camera,
  type Viewport,
} from "./camera";
import {
  canRenderHanja,
  createPaperPattern,
  drawGrove,
  drawMounds,
  drawRidges,
  drawWaves,
  fillHex,
  hexPath,
  inkText,
  plate,
  strokeHexEdge,
  type Ctx,
} from "./inkBrush";
import { FACILITIES, HANJA_FONT, HEX_SIZE, PALETTE, TERRAIN_FILL, UNIT_TYPES } from "./constants";
import { tileAt } from "./map";
import type { GameState, Tile } from "./types";

/**
 * Which of the six hex edges faces which HEX_DIRS entry. Derived once from the pointy-top
 * corner angles; getting this wrong draws territory borders on the wrong side.
 */
const EDGE_TO_DIR = [1, 0, 5, 4, 3, 2] as const;

export interface RenderOverlay {
  /** Hex the player currently has selected, if any. */
  selected?: HexCoord | null;
  /** Hex under the pointer. */
  hovered?: HexCoord | null;
  /** Reachable hexes for the selected unit. */
  reachable?: HexCoord[];
  /** Hexes the selected unit may attack. */
  targets?: HexCoord[];
  /** Legal spots while placing a facility. */
  buildable?: HexCoord[];
}

export class MapRenderer {
  private paper: CanvasPattern | null = null;
  private hanja = true;
  private ready = false;

  /** One-time setup that needs a live context: the paper pattern and the Hanja probe. */
  private ensure(ctx: Ctx): void {
    if (this.ready) return;
    this.paper = createPaperPattern(ctx);
    this.hanja = canRenderHanja(ctx);
    this.ready = true;
  }

  /** Korean name when the platform has no Hanja font, so labels never render as tofu. */
  private label(hanja: string, korean: string): string {
    return this.hanja ? hanja : korean;
  }

  render(
    ctx: Ctx,
    state: GameState,
    cam: Camera,
    view: Viewport,
    overlay: RenderOverlay = {},
  ): void {
    this.ensure(ctx);
    const size = HEX_SIZE * cam.zoom;

    ctx.save();
    ctx.fillStyle = this.paper ?? PALETTE.paper;
    ctx.fillRect(0, 0, view.width, view.height);
    ctx.restore();

    const rect = visibleOffsetRect(cam, view);
    const screenOf = (col: number, row: number): Point =>
      worldToScreen(tileCenter(col, row), cam, view);

    this.drawTerrain(ctx, state, cam, view, rect, size, screenOf);
    this.drawTerritory(ctx, state, rect, size, screenOf);
    this.drawFacilities(ctx, state, rect, size, screenOf);
    this.drawOverlay(ctx, cam, view, size, overlay);
    this.drawCities(ctx, state, rect, size, screenOf);
    this.drawUnits(ctx, state, cam, view, size);
  }

  // --- layers ---------------------------------------------------------------

  private drawTerrain(
    ctx: Ctx,
    state: GameState,
    _cam: Camera,
    _view: Viewport,
    rect: ReturnType<typeof visibleOffsetRect>,
    size: number,
    screenOf: (c: number, r: number) => Point,
  ): void {
    const { map } = state;
    // Pass 1: washes.
    for (let row = rect.minRow; row <= rect.maxRow; row++) {
      for (let col = rect.minCol; col <= rect.maxCol; col++) {
        const tile = map.tiles[row * map.width + col];
        if (!tile) continue;
        fillHex(ctx, screenOf(col, row), size, TERRAIN_FILL[tile.terrain]);
      }
    }
    // Pass 2: brushwork. Split from the fills so adjacent hexes never clip each other's marks.
    for (let row = rect.minRow; row <= rect.maxRow; row++) {
      for (let col = rect.minCol; col <= rect.maxCol; col++) {
        const tile = map.tiles[row * map.width + col];
        if (!tile || tile.cityId) continue;
        const c = screenOf(col, row);
        if (tile.terrain === "mountain") drawRidges(ctx, c, size, tile.q, tile.r);
        else if (tile.terrain === "forest") drawGrove(ctx, c, size, tile.q, tile.r);
        else if (tile.terrain === "water") drawWaves(ctx, c, size, tile.q, tile.r);
        else if (tile.terrain === "hill") drawMounds(ctx, c, size, tile.q, tile.r);
      }
    }
    // Pass 3: outline only where the terrain CHANGES. Outlining every hex is what makes an
    // ink map look like a board game.
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(0.6, size * 0.035);
    ctx.lineCap = "round";
    for (let row = rect.minRow; row <= rect.maxRow; row++) {
      for (let col = rect.minCol; col <= rect.maxCol; col++) {
        const tile = map.tiles[row * map.width + col];
        if (!tile) continue;
        const c = screenOf(col, row);
        const here = { q: tile.q, r: tile.r };
        const neighbors = hexNeighbors(here);
        for (let edge = 0; edge < 6; edge++) {
          const other = tileAt(map, neighbors[EDGE_TO_DIR[edge]]);
          if (other && other.terrain === tile.terrain) continue;
          // Draw each shared edge once: the lower-indexed tile owns it.
          if (other && (other.r < tile.r || (other.r === tile.r && other.q < tile.q))) continue;
          strokeHexEdge(ctx, c, size, edge, PALETTE.ink, ctx.lineWidth, 0.28);
        }
      }
    }
    ctx.restore();
  }

  private drawTerritory(
    ctx: Ctx,
    state: GameState,
    rect: ReturnType<typeof visibleOffsetRect>,
    size: number,
    screenOf: (c: number, r: number) => Point,
  ): void {
    const { map } = state;
    const ownerOf = (tile: Tile | null): string | null => {
      if (!tile?.domainOf) return null;
      return state.cities[tile.domainOf]?.faction ?? null;
    };

    // Ownership is carried by the BORDER, not by a fill. A tint was tried and removed: over
    // an already pale terrain wash it washed the whole board out and, worse, looked exactly
    // like the white "you can move here" overlay.
    const borderWidth = Math.max(2, size * 0.085);
    for (let row = rect.minRow; row <= rect.maxRow; row++) {
      for (let col = rect.minCol; col <= rect.maxCol; col++) {
        const tile = map.tiles[row * map.width + col];
        const faction = ownerOf(tile);
        if (!tile || !faction) continue;
        const c = screenOf(col, row);
        const neighbors = hexNeighbors({ q: tile.q, r: tile.r });
        for (let edge = 0; edge < 6; edge++) {
          if (ownerOf(tileAt(map, neighbors[EDGE_TO_DIR[edge]])) === faction) continue;
          strokeHexEdge(ctx, c, size, edge, state.factions[faction].color, borderWidth, 0.85);
        }
      }
    }
  }

  private drawFacilities(
    ctx: Ctx,
    state: GameState,
    rect: ReturnType<typeof visibleOffsetRect>,
    size: number,
    screenOf: (c: number, r: number) => Point,
  ): void {
    const { map } = state;
    for (let row = rect.minRow; row <= rect.maxRow; row++) {
      for (let col = rect.minCol; col <= rect.maxCol; col++) {
        const tile = map.tiles[row * map.width + col];
        if (!tile?.facility) continue;
        const spec = FACILITIES[tile.facility.type];
        const c = screenOf(col, row);
        const building = tile.facility.buildTurnsLeft > 0;

        ctx.save();
        ctx.globalAlpha = building ? 0.4 : 0.95;
        ctx.beginPath();
        ctx.arc(c.x, c.y, size * 0.38, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.paper;
        ctx.fill();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = Math.max(1, size * 0.045);
        if (building) ctx.setLineDash([size * 0.14, size * 0.1]);
        ctx.stroke();
        ctx.restore();

        inkText(ctx, this.label(spec.hanja, spec.label[0]), c, size * 0.44, PALETTE.ink, PALETTE.paper, 1);
        if (building) {
          inkText(
            ctx,
            String(tile.facility.buildTurnsLeft),
            { x: c.x + size * 0.36, y: c.y - size * 0.34 },
            size * 0.3,
            PALETTE.seal,
            PALETTE.paper,
            2,
          );
        }
      }
    }
  }

  private drawOverlay(
    ctx: Ctx,
    cam: Camera,
    view: Viewport,
    size: number,
    overlay: RenderOverlay,
  ): void {
    const at = (h: HexCoord): Point => worldToScreen(tileCenter(...offsetOf(h)), cam, view);

    if (overlay.reachable?.length) {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,0.34)";
      ctx.strokeStyle = "rgba(58,50,38,0.3)";
      ctx.lineWidth = Math.max(0.8, size * 0.035);
      for (const h of overlay.reachable) {
        hexPath(ctx, at(h), size * 0.9);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (overlay.buildable?.length) {
      ctx.save();
      ctx.setLineDash([size * 0.18, size * 0.12]);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = Math.max(1.5, size * 0.06);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      for (const h of overlay.buildable) {
        hexPath(ctx, at(h), size * 0.86);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (overlay.targets?.length) {
      ctx.save();
      ctx.strokeStyle = PALETTE.seal;
      ctx.lineWidth = Math.max(2, size * 0.09);
      for (const h of overlay.targets) {
        hexPath(ctx, at(h), size * 0.9);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (overlay.hovered) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = Math.max(1.2, size * 0.05);
      hexPath(ctx, at(overlay.hovered), size * 0.93);
      ctx.stroke();
      ctx.restore();
    }
    if (overlay.selected) {
      ctx.save();
      ctx.strokeStyle = PALETTE.seal;
      ctx.lineWidth = Math.max(2.4, size * 0.1);
      hexPath(ctx, at(overlay.selected), size * 0.9);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawCities(
    ctx: Ctx,
    state: GameState,
    rect: ReturnType<typeof visibleOffsetRect>,
    size: number,
    screenOf: (c: number, r: number) => Point,
  ): void {
    for (const city of Object.values(state.cities)) {
      const { col, row } = offsetOfCoord(city.coord);
      if (col < rect.minCol || col > rect.maxCol || row < rect.minRow || row > rect.maxRow) continue;
      const c = screenOf(col, row);
      const color = city.faction ? state.factions[city.faction].color : PALETTE.neutral;

      ctx.save();
      ctx.globalAlpha = 0.88;
      fillHex(ctx, c, size * 0.96, color);
      ctx.restore();

      hexPath(ctx, c, size * 0.96);
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.stroke();
      hexPath(ctx, c, size * 0.78);
      ctx.strokeStyle = "rgba(240, 230, 210, 0.75)";
      ctx.lineWidth = Math.max(1, size * 0.035);
      ctx.stroke();

      const name = this.label(city.hanja, city.name);
      // Two-character names get a slightly smaller face so they never overflow the hex.
      const fontPx = size * (name.length > 1 ? 0.44 : 0.56);
      inkText(ctx, name, { x: c.x, y: c.y - size * 0.05 }, fontPx, "#ffffff", PALETTE.ink);

      if (city.defense < city.maxDefense) {
        const w = size * 1.1;
        const h = Math.max(3, size * 0.11);
        const y = c.y + size * 0.6;
        ctx.save();
        ctx.fillStyle = "rgba(58, 50, 38, 0.55)";
        ctx.fillRect(c.x - w / 2, y, w, h);
        ctx.fillStyle = city.defense / city.maxDefense > 0.3 ? "#d8cba6" : PALETTE.seal;
        ctx.fillRect(c.x - w / 2, y, (w * city.defense) / city.maxDefense, h);
        ctx.restore();
      }
    }
  }

  private drawUnits(ctx: Ctx, state: GameState, cam: Camera, view: Viewport, size: number): void {
    for (const unit of Object.values(state.units)) {
      const { col, row } = offsetOfCoord(unit.coord);
      const base = worldToScreen(tileCenter(col, row), cam, view);
      // An army standing in a city would otherwise bury the city's name. Nudge it clear and
      // shrink it a little so both stay readable on the same hex.
      const garrisoned = Boolean(state.map.tiles[row * state.map.width + col]?.cityId);
      const c = garrisoned ? { x: base.x + size * 0.34, y: base.y + size * 0.42 } : base;
      const scale = garrisoned ? 0.62 : 1;
      const color = state.factions[unit.faction].color;
      const spec = UNIT_TYPES[unit.type];

      // Upward triangle: reads as a banner at a glance and never collides with a city hex.
      const h = size * 0.8 * scale;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y - h * 0.72);
      ctx.lineTo(c.x + h * 0.66, c.y + h * 0.5);
      ctx.lineTo(c.x - h * 0.66, c.y + h * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = Math.max(1.4, size * 0.055);
      ctx.stroke();
      ctx.restore();

      inkText(
        ctx,
        this.label(spec.hanja, spec.label[0]),
        { x: c.x, y: c.y + size * 0.02 * scale },
        size * 0.32 * scale,
        "#ffffff",
        "rgba(58,50,38,0.85)",
        2,
      );

      const troops = unit.troops >= 1000
        ? `${(unit.troops / 1000).toFixed(1)}천`
        : String(unit.troops);
      const plateAt = { x: c.x, y: c.y + size * 0.66 * scale };
      const pw = size * 0.86 * scale;
      const ph = size * 0.32 * scale;
      ctx.save();
      plate(ctx, plateAt, pw, ph, ph / 2);
      ctx.fillStyle = PALETTE.paper;
      ctx.fill();
      ctx.strokeStyle = PALETTE.ink;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      inkText(ctx, troops, plateAt, size * 0.24 * scale, PALETTE.ink, PALETTE.paper, 0.5, HANJA_FONT);

      // 사기 on the left, 기력 on the right — two thin arcs, no legend needed.
      this.gauge(ctx, c, size * scale, -1, unit.morale / 100, "#c0562f");
      this.gauge(ctx, c, size * scale, 1, unit.energy / 100, "#3f6f8a");
    }
  }

  private gauge(ctx: Ctx, c: Point, size: number, side: -1 | 1, value: number, color: string): void {
    const r = size * 0.82;
    const start = side === -1 ? Math.PI * 0.62 : Math.PI * 0.38;
    const sweep = Math.PI * 0.34 * Math.max(0, Math.min(1, value));
    ctx.save();
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(58,50,38,0.22)";
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, start, start + side * Math.PI * 0.34, side === -1);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, start, start + side * sweep, side === -1);
    ctx.stroke();
    ctx.restore();
  }
}

// --- small helpers -----------------------------------------------------------

function offsetOfCoord(h: HexCoord): { col: number; row: number } {
  return { col: h.q + (h.r - (h.r & 1)) / 2, row: h.r };
}

function offsetOf(h: HexCoord): [number, number] {
  const o = offsetOfCoord(h);
  return [o.col, o.row];
}

/** Exported for tests that need to walk offset space without importing the whole renderer. */
export function hexToOffset(h: HexCoord): { col: number; row: number } {
  return offsetOfCoord(h);
}

export { offsetToAxial };
