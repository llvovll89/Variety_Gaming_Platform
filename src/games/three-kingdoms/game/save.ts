/**
 * Save and restore, through the arcade's shared namespaced storage convention.
 *
 * Only ever called during the player phase, so a save can never capture a half-resolved
 * turn. The whole GameState serialises cleanly: it is plain data with no class instances,
 * no functions and no cyclic references — which was a design goal, not an accident.
 */
import { gameStorageKey, safeGetItem, safeSetItem } from "../../../shared/storage";
import { GAME_ID } from "./constants";
import type { GameState } from "./types";
import { createOfficers, PK_ROSTER_VERSION } from './officers';
import { savedStateSchema, validSaveReferences } from './saveValidation';

const KEY = gameStorageKey(GAME_ID, "save");
/** Bump when the state shape changes so stale saves are discarded instead of crashing. */
const VERSION = 1;

interface Envelope {
  version: number;
  savedAt: number;
  state: GameState;
}

export function saveGame(state: GameState): void {
  if (state.phase !== "player") return;
  try {
    const envelope: Envelope = { version: VERSION, savedAt: Date.now(), state };
    safeSetItem(KEY, JSON.stringify(envelope));
  } catch {
    // Serialisation should never fail, but a lost save must never take the game down.
  }
}

export type SaveReadResult = { status: 'empty' } | { status: 'valid'; state: GameState } | { status: 'invalid'; raw: string };

export function readSave(): SaveReadResult {
  const raw = safeGetItem(KEY);
  if (!raw) return { status: 'empty' };
  const invalid: SaveReadResult = { status: 'invalid', raw };
  try {
    const envelope = JSON.parse(raw) as Envelope;
    if (envelope?.version !== VERSION) return invalid;
    const parsed = savedStateSchema.safeParse(envelope.state);
    if (!parsed.success) return invalid;
    const state: GameState = parsed.data;
    state.phase = "player";
    state.day ??= 1;
    if ((state.pkRosterVersion ?? 0) < PK_ROSTER_VERSION) {
      for (const officer of Object.values(createOfficers())) {
        if (state.officers[officer.id]) continue;
        const city = state.cities[officer.cityId];
        if (!city) continue;
        officer.faction = city.faction;
        state.officers[officer.id] = officer;
        if (!city.officerIds.includes(officer.id)) city.officerIds.push(officer.id);
      }
      state.pkRosterVersion = PK_ROSTER_VERSION;
    }
    return validSaveReferences(state) ? { status: 'valid', state } : invalid;
  } catch {
    return invalid;
  }
}

export function loadGame(): GameState | null {
  const saved = readSave();
  return saved.status === 'valid' ? saved.state : null;
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function clearSave(): void {
  safeSetItem(KEY, "");
}
