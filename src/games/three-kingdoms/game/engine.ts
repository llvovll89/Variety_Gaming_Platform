/**
 * The engine owns the canvas, the camera, the selection and the authoritative GameState.
 *
 * Unlike every other game in this arcade there is NO fixed-step simulation here. A turn
 * based game has nothing to integrate, so the rAF loop exists purely to draw: it starts
 * when something changes and cancels itself the moment the board is at rest. A strategy
 * map must idle at 0% CPU.
 */
import {
  clampCamera,
  clampZoom,
  fitToView,
  focusOn,
  panBy,
  screenToHex,
  zoomAt,
  worldToScreen,
  type Camera,
  type Viewport,
} from "./camera";
import { PointerTracker } from "./input";
import { MapRenderer, type RenderOverlay } from "./renderer";
import { UIStore } from "./uiStore";
import { cityAt, createGameState, standings, unitAt } from "./state";
import { factionFood, factionGold, factionOfficers } from "./state";
import { citiesOf, unitsOf } from "./state";
import { buildableTiles, cancelInternal, queueInternal } from "./internal";
import type { CommandResult } from "./internal";
import { dispatch, moveUnit, returnToCity, type DispatchRequest } from "./commands";
import { resolveAttack } from "./combat";
import { canCapture, captureCity } from "./siege";
import { attackTargets, reachable } from "./pathfinding";
import { logEvent } from "./events";
import { hexKey } from "./hex";
import {
  ageFx, movePoint, present, type BlockingAnim, type Fx,
} from "./animation";
import { ANIM } from "./constants";
import { beginTurn, type TurnRunner } from "./turn";
import { saveGame } from "./save";
import { HEX_SIZE } from "./constants";
import { axialToPixel, hexEquals, type HexCoord, type Point } from "./hex";
import type { FacilityType, FactionId, GameState, InternalKind, TacticId, UISnapshot, Unit } from "./types";
import type { GameEvent } from "./events";
import { tileAt } from "./map";

export type Selection =
  | { kind: "none" }
  | { kind: "city"; cityId: string }
  | { kind: "unit"; unitId: number };

export class GameEngine {
  readonly ui = new UIStore();

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer = new MapRenderer();
  private pointers = new PointerTracker();

  private state: GameState;
  private camera: Camera = { x: 0, y: 0, zoom: 1 };
  private view: Viewport = { width: 1, height: 1 };
  private selection: Selection = { kind: "none" };
  private hovered: HexCoord | null = null;
  private placement: {
    cityId: string;
    type: FacilityType;
    officerIds: string[];
    spots: HexCoord[];
  } | null = null;
  /** Cached movement and firing solution for the selected unit, recomputed on every change. */
  private reach: HexCoord[] = [];
  private targets: HexCoord[] = [];
  private pendingTactic: TacticId | null = null;

  private rafId = 0;
  private dirty = true;
  private running = false;

  /** Turn playback: the step machine plus how much screen time it has already spent. */
  private playback: { runner: TurnRunner; spent: number } | null = null;
  private blocking: { anim: BlockingAnim; start: number } | null = null;
  private fx: Fx[] = [];

