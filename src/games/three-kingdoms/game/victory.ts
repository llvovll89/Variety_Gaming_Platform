/**
 * Win and loss.
 *
 * Defeat needs zero cities AND zero armies. A surviving force can always march back and
 * retake somewhere, which is the difference between a dramatic last stand and twenty turns
 * of having nothing to do.
 */
import { citiesOf, unitsOf } from "./state";
import type { GameEvent } from "./events";
import type { GameState } from "./types";

export function evaluateVictory(state: GameState): GameEvent[] {
  const events: GameEvent[] = [];
  if (state.result !== "playing") return events;

  for (const faction of Object.values(state.factions)) {
    if (!faction.alive) continue;
    if (citiesOf(state, faction.id).length > 0 || unitsOf(state, faction.id).length > 0) continue;
    faction.alive = false;
    events.push({ kind: "eliminated", faction: faction.id, name: faction.name });
  }

  // A dead faction does not get a turn, but it stays in the record.
  state.factionOrder = state.factionOrder.filter((id) => state.factions[id].alive);
  if (!state.factionOrder.includes(state.playerFactionId)) {
    state.factionOrder.unshift(state.playerFactionId);
  }

  const total = Object.keys(state.cities).length;
  const mine = citiesOf(state, state.playerFactionId).length;

  if (mine === total) {
    state.result = "victory";
    state.phase = "ended";
    events.push({ kind: "result", result: "victory" });
  } else if (!state.factions[state.playerFactionId].alive) {
    state.result = "defeat";
    state.phase = "ended";
    events.push({ kind: "result", result: "defeat" });
  }

  return events;
}
