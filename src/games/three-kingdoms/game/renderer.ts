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
  drawGrass,
  drawGrove,
  drawMounds,
  drawRidges,
  drawWaves,
  fillHex,
  hexPath,
  inkText,
  strokeHexEdge,
  type Ctx,
} from "./inkBrush";
import { FACILITIES, HEX_SIZE, PALETTE, TERRAIN_FILL, UNIT_TYPES } from "./constants";
import {
  banner,
  barrackYard,
  crossbowTower,
  DETAIL_THRESHOLD,
  farmField,
  formation,
  fortCamp,
  groundShadow,
  mapLabel,
  marketStalls,
  walledCity,
} from "./structures";
import { tileAt } from "./map";
import { fxProgress, type Fx } from "./animation";
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
  /** A unit mid-march, drawn at an interpolated world position instead of on its tile. */
  moving?: { unitId: number; point: Point };
  /** Floating damage numbers and callouts. */
  fx?: Fx[];
  /** Frame timestamp, for anything that animates. */
  now?: number;
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
    this.drawUnits(ctx, state, cam, view, size, overlay.moving);
    this.drawFx(ctx, cam, view, size, overlay.fx ?? [], overlay.now ?? 0);
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
        else if (size >= DETAIL_THRESHOLD && !tile.facility) {
          drawGrass(ctx, c, size, tile.q, tile.r);
        }
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

  /**
   * Facilities. Each type gets a recognisable little building rather than a glyph in a
   * circle, because the whole point of building on the map is that you can see what you
   * built and so can the enemy who comes to burn it.
   */
  private drawFacilities(
    ctx: Ctx,
    state: GameState,
    rect: ReturnType<typeof visibleOffsetRect>,
    size: number,
    screenOf: (c: number, r: number) => Point,
  ): void {
    const { map } = state;
    const detailed = size >= DETAIL_THRESHOLD;
    for (let row = rect.minRow; row <= rect.maxRow; row++) {
      for (let col = rect.minCol; col <= rect.maxCol; col++) {
        const tile = map.tiles[row * map.width + col];
        if (!tile?.facility) continue;
        const f = tile.facility;
        const spec = FACILITIES[f.type];
        const c = screenOf(col, row);
        const building = f.buildTurnsLeft > 0;
        const color = state.factions[f.faction]?.color ?? PALETTE.neutral;

        ctx.save();
        if (building) ctx.globalAlpha = 0.45;

        if (detailed) {
          const line = Math.max(0.8, size * 0.03);
          const ground = c.y + size * 0.4;
          const w = size * 1.15;
          groundShadow(ctx, { x: c.x, y: ground + size * 0.04 }, w * 0.8, size * 0.15);
          if (f.type === "farm") farmField(ctx, { x: c.x, y: ground }, w, line);
          else if (f.type === "market") marketStalls(ctx, { x: c.x, y: ground }, w, line);
          else if (f.type === "barracks") barrackYard(ctx, { x: c.x, y: ground }, w, line);
          else if (f.type === "fort") fortCamp(ctx, { x: c.x, y: ground }, w, color, line);
          else crossbowTower(ctx, { x: c.x, y: ground }, w, line);
        } else {
          ctx.beginPath();
          ctx.arc(c.x, c.y, size * 0.36, 0, Math.PI * 2);
          ctx.fillStyle = PALETTE.paper;
          ctx.fill();
          ctx.strokeStyle = PALETTE.ink;
          ctx.lineWidth = Math.max(1, size * 0.045);
          if (building) ctx.setLineDash([size * 0.14, size * 0.1]);
          ctx.stroke();
          inkText(ctx, this.label(spec.hanja, spec.label[0]), c, size * 0.42, PALETTE.ink, PALETTE.paper, 1);
        }
        ctx.restore();

        if (building && size >= 18) {
          // Months remaining, on a plate so it reads over whatever is underneath. Below this
          // size the plate is wider than the hex and turns the map into a wall of tags.
          mapLabel(
            ctx,
            { x: c.x, y: c.y - size * 0.62 },
            `${spec.label} ${f.buildTurnsLeft}달`,
            Math.max(9, size * 0.24),
            PALETTE.seal,
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

  /**
   * Cities. Zoomed out they stay flat coloured hexes with a big Hanja, which is what an
   * overview needs; zoomed in they become walled compounds. The name always rides on a
   * paper plate below the hex rather than on top of the artwork, so it stays readable at
   * every zoom and never fights the roofs for space.
   */
  private drawCities(
    ctx: Ctx,
    state: GameState,
    rect: ReturnType<typeof visibleOffsetRect>,
    size: number,
    screenOf: (c: number, r: number) => Point,
  ): void {
    const detailed = size >= DETAIL_THRESHOLD;
    for (const city of Object.values(state.cities)) {
      const { col, row } = offsetOfCoord(city.coord);
      if (col < rect.minCol || col > rect.maxCol || row < rect.minRow || row > rect.maxRow) continue;
      const c = screenOf(col, row);
      const color = city.faction ? state.factions[city.faction].color : PALETTE.neutral;
      const ratio = city.maxDefense > 0 ? city.defense / city.maxDefense : 1;
      const name = this.label(city.hanja, city.name);

      if (!detailed) {
        ctx.save();
        ctx.globalAlpha = 0.88;
        fillHex(ctx, c, size * 0.96, color);
        ctx.restore();
        hexPath(ctx, c, size * 0.96);
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = Math.max(2, size * 0.09);
        ctx.stroke();
        inkText(ctx, name, { x: c.x, y: c.y - size * 0.05 }, size * (name.length > 1 ? 0.44 : 0.56), "#ffffff", PALETTE.ink);
        if (ratio < 1) this.damageBar(ctx, c, size, ratio);
        continue;
      }

      // A faction-tinted platform under the compound. Without it the only coloured thing on
      // a detailed city hex is the gate arch, and at a glance you cannot tell whose it is.
      ctx.save();
      ctx.globalAlpha = 0.3;
      fillHex(ctx, c, size * 0.97, color);
      ctx.restore();
      hexPath(ctx, c, size * 0.97);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, size * 0.075);
      ctx.stroke();

      walledCity(
        ctx, c, size, color, city.scale, ratio,
        Math.max(0.9, size * 0.035),
        city.coord.q * 31 + city.coord.r,
        (city.coord.q + city.coord.r) * 0.7,
      );
      mapLabel(ctx, { x: c.x, y: c.y + size * 0.86 }, name, Math.max(10, size * 0.34));
      if (ratio < 1) this.damageBar(ctx, c, size, ratio, size * 1.08);
    }
  }

  private damageBar(ctx: Ctx, c: Point, size: number, ratio: number, offset = size * 0.6): void {
    const w = size * 1.1;
    const h = Math.max(3, size * 0.1);
    const y = c.y + offset;
    ctx.save();
    ctx.fillStyle = "rgba(58, 50, 38, 0.55)";
    ctx.fillRect(c.x - w / 2, y, w, h);
    ctx.fillStyle = ratio > 0.3 ? "#d8cba6" : PALETTE.seal;
    ctx.fillRect(c.x - w / 2, y, w * ratio, h);
    ctx.restore();
  }

  /**
   * Armies. Zoomed out a triangle is the clearest possible token; zoomed in the same hex
   * carries a banner and a knot of soldiers whose silhouettes say which 병종 it is without
   * anyone reading a glyph.
   */
  /**
   * Armies. Zoomed out a triangle is the clearest possible token; zoomed in the same hex
   * carries a banner and a knot of soldiers whose silhouettes say which 병종 it is without
   * anyone having to read a glyph.
   *
   * An army sitting in one of its own cities is drawn as a compact banner badge in the
   * corner of the hex instead of a full formation — a whole regiment painted over the
   * gatehouse buried the city it was supposed to be defending.
   */
  private drawUnits(
    ctx: Ctx,
    state: GameState,
    cam: Camera,
    view: Viewport,
    size: number,
    moving?: { unitId: number; point: Point },
  ): void {
    const detailed = size >= DETAIL_THRESHOLD;
    for (const unit of Object.values(state.units)) {
      const { col, row } = offsetOfCoord(unit.coord);
      const marching = moving?.unitId === unit.id;
      const base = marching
        ? worldToScreen(moving.point, cam, view)
        : worldToScreen(tileCenter(col, row), cam, view);
      // A unit in transit is never "in a city" for drawing purposes, even if its destination
      // tile happens to be one.
      const garrisoned = !marching && Boolean(state.map.tiles[row * state.map.width + col]?.cityId);
      const color = state.factions[unit.faction].color;
      const spec = UNIT_TYPES[unit.type];
      const glyph = this.label(spec.hanja, spec.label[0]);

      if (garrisoned) {
        this.garrisonBadge(ctx, base, size, color, glyph, unit.troops);
        continue;
      }

      const line = Math.max(0.9, size * 0.032);
      if (detailed) {
        const ground = base.y + size * 0.34;
        formation(ctx, { x: base.x + size * 0.1, y: ground }, size * 1.05, color, unit.type, line, unit.id);
        banner(ctx, { x: base.x - size * 0.52, y: ground }, size * 0.78, color, glyph, line, unit.id * 0.9);
      } else {
        const h = size * 0.8;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(base.x, base.y - h * 0.72);
        ctx.lineTo(base.x + h * 0.66, base.y + h * 0.5);
        ctx.lineTo(base.x - h * 0.66, base.y + h * 0.5);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = Math.max(1.4, size * 0.055);
        ctx.stroke();
        ctx.restore();
        inkText(ctx, glyph, { x: base.x, y: base.y + size * 0.02 }, size * 0.32, "#ffffff", "rgba(58,50,38,0.85)", 2);
      }

      // Troop count and condition, stacked clear of the artwork. Suppressed when the hex is
      // too small for the text to be anything but clutter.
      if (size >= 16) {
        const plateY = base.y + size * (detailed ? 0.62 : 0.66);
        mapLabel(ctx, { x: base.x, y: plateY }, this.troopText(unit.troops), Math.max(9, size * 0.25));
        this.conditionBar(ctx, base.x, plateY + size * 0.26, size * 0.9, unit.morale, unit.energy);
      }
    }
  }

  /** Rising, fading callouts over the board. Drawn last so nothing covers them. */
  private drawFx(
    ctx: Ctx,
    cam: Camera,
    view: Viewport,
    size: number,
    fx: Fx[],
    now: number,
  ): void {
    for (const f of fx) {
      const t = fxProgress(f, now);
      const { col, row } = offsetOfCoord(f.at);
      const at = worldToScreen(tileCenter(col, row), cam, view);
      ctx.save();
      ctx.globalAlpha = 1 - t * t;
      inkText(
        ctx,
        f.text,
        { x: at.x, y: at.y - size * (0.2 + t * 0.9) },
        Math.max(12, size * 0.4),
        f.color,
        "rgba(244,237,222,0.92)",
        Math.max(2, size * 0.09),
      );
      ctx.restore();
    }
  }

  private troopText(troops: number): string {
    return troops >= 1000 ? `${(troops / 1000).toFixed(1)}천` : String(troops);
  }

  /** Compact corner marker for an army inside a friendly city. */
  private garrisonBadge(
    ctx: Ctx,
    center: Point,
    size: number,
    color: string,
    glyph: string,
    troops: number,
  ): void {
    const at = { x: center.x + size * 0.52, y: center.y - size * 0.42 };
    const r = size * 0.24;
    ctx.save();
    ctx.beginPath();
    ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.stroke();
    ctx.restore();
    inkText(ctx, glyph, at, r * 1.15, "#ffffff", "rgba(58,50,38,0.8)", 1.5);
    if (size >= 20) {
      mapLabel(ctx, { x: at.x, y: at.y + r * 1.5 }, this.troopText(troops), Math.max(8, size * 0.2));
    }
  }

  /** Two stacked slivers: 사기 on top, 기력 below. Replaces the arcs, which vanished. */
  private conditionBar(
    ctx: Ctx,
    cx: number,
    y: number,
    w: number,
    morale: number,
    energy: number,
  ): void {
    const h = Math.max(2, w * 0.045);
    const rows: [number, string][] = [
      [morale / 100, "#c0562f"],
      [energy / 100, "#3f6f8a"],
    ];
    ctx.save();
    for (const [index, [value, color]] of rows.entries()) {
      const top = y + index * (h + 1);
      ctx.fillStyle = "rgba(58,50,38,0.28)";
      ctx.fillRect(cx - w / 2, top, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(cx - w / 2, top, w * Math.max(0, Math.min(1, value)), h);
    }
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