  constructor(canvas: HTMLCanvasElement, playerFactionId: FactionId, seed?: number) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
    this.state = createGameState(playerFactionId, seed);
  }

  // --- lifecycle ------------------------------------------------------------

  start(): void {
    if (this.running) return;
    this.running = true;
    // Open on the player's own capital at a zoom where the 2.5D buildings actually render,
    // not fitted to the whole board. Fit-to-view put every hex below the detail threshold
    // and gave a first-time player twelve identical beige dots and no idea where they were.
    this.camera = this.openingCamera();
    this.markDirty();
    this.publish();
    this.exposeDebugHook();
  }

  /** Frame the player's biggest city, close enough to see what is on the board. */
  private openingCamera(): Camera {
    const home = citiesOf(this.state, this.state.playerFactionId)
      .sort((a, b) => b.maxTroops - a.maxTroops)[0];
    const fitted = fitToView(this.view);
    if (!home) return fitted;
    const zoom = clampZoom(Math.max(1.15, fitted.zoom));
    return clampCamera(focusOn({ ...fitted, zoom }, home.coord), this.view);
  }

  /**
   * Dev-only console handle, following the `window.__ranger` precedent in this repo. It also
   * gives the screenshot harness a way to aim at a city through the real hit-test path
   * rather than guessing pixel coordinates.
   */
  private exposeDebugHook(): void {
    if (!import.meta.env.DEV) return;
    const api = {
      engine: this,
      state: () => this.state,
      screenOfCity: (cityId: string) => {
        const city = this.state.cities[cityId];
        if (!city) return null;
        return worldToScreen(axialToPixel(city.coord, HEX_SIZE), this.camera, this.view);
      },
      screenOfHex: (hex: HexCoord) =>
        worldToScreen(axialToPixel(hex, HEX_SIZE), this.camera, this.view),
      reach: () => this.reach,
      targets: () => this.targets,
      selection: () => this.selection,
      firstBuildSpot: () => {
        const spot = this.placement?.spots[0];
        if (!spot) return null;
        return worldToScreen(axialToPixel(spot, HEX_SIZE), this.camera, this.view);
      },
      summary: () => {
        const s = this.state;
        const f = s.playerFactionId;
        return {
          turn: s.turn,
          date: `${s.year}/${s.month}`,
          gold: factionGold(s, f),
          food: factionFood(s, f),
          cities: citiesOf(s, f).map((c) => ({
            name: c.name, commerce: c.commerce, agriculture: c.agriculture,
            order: c.order, troops: c.troops, gold: c.gold, food: c.food,
          })),
          facilities: s.map.tiles.filter((t) => t.facility).length,
          queued: s.internalOrders.length,
          log: s.log.slice(-6).map((l) => l.text),
        };
      },
    };
    (window as unknown as Record<string, unknown>).__tk = api;
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.pointers.clear();
  }

  resize(width: number, height: number, dpr: number): void {
    this.view = { width, height };
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera = clampCamera(this.camera, this.view);
    this.markDirty();
  }

  /**
   * Schedule exactly one frame. Everything that changes what the board looks like calls
   * this; nothing else drives the loop.
   */
  markDirty(): void {
    this.dirty = true;
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    this.rafId = 0;
    if (!this.running) return;
    const animating = this.advance(now);
    if (this.dirty || animating) {
      this.dirty = false;
      this.draw(now);
    }
    // Keep the loop alive only while something is actually moving. A turn-based board must
    // idle at zero.
    if (animating) this.rafId = requestAnimationFrame(this.frame);
  };

  /**
   * Advance playback by one frame. Returns whether anything is still in motion.
   *
   * Only events the player can see or has a stake in get screen time, and the whole turn is
   * capped: past the budget the rest is applied instantly and lands in the log. Watching six
   * rival factions shuffle armies for ninety seconds is how a strategy game loses a player.
   */
  private advance(now: number): boolean {
    const before = this.fx.length;
    this.fx = ageFx(this.fx, now);
    let changed = this.fx.length !== before || this.fx.length > 0;

    if (this.blocking) {
      if (now - this.blocking.start < this.blocking.anim.ms) return true;
      this.playback = this.playback
        ? { ...this.playback, spent: this.playback.spent + this.blocking.anim.ms }
        : null;
      this.blocking = null;
      changed = true;
    }

    if (!this.playback) return changed;

    // Pull events until one of them is worth watching, or the turn runs out.
    for (;;) {
      const event = this.playback.runner.next(this.state);
      if (!event) {
        this.finishPlayback();
        return true;
      }
      const overBudget = this.playback.spent >= ANIM.aiBudgetMs;
      const shown = overBudget ? null : present(event, now);
      if (!shown) continue;
      if (shown.fx.length > 0) this.fx.push(...shown.fx);
      if (shown.focus && this.worthWatching(shown.focus, event)) this.focus(shown.focus);
      if (shown.blocking) {
        this.blocking = { anim: shown.blocking, start: now };
        return true;
      }
      if (shown.fx.length > 0) return true;
    }
  }

  /** Is this somewhere the player would want the camera to go? */
  private worthWatching(hex: HexCoord, event: GameEvent): boolean {
    const mine = this.state.playerFactionId;
    if (event.kind === "capture") return true;
    const tile = tileAt(this.state.map, hex);
    if (tile?.cityId && this.state.cities[tile.cityId]?.faction === mine) return true;
    if (tile?.domainOf && this.state.cities[tile.domainOf]?.faction === mine) return true;
    if (tile?.unitId != null && this.state.units[tile.unitId]?.faction === mine) return true;
    return false;
  }

  private finishPlayback(): void {
    this.playback = null;
    this.blocking = null;
    const selected = this.selection.kind === "unit" ? this.state.units[this.selection.unitId] : null;
    if (this.selection.kind === "unit" && !selected) this.selection = { kind: "none" };
    if (selected) this.refreshUnitOverlay(selected);
    saveGame(this.state);
    this.markDirty();
    this.publish();
  }

  /** Drop the remaining animation and settle the month at once. */
  skipPlayback(): void {
    if (!this.playback) return;
    this.playback.runner.drain(this.state);
    this.fx = [];
    this.finishPlayback();
  }

  private draw(now = performance.now()): void {
    const moving = this.blocking?.anim.kind === "move"
      ? {
          unitId: this.blocking.anim.unitId,
          point: movePoint(this.blocking.anim, (now - this.blocking.start) / this.blocking.anim.ms),
        }
      : undefined;
    const overlay: RenderOverlay = {
      selected: this.selectedHex(),
      hovered: this.hovered,
      buildable: this.placement?.spots,
      reachable: this.reach,
      targets: this.targets,
      moving,
      fx: this.fx,
      now,
    };
    this.renderer.render(this.ctx, this.state, this.camera, this.view, overlay);
  }

  // --- input ----------------------------------------------------------------

  pointerDown(id: number, p: Point): void {
    this.pointers.down(id, p);
  }

  pointerMove(id: number, p: Point): void {
    const gesture = this.pointers.move(id, p);
    if (gesture?.pan) {
      this.camera = clampCamera(panBy(this.camera, gesture.pan.dx, gesture.pan.dy), this.view);
      this.markDirty();
    }
    if (gesture?.pinch) {
      this.camera = clampCamera(
        zoomAt(this.camera, gesture.pinch.factor, gesture.pinch.anchor, this.view),
        this.view,
      );
      this.markDirty();
    }
    if (this.pointers.pointerCount === 0) this.setHover(p);
  }

  pointerUp(id: number): void {
    const tap = this.pointers.up(id);
    if (tap) this.select(screenToHex(tap, this.camera, this.view));
  }

  pointerCancel(id: number): void {
    this.pointers.cancel(id);
  }

  pointerLeave(): void {
    if (this.hovered) {
      this.hovered = null;
      this.markDirty();
    }
  }

  wheel(deltaY: number, at: Point): void {
    const factor = Math.exp(-deltaY * 0.0016);
    this.camera = clampCamera(zoomAt(this.camera, factor, at, this.view), this.view);
    this.markDirty();
  }

  private setHover(p: Point): void {
    const hex = screenToHex(p, this.camera, this.view);
    if (this.hovered && hexEquals(this.hovered, hex)) return;
    this.hovered = hex;
    this.markDirty();
  }

  // --- selection ------------------------------------------------------------

  // --- facility placement ---------------------------------------------------

  /**
   * Enter tile-picking mode for a facility. Building is a spatial decision — near the front
   * it gets razed, in the rear it is safe but useless — so the tile is chosen on the map
   * rather than from a list.
   */
  startPlacement(cityId: string, type: FacilityType, officerIds: string[]): CommandResult {
    if (this.state.phase !== "player") return { ok: false, reason: "지금은 지시할 수 없습니다." };
    const spots = buildableTiles(this.state, cityId, type);
    if (spots.length === 0) return { ok: false, reason: "지을 자리가 없습니다." };
    this.placement = { cityId, type, officerIds: [...officerIds], spots };
    this.markDirty();
    this.publish();
    return { ok: true };
  }

  cancelPlacement(): void {
    if (!this.placement) return;
    this.placement = null;
    this.markDirty();
    this.publish();
  }

  /**
   * A tap while one of your armies is selected means "go there" or "hit that" before it
   * means "select something else". That ordering is what makes the map feel like a board
   * rather than an inspector.
   */
  private actWithSelectedUnit(hex: HexCoord): boolean {
    if (this.selection.kind !== "unit") return false;
    const unit = this.state.units[this.selection.unitId];
    if (!unit || unit.faction !== this.state.playerFactionId) return false;
    if (this.state.phase !== "player") return false;

    if (this.targets.some((t) => hexEquals(t, hex))) {
      const tactic = this.pendingTactic ?? undefined;
      this.pendingTactic = null;
      const outcome = resolveAttack(this.state, unit, hex, tactic);
      for (const event of outcome.events) logEvent(this.state, event);
      this.afterUnitAction(unit.id);
      return true;
    }

    if (this.reach.some((t) => hexEquals(t, hex))) {
      const result = moveUnit(this.state, unit.id, hex);
      if (result.ok) {
        for (const event of result.events ?? []) logEvent(this.state, event);
        this.afterUnitAction(unit.id);
        return true;
      }
    }
    return false;
  }

  /** Recompute overlays and republish after anything a unit did. */
  private afterUnitAction(unitId: number): void {
    const unit = this.state.units[unitId];
    if (!unit) {
      this.selection = { kind: "none" };
      this.reach = [];
      this.targets = [];
    } else {
      this.refreshUnitOverlay(unit);
    }
    this.markDirty();
    this.publish();
  }

  private refreshUnitOverlay(unit: Unit): void {
    if (unit.faction !== this.state.playerFactionId) {
      this.reach = [];
      this.targets = [];
      return;
    }
    const map = reachable(this.state, unit);
    const origin = hexKey(unit.coord);
    this.reach = [...map.entries()].filter(([k]) => k !== origin).map(([, e]) => e.hex);
    this.targets = attackTargets(this.state, unit);
  }

  /** Arm a 전법; the next tap on a valid target uses it. */
  setTactic(tactic: TacticId | null): void {
    this.pendingTactic = tactic;
    this.markDirty();
    this.publish();
  }

  sendOut(req: DispatchRequest): CommandResult {
    if (this.state.phase !== "player") return { ok: false, reason: "지금은 출진할 수 없습니다." };
    const city = this.state.cities[req.cityId];
    const result = dispatch(this.state, req);
    if (result.ok && city) {
      logEvent(this.state, {
        kind: "dispatch",
        cityId: city.id,
        at: city.coord,
        leader: this.state.officers[req.officerIds[0]]?.name ?? "부대",
        troops: req.troops,
      });
      // Select the new army straight away — it is what the player wants to look at next.
      const fresh = Object.values(this.state.units).find((u) => u.id === this.state.nextUnitId - 1);
      if (fresh) {
        this.selection = { kind: "unit", unitId: fresh.id };
        this.refreshUnitOverlay(fresh);
      }
      this.markDirty();
      this.publish();
    }
    return result;
  }

  bringHome(unitId: number): CommandResult {
    const result = returnToCity(this.state, unitId);
    if (result.ok) {
      this.selection = { kind: "none" };
      this.reach = [];
      this.targets = [];
      this.markDirty();
      this.publish();
    }
    return result;
  }

  /** March through a breached gate. */
  enterCity(unitId: number, cityId: string): CommandResult {
    const unit = this.state.units[unitId];
    const city = this.state.cities[cityId];
    if (!unit || !city) return { ok: false, reason: "대상이 없습니다." };
    const check = canCapture(this.state, unit, city);
    if (!check.ok) return check;
    for (const event of captureCity(this.state, unit, city)) logEvent(this.state, event);
    this.afterUnitAction(unitId);
    return { ok: true };
  }

  select(hex: HexCoord): void {
    // While placing, a tap is an answer to "where?" rather than a new selection.
    if (this.placement) {
      const { cityId, type, officerIds, spots } = this.placement;
      if (spots.some((s) => hexEquals(s, hex))) {
        const result = queueInternal(this.state, cityId, "build", officerIds, hex, type);
        if (result.ok) {
          this.placement = null;
          this.markDirty();
          this.publish();
          return;
        }
      }
      // Tapping anywhere else backs out rather than silently doing nothing.
      this.placement = null;
      this.markDirty();
      this.publish();
      return;
    }

    if (this.actWithSelectedUnit(hex)) return;

    this.pendingTactic = null;
    const unit = unitAt(this.state, hex);
    if (unit) {
      this.selection = { kind: "unit", unitId: unit.id };
      this.refreshUnitOverlay(unit);
    } else {
      const city = cityAt(this.state, hex);
      this.selection = city ? { kind: "city", cityId: city.id } : { kind: "none" };
      this.reach = [];
      this.targets = [];
    }
    this.markDirty();
    this.publish();
  }

  clearSelection(): void {
    this.selection = { kind: "none" };
    this.reach = [];
    this.targets = [];
    this.pendingTactic = null;
    this.markDirty();
    this.publish();
  }

  focus(hex: HexCoord): void {
    this.camera = clampCamera(focusOn(this.camera, hex), this.view);
    this.markDirty();
  }

  private selectedHex(): HexCoord | null {
    if (this.selection.kind === "city") return this.state.cities[this.selection.cityId]?.coord ?? null;
    if (this.selection.kind === "unit") return this.state.units[this.selection.unitId]?.coord ?? null;
    return null;
  }

  /** Read-only access for panels that need more than the snapshot carries. */
  getState(): GameState {
    return this.state;
  }

  // --- player commands ------------------------------------------------------

  issueOrder(
    cityId: string,
    kind: InternalKind,
    officerIds: string[],
    buildAt?: HexCoord,
    buildType?: FacilityType,
  ): CommandResult {
    if (this.state.phase !== "player") return { ok: false, reason: "지금은 지시할 수 없습니다." };
    const result = queueInternal(this.state, cityId, kind, officerIds, buildAt, buildType);
    if (result.ok) {
      this.markDirty();
      this.publish();
    }
    return result;
  }

  cancelOrder(index: number): CommandResult {
    if (this.state.phase !== "player") return { ok: false, reason: "지금은 취소할 수 없습니다." };
    const result = cancelInternal(this.state, index);
    if (result.ok) {
      this.markDirty();
      this.publish();
    }
    return result;
  }

  /**
   * Resolve the month. Drained synchronously for now — nothing on the board moves yet. When
   * unit commands land this becomes a stepped drain driven by the animation queue, which is
   * exactly what the TurnRunner shape is for.
   */
  endTurn(): void {
    if (this.state.phase !== "player") return;
    this.placement = null;
    this.reach = [];
    this.targets = [];
    this.pendingTactic = null;
    // Hand the month to the step machine and let the frame loop play it out, rather than
    // draining it here. This is the whole reason turn.ts is a step machine.
    this.playback = { runner: beginTurn(this.state), spent: 0 };
    this.markDirty();
    this.publish();
  }

  save(): void {
    saveGame(this.state);
  }

  /** Replace the board with a restored save. */
  adopt(state: GameState): void {
    this.state = state;
    this.selection = { kind: "none" };
    this.placement = null;
    this.markDirty();
    this.publish();
  }

  // --- snapshot -------------------------------------------------------------

  private publish(): void {
    const s = this.state;
    const f = s.factions[s.playerFactionId];
    const snapshot: UISnapshot = {
      screen: s.result === "playing" ? "playing" : "ended",
      year: s.year,
      month: s.month,
      turn: s.turn,
      result: s.result,
      player: {
        name: f.name,
        color: f.color,
        gold: factionGold(s, f.id),
        food: factionFood(s, f.id),
        cities: citiesOf(s, f.id).length,
        units: unitsOf(s, f.id).length,
        officers: factionOfficers(s, f.id).length,
      },
      selected: this.selection,
      pendingTactic: this.pendingTactic,
      placement: this.placement
        ? { cityId: this.placement.cityId, type: this.placement.type }
        : null,
      log: s.log.slice(-40),
      busy: this.playback !== null || s.phase !== "player",
      standings: standings(s),
    };
    this.ui.publish(snapshot);
  }
}
