import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { safeGetItem, safeSetItem } from '../../shared/storage';
import { emptyMeta } from './records';
import type { MetaState } from './types';

/** Every arcade-wide record lives under one key, validated on read. */
export const META_KEY = 'arcade:meta:v1';
const CORRUPT_KEY = `${META_KEY}:corrupt`;

const count = z.number().finite().nonnegative();
const numbers = z.record(z.string().max(120), z.number().finite());
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const recordSchema = z.object({
  runs: count, wins: count, playMs: count, lastPlayed: count,
  best: numbers, totals: numbers, peaks: numbers, progress: numbers,
  dailyDone: count,
});
const schema = z.object({
  v: z.literal(1),
  importedLegacy: z.record(z.string(), count),
  days: z.object({ first: dateKey.nullable(), last: dateKey.nullable(), streak: count, bestStreak: count, recent: z.array(dateKey).max(60) }),
  games: z.record(z.string().max(80), recordSchema),
  achievements: z.record(z.string().max(160), count),
  daily: z.record(dateKey, z.record(z.string().max(80), z.object({ done: z.boolean(), best: z.number().finite().nullable() }))),
});

/** Never throws. A stored value that does not parse is set aside (one copy) and play starts fresh. */
export function parseMeta(raw: string | null): { state: MetaState; corrupt: boolean } {
  if (raw === null) return { state: emptyMeta(), corrupt: false };
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    if (parsed.success) return { state: parsed.data as MetaState, corrupt: false };
  } catch { /* fall through */ }
  return { state: emptyMeta(), corrupt: true };
}

type Listener = () => void;
let current: MetaState | null = null;
/** The stored text `current` came from (or was written as), to skip re-parsing an unchanged value. */
let currentRaw: string | null = null;
let writeFailed = false;
const listeners = new Set<Listener>();
const emit = () => { for (const listener of [...listeners]) listener(); };

function load(): MetaState {
  if (!current) {
    const raw = safeGetItem(META_KEY);
    const { state, corrupt } = parseMeta(raw);
    if (corrupt && raw !== null) safeSetItem(CORRUPT_KEY, raw);
    current = state;
    currentRaw = corrupt ? null : raw;
    // Another tab finished a run: follow it, so this tab never writes over that record.
    if (typeof window !== 'undefined') window.addEventListener('storage', event => {
      if (event.key !== META_KEY || event.newValue === null) return;
      const next = parseMeta(event.newValue);
      if (next.corrupt) return; // keep what this tab has rather than dropping to empty
      current = next.state;
      currentRaw = event.newValue;
      emit();
    });
  }
  return current;
}

/** Only valid records are written, so one bad value can never make the whole store unreadable. */
function write(state: MetaState): boolean {
  if (!schema.safeParse(state).success) return false;
  const raw = JSON.stringify(state);
  if (!safeSetItem(META_KEY, raw)) return false;
  currentRaw = raw;
  return true;
}

export const metaStore = {
  get: load,
  /** Apply a change. If storage refuses it, the change still holds for this visit (see writeFailed). */
  update(change: (state: MetaState) => MetaState) {
    const before = load();
    // Re-read first: another tab may have written since this one last looked. Keep building on this
    // visit's state when storage holds nothing readable, the same text as before, or is behind
    // because an earlier write of this visit failed.
    const raw = safeGetItem(META_KEY);
    let base = before;
    if (!writeFailed && raw !== null && raw !== currentRaw) {
      const latest = parseMeta(raw);
      if (!latest.corrupt) { base = latest.state; currentRaw = raw; }
    }
    const next = change(base);
    if (next === base) {
      if (base !== before) { current = base; emit(); }
      return current!;
    }
    current = next;
    writeFailed = !write(next);
    emit();
    return next;
  },
  writeFailed: () => writeFailed,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  /** Tests only. */
  resetForTests() { current = null; currentRaw = null; writeFailed = false; listeners.clear(); },
};

export function useMeta(): MetaState {
  return useSyncExternalStore(metaStore.subscribe, metaStore.get, metaStore.get);
}
