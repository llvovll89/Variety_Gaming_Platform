/**
 * Turn resolution, as a STEP MACHINE rather than one big function.
 *
 * `next()` advances the game by exactly one presentable increment and hands back what just
 * happened. The engine calls it whenever the current animation finishes; a test calls it in
 * a tight loop with no timing at all. That is the whole reason for this shape: GameState is
 * always current and authoritative, so the renderer never has to reconstruct a past frame,
 * and the 가속 button is one line (`while (runner.next(state))`).
 *
 * Steps may enqueue further steps, which is how the AI phase expands into one step per unit
 * command without this file knowing anything about how those commands were chosen.
 */
import { collectIncome, regenCities, resolveInternalOrders, tickBuilds } from "./internal";
import { logEvent, type GameEvent } from "./events";
import { planInternal, planMilitary, type AiCommand } from "./ai";
import { dispatch, moveUnit, returnToCity } from "./commands";
import { resolveAttack, settle } from "./combat";
import { canCapture, captureCity, decayUndefendedCities } from "./siege";
import { resolveSupply } from "./supply";
import { evaluateVictory } from "./victory";
import { isOwnDomain } from "./state";
import { tileAt } from "./map";
import { hexNeighbors } from "./hex";
import { BALANCE, UNIT_TYPES } from "./constants";
import type { GameState, Unit } from "./types";

type Push = (step: Step) => void;
type Step = (state: GameState, push: Push) => GameEvent | GameEvent[] | null;

const MAX_STEPS = 20000;

export class TurnRunner {
  private queue: Step[] = [];
  private pending: GameEvent[] = [];
  private guard = 0;

  constructor(steps: Step[]) {
    this.queue = [...steps];
  }

  get done(): boolean {
    return this.queue.length === 0 && this.pending.length === 0;
  }

  /**
   * Advance one increment. Returns the event to show, or null when the turn is finished.
   * Events are logged here so the log stays in order no matter how fast it is drained.
   */
  next(state: GameState): GameEvent | null {
    for (;;) {
      if (this.pending.length > 0) {
        const event = this.pending.shift()!;
        logEvent(state, event);
        return event;
      }
      if (this.queue.length === 0) return null;
      if (++this.guard > MAX_STEPS) throw new Error("turn resolution did not terminate");
      const step = this.queue.shift()!;
      const produced = step(state, (s) => this.queue.unshift(s));
      if (!produced) continue;
      const events = Array.isArray(produced) ? produced : [produced];
      if (events.length > 0) this.pending.push(...events);
    }
  }

  /** Run the rest of the turn immediately. Used by the 가속 button and by every test. */
  drain(state: GameState): GameEvent[] {
    const out: GameEvent[] = [];
    for (;;) {
      const event = this.next(state);
      if (!event) return out;
      out.push(event);
    }
  }
}

/** Run one AI decision. Player clicks reach exactly the same functions. */
function executeAi(state: GameState, command: AiCommand): GameEvent[] {
  switch (command.kind) {
    case "dispatch": {
      const city = state.cities[command.cityId];
      const result = dispatch(state, command);
      if (!result.ok || !city) return [];
      const leader = state.officers[command.officerIds[0]]?.name ?? "부대";
      return [{
        kind: "dispatch", cityId: city.id, at: city.coord, leader, troops: command.troops,
      }];
    }
    case "move": {
      const unit = state.units[command.unitId];
      if (!unit) return [];
      const from = unit.coord;
      const result = moveUnit(state, command.unitId, command.to);
      if (!result.ok) return [];
      return [
        { kind: "move", unitId: command.unitId, from, to: command.to, path: [command.to] },
        ...(result.events ?? []),
      ];
    }
    case "attack": {
      const unit = state.units[command.unitId];
      if (!unit) return [];
      const events = resolveAttack(state, unit, command.target, command.tactic).events;
      // An assault that opens the gate is followed straight through. Making the AI wait a
      // month would just let the defender patch the wall back up.
      const tile = tileAt(state.map, command.target);
      const city = tile?.cityId ? state.cities[tile.cityId] : null;
      const survivor = state.units[command.unitId];
      if (city && survivor && canCapture(state, survivor, city).ok) {
        events.push(...captureCity(state, survivor, city));
      }
      return events;
    }
    case "capture": {
      const unit = state.units[command.unitId];
      const city = state.cities[command.cityId];
      if (!unit || !city) return [];
      return captureCity(state, unit, city);
    }
    case "return": {
      const result = returnToCity(state, command.unitId);
      return result.ok ? [] : [];
    }
  }
}

