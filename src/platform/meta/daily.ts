import { emptyRecord } from './records';
import type { DailyChallenge, DailyTemplate, MetaState, RunReport } from './types';

/**
 * Today's challenges and the play streak. Everything is decided by the local date, so everyone gets
 * the same challenge on the same day without a server.
 */

/** YYYY-MM-DD in local time. toISOString would be UTC and roll the day over at 9am in Korea. */
export function localDateKey(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole days from one date key to another. */
export function daysBetween(from: string, to: string): number {
  const utc = (key: string) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/** FNV-1a: a small, stable 32-bit hash of a string. */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Seeded random numbers in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Today's pick from the player's own list (e.g. the levels they have cleared), for challenges that
 * replay something already beaten. Same pick all day for the same list.
 */
export function pickDaily<T>(seed: number, items: readonly T[]): T | undefined {
  return items.length ? items[seed % items.length] : undefined;
}

const pick = <T>(rng: () => number, items: readonly T[]): T => items[Math.min(items.length - 1, Math.floor(rng() * items.length))];

/** The day's challenge for one game, or null if the game has none. */
export function dailyChallenge(date: string, gameId: string, templates: readonly DailyTemplate[] | undefined): DailyChallenge | null {
  if (!templates?.length) return null;
  const seed = hashSeed(`${date}:${gameId}`);
  const rng = mulberry32(seed);
  const template = pick(rng, templates);
  const [min, max] = template.range;
  const steps = Math.max(0, Math.floor((max - min) / template.step));
  const goal = min + template.step * Math.floor(rng() * (steps + 1));
  const difficulty = template.difficulty?.length ? pick(rng, template.difficulty) : undefined;
  return {
    id: `${date}:${gameId}:${template.id}`,
    date,
    gameId,
    label: template.label.replace('{n}', goal.toLocaleString()).replace('{difficulty}', difficulty?.label ?? ''),
    stat: template.stat,
    goal,
    compare: template.compare ?? 'atLeast',
    mode: template.mode,
    difficulty: difficulty?.id,
    seed,
    seeded: template.seeded === true,
  };
}

export interface DailyCandidate { id: string; audience: 'kids' | 'general'; minutes: number }

/** The hub's three picks for the day: one kids game, one short game and one long game. */
export function featuredDailies(date: string, candidates: readonly DailyCandidate[]): string[] {
  const rng = mulberry32(hashSeed(`featured:${date}`));
  const chosen: string[] = [];
  const groups = [
    candidates.filter(c => c.audience === 'kids'),
    candidates.filter(c => c.audience === 'general' && c.minutes <= 5),
    candidates.filter(c => c.audience === 'general' && c.minutes > 5),
  ];
  for (const group of groups) {
    const open = group.filter(c => !chosen.includes(c.id));
    if (open.length) chosen.push(pick(rng, open).id);
  }
  return chosen;
}

const DAILY_KEEP_DAYS = 14;

/** Whether this run counts for the challenge: same mode and difficulty, and the goal reached. */
export function meetsChallenge(challenge: DailyChallenge, run: RunReport): { matches: boolean; value: number | null; done: boolean } {
  if (run.outcome === 'quit') return { matches: false, value: null, done: false };
  if (challenge.mode !== undefined && run.mode !== challenge.mode) return { matches: false, value: null, done: false };
  if (challenge.difficulty !== undefined && run.difficulty !== challenge.difficulty) return { matches: false, value: null, done: false };
  const value = challenge.stat === 'score' ? run.score : run.stats?.[challenge.stat];
  if (typeof value !== 'number' || !Number.isFinite(value)) return { matches: true, value: null, done: false };
  return { matches: true, value, done: challenge.compare === 'atMost' ? value <= challenge.goal : value >= challenge.goal };
}

/**
 * Records a run against a day's challenge and keeps the 14 most recent days.
 * `today` is the real date now. It differs from challenge.date when a run started before midnight
 * ends after it; days after `today` (a clock that was once ahead) are the only ones dropped.
 */
export function addDailyRun(state: MetaState, challenge: DailyChallenge, run: RunReport, today: string = challenge.date): { state: MetaState; result?: { id: string; label: string; completed: boolean; justCompleted: boolean } } {
  const check = meetsChallenge(challenge, run);
  if (!check.matches) return { state };
  const dayEntries = state.daily[challenge.date] ?? {};
  const before = dayEntries[challenge.gameId];
  const previous = before?.best ?? null;
  // A run without the stat leaves the best as it was (null until a real value arrives).
  const better = check.value !== null && (previous === null || (challenge.compare === 'atMost' ? check.value < previous : check.value > previous));
  const done = (before?.done ?? false) || check.done;
  const justCompleted = done && !before?.done;
  const entry = { done, best: better ? check.value : previous };
  // Keep the 14 most recent days up to today (and the challenge day itself).
  const daily: MetaState['daily'] = {};
  const latest = challenge.date > today ? challenge.date : today;
  // The challenge day itself always stays, so a completion is never counted twice.
  const others = Object.keys(state.daily).filter(date => date <= latest && date !== challenge.date).sort().slice(-(DAILY_KEEP_DAYS - 1));
  const dates = [...others, challenge.date].sort();
  for (const date of dates) daily[date] = date === challenge.date ? { ...dayEntries, [challenge.gameId]: entry } : state.daily[date];
  let games = state.games;
  if (justCompleted) {
    // Completed challenges are counted forever (for achievements), even after the day is dropped.
    const record = games[challenge.gameId] ?? emptyRecord();
    games = { ...games, [challenge.gameId]: { ...record, dailyDone: record.dailyDone + 1 } };
  }
  return { state: { ...state, daily, games }, result: { id: challenge.id, label: challenge.label, completed: done, justCompleted } };
}

/** The streak as of today: a streak whose last day was before yesterday has lapsed. */
export function currentStreak(days: MetaState['days'], today: string): number {
  if (!days.last) return 0;
  const gap = daysBetween(days.last, today);
  return gap <= 1 ? days.streak : 0;
}

const STREAK_MIN_MS = 20_000;
const RECENT_DAYS = 35;

/**
 * The play streak. A day counts after one real run (20 seconds or more, or a finished one), so
 * opening a game and leaving at once does not keep a streak alive.
 */
export function addStreakDay(state: MetaState, today: string, run: RunReport): { state: MetaState; streak: { days: number; extendedToday: boolean } } {
  const counts = run.durationMs >= STREAK_MIN_MS || run.outcome === 'win' || run.outcome === 'complete';
  const days = state.days;
  const gap = days.last ? daysBetween(days.last, today) : null;
  // gap < 0: the device clock went back. Keep the streak as it is rather than resetting it.
  if (!counts || gap === 0 || (gap !== null && gap < 0)) return { state, streak: { days: gap !== null && gap <= 1 ? days.streak : 0, extendedToday: false } };
  const streak = gap === 1 ? days.streak + 1 : 1;
  const next = {
    first: days.first ?? today,
    last: today,
    streak,
    bestStreak: Math.max(days.bestStreak, streak),
    recent: [...days.recent.filter(d => d !== today), today].slice(-RECENT_DAYS),
  };
  return { state: { ...state, days: next }, streak: { days: streak, extendedToday: true } };
}
