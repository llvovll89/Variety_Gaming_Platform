import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { safeGetItem, safeSetItem } from '../storage';

/**
 * Arcade-wide player settings: sound, motion, haptics and hint level.
 *
 * A module-level store rather than only React context, because imperative engines (sound,
 * render loops) read it outside React. React reads it through useSyncExternalStore.
 */
export const SETTINGS_KEY = 'arcade:platform:settings';

export type HintLevel = 'off' | 'gentle' | 'full';
export interface GameSettings { muted?: boolean; volume?: number; extra?: Record<string, boolean | number | string> }
export interface PlatformSettings {
  v: 1;
  /** Mutes every game at once. */
  muted: boolean;
  /** Master volume, 0..1. */
  volume: number;
  games: Record<string, GameSettings>;
  /** CSS cannot undo the OS "reduce motion" setting, so the only override is an extra "reduce". */
  motion: 'system' | 'reduce';
  haptics: boolean;
  hints: HintLevel;
  /** Help pages already shown once, keyed by the help's firstRunKey. */
  seenHelp: Record<string, number>;
}

export const DEFAULT_SETTINGS: PlatformSettings = { v: 1, muted: false, volume: 0.8, games: {}, motion: 'system', haptics: true, hints: 'gentle', seenHelp: {} };

const unit = z.number().finite().transform(n => Math.min(1, Math.max(0, n)));
const gameSchema = z.object({
  muted: z.boolean().optional().catch(undefined),
  volume: unit.optional().catch(undefined),
  extra: z.record(z.string(), z.union([z.boolean(), z.number().finite(), z.string().max(200)])).optional().catch(undefined),
});
// Every field falls back on its own, so one bad value never resets the player's other choices.
const schema = z.object({
  v: z.literal(1).catch(1),
  muted: z.boolean().catch(DEFAULT_SETTINGS.muted),
  volume: unit.catch(DEFAULT_SETTINGS.volume),
  games: z.record(z.string().max(80), gameSchema.catch({})).catch({}),
  motion: z.enum(['system', 'reduce']).catch('system'),
  haptics: z.boolean().catch(true),
  hints: z.enum(['off', 'gentle', 'full']).catch('gentle'),
  seenHelp: z.record(z.string().max(80), z.number().finite()).catch({}),
});

/** Settings each game kept on its own before this store; read once, never written or deleted. */
function legacyGames(): Record<string, GameSettings> {
  const games: Record<string, GameSettings> = {};
  try {
    const prefs = JSON.parse(safeGetItem('arcade:hachuping-color-match:prefs') ?? 'null');
    if (typeof prefs?.muted === 'boolean') games['hachuping-color-match'] = { muted: prefs.muted };
  } catch { /* ignore a broken old value */ }
  try {
    const sound = JSON.parse(safeGetItem('arcade:night-train:sound') ?? 'null');
    if (typeof sound?.sfx === 'boolean' && typeof sound?.ambient === 'boolean') games['night-train'] = { extra: { sfx: sound.sfx, ambient: sound.ambient } };
  } catch { /* ignore a broken old value */ }
  return games;
}

/** Never throws. With nothing stored yet, earlier per-game choices seed the new settings. */
export function parseSettings(raw: string | null): PlatformSettings {
  if (raw === null) return { ...DEFAULT_SETTINGS, games: legacyGames(), seenHelp: {} };
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data as PlatformSettings;
  } catch { /* fall through */ }
  return { ...DEFAULT_SETTINGS, games: {}, seenHelp: {} };
}

type Listener = () => void;
let current: PlatformSettings | null = null;
const listeners = new Set<Listener>();

function applyToDocument(settings: PlatformSettings) {
  if (typeof document === 'undefined') return;
  if (settings.motion === 'reduce') document.documentElement.dataset.kitMotion = 'reduce';
  else delete document.documentElement.dataset.kitMotion;
}

function emit() { for (const listener of [...listeners]) listener(); }

function load(): PlatformSettings {
  if (!current) {
    current = parseSettings(safeGetItem(SETTINGS_KEY));
    applyToDocument(current);
    // Another tab changed the settings: follow it.
    if (typeof window !== 'undefined') window.addEventListener('storage', event => {
      if (event.key !== SETTINGS_KEY) return;
      current = parseSettings(event.newValue);
      applyToDocument(current);
      emit();
    });
  }
  return current;
}

function commit(next: PlatformSettings) {
  current = next;
  safeSetItem(SETTINGS_KEY, JSON.stringify(next));
  applyToDocument(next);
  emit();
}

export const settingsStore = {
  get: load,
  set(patch: Partial<Omit<PlatformSettings, 'v'>>) {
    commit(schema.parse({ ...load(), ...patch }) as PlatformSettings);
  },
  setGame(gameId: string, patch: GameSettings) {
    const settings = load();
    const game = { ...settings.games[gameId], ...patch, extra: patch.extra ? { ...settings.games[gameId]?.extra, ...patch.extra } : settings.games[gameId]?.extra };
    commit(schema.parse({ ...settings, games: { ...settings.games, [gameId]: game } }) as PlatformSettings);
  },
  markHelpSeen(key: string) {
    const settings = load();
    if (settings.seenHelp[key]) return;
    commit({ ...settings, seenHelp: { ...settings.seenHelp, [key]: Date.now() } });
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  /** Tests only: forget the cached settings so the next read comes from storage again. */
  resetForTests() { current = null; listeners.clear(); },
};

/** What a game should actually play at: the global switch and master volume times its own. */
export function effectiveAudio(settings: PlatformSettings, gameId?: string): { muted: boolean; volume: number } {
  const game = gameId ? settings.games[gameId] : undefined;
  const muted = settings.muted || game?.muted === true;
  return { muted, volume: muted ? 0 : settings.volume * (game?.volume ?? 1) };
}

export function useSettings(): PlatformSettings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);
}

export function useGameSettings(gameId: string) {
  const settings = useSettings();
  return {
    ...effectiveAudio(settings, gameId),
    game: settings.games[gameId] ?? {},
    set: (patch: GameSettings) => settingsStore.setGame(gameId, patch),
  };
}

/** True when the OS asks for less motion or the player turned it on in the arcade settings. */
export function prefersReducedMotion(settings: PlatformSettings = settingsStore.get()): boolean {
  if (settings.motion === 'reduce') return true;
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function useReducedMotion(): boolean {
  return prefersReducedMotion(useSettings());
}