/** 궁노대 shoot on their own every month — the only structure that deals damage. */
function fireTowers(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  for (const tile of state.map.tiles) {
    const f = tile.facility;
    if (!f || f.type !== "tower" || f.buildTurnsLeft > 0) continue;
    const city = state.cities[f.ownerCity];
    if (!city || city.faction !== f.faction) continue;
    for (const n of hexNeighbors({ q: tile.q, r: tile.r })) {
      const neighbor = tileAt(state.map, n);
      if (neighbor?.unitId == null) continue;
      const target = state.units[neighbor.unitId];
      if (!target || target.faction === f.faction) continue;
      const damage = Math.round(120 * (city.order / 100));
      target.troops = Math.max(0, target.troops - damage);
      events.push({
        kind: "battle",
        at: target.coord,
        attackerId: -1,
        defenderId: target.id,
        dealt: damage,
        taken: 0,
        ranged: true,
      });
      events.push(...settle(state, target));
      break; // One shot per tower per month.
    }
  }
  return events;
}

/** Energy, morale drift, movement reset and status countdowns. */
function regenUnits(state: GameState): void {
  for (const unit of Object.values(state.units) as Unit[]) {
    const tile = tileAt(state.map, unit.coord);
    const onFort =
      tile?.facility?.type === "fort" &&
      tile.facility.buildTurnsLeft === 0 &&
      tile.facility.faction === unit.faction;
    const friendlyCity = Boolean(tile?.cityId && state.cities[tile.cityId]?.faction === unit.faction);
    const home = isOwnDomain(state, unit.coord, unit.faction);

    const regen = onFort || friendlyCity
      ? BALANCE.energyRegenFort
      : home
        ? BALANCE.energyRegenOwnDomain
        : BALANCE.energyRegen;
    unit.energy = Math.min(100, unit.energy + regen);

    // Morale settles toward the baseline, faster at home.
    const pull = home ? 1.5 : 1;
    if (unit.morale < BALANCE.moraleBase) {
      unit.morale = Math.min(BALANCE.moraleBase, unit.morale + BALANCE.moraleDriftUp * pull);
    } else if (unit.morale > BALANCE.moraleBase) {
      unit.morale = Math.max(BALANCE.moraleBase, unit.morale - BALANCE.moraleDriftDown);
    }
    unit.morale = Math.round(unit.morale);

    unit.movesLeft = UNIT_TYPES[unit.type].moves - (unit.status.slowed > 0 ? 4 : 0);
    unit.hasActed = false;
    unit.status.confused = Math.max(0, unit.status.confused - 1);
    unit.status.slowed = Math.max(0, unit.status.slowed - 1);
    unit.status.fired = Math.max(0, unit.status.fired - 1);
  }
}

/**
 * Build the runner for one turn. The order of these steps IS the game, so it is written out
 * flat rather than hidden behind helpers.
 */
export function beginTurn(state: GameState): TurnRunner {
  if (state.phase !== "player") throw new Error("turn already in progress");
  state.phase = "ai";
  state.activeIndex = 1;

  const steps: Step[] = [];

  // --- AI phase: every faction but the player, in turn order ---
  for (const factionId of state.factionOrder.slice(1)) {
    steps.push((s) => {
      if (!s.factions[factionId]?.alive) return null;
      planInternal(s, factionId);
      return null;
    });
    steps.push((s, push) => {
      if (!s.factions[factionId]?.alive) return null;
      const commands = planMilitary(s, factionId);
      // Each command becomes its own step, so each becomes its own animation.
      for (let i = commands.length - 1; i >= 0; i--) {
        const command = commands[i];
        push((inner) => executeAi(inner, command));
      }
      return null;
    });
  }

  steps.push((s) => {
    s.phase = "resolve";
    return null;
  });

  // --- resolve phase, in this exact order ---
  steps.push((s) => resolveSupply(s));
  steps.push((s) => resolveInternalOrders(s));
  steps.push((s) => tickBuilds(s));
  steps.push((s) => {
    const events: GameEvent[] = [];
    for (const id of s.factionOrder) {
      if (!s.factions[id]?.alive) continue;
      const produced = collectIncome(s, id);
      // Only the player's ledger deserves a log line; the rest just moves numbers.
      if (id === s.playerFactionId) events.push(...produced);
      else events.push(...produced.filter((e) => e.kind === "famine"));
    }
    return events;
  });
  steps.push((s) => fireTowers(s));
  steps.push((s) => {
    regenCities(s);
    decayUndefendedCities(s);
    regenUnits(s);
    return null;
  });
  steps.push((s) => evaluateVictory(s));

  // Roll the calendar last, so every step above ran under the month it belonged to.
  steps.push((s) => {
    if (s.result !== "playing") {
      s.phase = "ended";
      return null;
    }
    const ended: GameEvent = { kind: "turn-end", year: s.year, month: s.month };
    s.month += 1;
    if (s.month > 12) {
      s.month = 1;
      s.year += 1;
    }
    s.turn += 1;
    s.activeIndex = 0;
    s.phase = "player";
    return [ended, { kind: "turn-begin", year: s.year, month: s.month }];
  });

  return new TurnRunner(steps);
}

/** Convenience for tests and the headless balance simulation: resolve a whole turn at once. */
export function runTurn(state: GameState): GameEvent[] {
  return beginTurn(state).drain(state);
}
