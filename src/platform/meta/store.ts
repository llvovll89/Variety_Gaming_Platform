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
});
const schema = z.object({
  v: z.literal(1),
  importedLegacy: z.record(z.string(), count),
  days: z.object({ first: dateKey.nullable(), last: dateKey.nullable(), streak: count, bestStreak: count, recent: z.array(dateKey).max(60) }),
  games: z.record(z.string().max(80), recordSchema),
  achievements: z.record(z.string().max(160), count),
  daily: z.record(dateKey, z.record(z.string().max(80), z.object({ done: z.boolean(), best: z.number().finite() }))),
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
let writeFailed = false;
const listeners = new Set<Listener>();
const emit = () => { for (const listener of [...listeners]) listener(); };

function load(): MetaState {
  if (!current) {
    const raw = safeGetItem(META_KEY);
    const { state, corrupt } = parseMeta(raw);
    if (corrupt && raw !== null) safeSetItem(CORRUPT_KEY, raw);
    current = state;
    // Another tab finished a run: follow it, so this tab never writes over that record.
    if (typeof window !== 'undefined') window.addEventListener('storage', event => {
      if (event.key !== META_KEY) return;
      current = parseMeta(event.newValue).state;
      emit();
    });
  }
  return current;
}

function write(state: MetaState): boolean {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export const metaStore = {
  get: load,
  /** Apply a change. If storage refuses it, the change still holds for this visit (see writeFailed). */
  update(change: (state: MetaState) => MetaState) {
    const before = load();
    // Re-read first: another tab may have written since this one last looked. With nothing readable
    // (storage blocked, or a broken value already set aside) keep building on this visit's state.
    const raw = safeGetItem(META_KEY);
    const latest = raw === null ? null : parseMeta(raw);
    const base = latest && !latest.corrupt ? latest.state : before;
    const next = change(base);
    if (next === before) return before;
    current = next;
    if (next !== base) writeFailed = !write(next);
    emit();
    return next;
  },
  writeFailed: () => writeFailed,
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
  /** Tests only. */
  resetForTests() { current = null; writeFailed = false; listeners.clear(); },
};

export function useMeta(): MetaState {
  return useSyncExternalStore(metaStore.subscribe, metaStore.get, metaStore.get);
}
