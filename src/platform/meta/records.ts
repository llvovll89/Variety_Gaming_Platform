import type { GameRecord, LegacyRecord, MetaState, RunReport, ScoreOrder } from './types';

/** Pure record keeping: every function returns a new state and never touches storage. */

export const emptyMeta = (): MetaState => ({
  v: 1,
  importedLegacy: {},
  days: { first: null, last: null, streak: 0, bestStreak: 0, recent: [] },
  games: {},
  achievements: {},
  daily: {},
});

export const emptyRecord = (): GameRecord => ({ runs: 0, wins: 0, playMs: 0, lastPlayed: 0, best: {}, totals: {}, peaks: {}, progress: {}, dailyDone: 0 });

/** Longest stat or progress key kept; the store rejects longer ones, so they are dropped here. */
export const MAX_STAT_KEY = 120;

/** Best scores are kept per mode and difficulty: `${mode}|${difficulty}`. */
export function recordKey(mode?: string, difficulty?: string): string {
  return `${mode ?? 'default'}|${difficulty ?? '-'}`;
}

export function isBetter(order: ScoreOrder, next: number, current: number | undefined): boolean {
  if (current === undefined) return true;
  return order === 'low' ? next < current : next > current;
}

/** Best over every mode and difficulty matching the filters (undefined = any). */
export function bestOf(record: GameRecord | undefined, order: ScoreOrder, mode?: string, difficulty?: string): number | null {
  if (!record) return null;
  let best: number | undefined;
  for (const [key, value] of Object.entries(record.best)) {
    const [m, d] = key.split('|');
    if (mode !== undefined && m !== mode) continue;
    if (difficulty !== undefined && d !== difficulty) continue;
    if (isBetter(order, value, best)) best = value;
  }
  return best ?? null;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Counts one finished run into the game's record. */
export function addRun(state: MetaState, gameId: string, run: RunReport, now: number, order: ScoreOrder = 'high'): { state: MetaState; previousBest: number | null; newBest: boolean } {
  const before = state.games[gameId] ?? emptyRecord();
  const key = recordKey(run.mode, run.difficulty);
  const previous = before.best[key];
  const record: GameRecord = {
    ...before,
    runs: before.runs + 1,
    wins: before.wins + (run.outcome === 'win' || run.outcome === 'complete' ? 1 : 0),
    playMs: before.playMs + Math.max(0, finite(run.durationMs) ? run.durationMs : 0),
    lastPlayed: now,
    best: { ...before.best },
    totals: { ...before.totals },
    peaks: { ...before.peaks },
  };
  // A quit run still counts as played time, but its score is not a record.
  const scored = finite(run.score) && run.outcome !== 'quit' && isBetter(order, run.score, previous);
  if (scored) record.best[key] = run.score!;
  for (const [stat, value] of Object.entries(run.stats ?? {})) {
    if (!finite(value) || stat.length > MAX_STAT_KEY) continue;
    const total = (record.totals[stat] ?? 0) + value;
    if (finite(total)) record.totals[stat] = total;
    record.peaks[stat] = Math.max(record.peaks[stat] ?? -Infinity, value);
  }
  // A first score is a first record, not a "new best" to celebrate (it could be 0).
  return { state: { ...state, games: { ...state.games, [gameId]: record } }, previousBest: previous ?? null, newBest: scored && previous !== undefined };
}

/** Progress only moves forward (world reached, chapters cleared). */
export function addProgress(state: MetaState, gameId: string, key: string, value: number): MetaState {
  if (!finite(value) || key.length > MAX_STAT_KEY) return state;
  const before = state.games[gameId] ?? emptyRecord();
  if ((before.progress[key] ?? -Infinity) >= value) return state;
  return { ...state, games: { ...state.games, [gameId]: { ...before, progress: { ...before.progress, [key]: value } } } };
}

const count = (n: unknown) => (finite(n) && n >= 0 ? n : 0);

/** Merges records a game kept before (bests, progress, run counts) without lowering anything. */
export function mergeLegacy(state: MetaState, gameId: string, legacy: LegacyRecord, version: number, order: ScoreOrder = 'high'): MetaState {
  const before = state.games[gameId] ?? emptyRecord();
  const record: GameRecord = { ...before, best: { ...before.best }, progress: { ...before.progress } };
  for (const [key, value] of Object.entries(legacy.best ?? {})) {
    if (!finite(value) || key.length > MAX_STAT_KEY) continue;
    if (order === 'high' && value <= 0) continue; // 0 points is "never played", not a record
    if (isBetter(order, value, record.best[key])) record.best[key] = value;
  }
  for (const [key, value] of Object.entries(legacy.progress ?? {})) {
    if (finite(value) && key.length <= MAX_STAT_KEY && value > (record.progress[key] ?? 0)) record.progress[key] = value;
  }
  record.runs = Math.max(record.runs, count(legacy.runs));
  record.wins = Math.max(record.wins, count(legacy.wins));
  return { ...state, games: { ...state.games, [gameId]: record }, importedLegacy: { ...state.importedLegacy, [gameId]: version } };
}
