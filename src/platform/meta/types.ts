/**
 * Arcade-wide records: what games report when a run ends, and what the platform keeps from it
 * (bests, totals, achievements, daily challenges, the play streak).
 */

export type Outcome = 'win' | 'lose' | 'complete' | 'quit';
/** Whether a bigger score is better (points) or a smaller one (seconds, steps). */
export type ScoreOrder = 'high' | 'low';

/** What a game reports when a run ends. */
export interface RunReport {
  mode?: string;
  difficulty?: string;
  /** The game's main number for this run. */
  score?: number;
  durationMs: number;
  outcome: Outcome;
  /** Other numbers from this run (combo, accuracy, kills...). Summed into totals, maxed into peaks. */
  stats?: Record<string, number>;
  /** The challenge this run was started for (DailyChallenge.id), so a run that ends after midnight
   * still counts for the day it began. */
  dailyId?: string;
  /** durationMs 중 이미 reportPlay로 보고한 시간. playMs에 다시 더하지 않는다. */
  reportedMs?: number;
}

export interface GameRecord {
  runs: number;
  wins: number;
  playMs: number;
  lastPlayed: number;
  /** Best score per `${mode}|${difficulty}`. */
  best: Record<string, number>;
  totals: Record<string, number>;
  peaks: Record<string, number>;
  progress: Record<string, number>;
  /** Daily challenges completed, ever (the per-day results are pruned). */
  dailyDone: number;
}

export interface MetaState {
  v: 1;
  /** gameId → version of the legacy import already done. */
  importedLegacy: Record<string, number>;
  days: { first: string | null; last: string | null; streak: number; bestStreak: number; recent: string[] };
  games: Record<string, GameRecord>;
  /** `${gameId}/${achievementId}` → unlocked at (ms). */
  achievements: Record<string, number>;
  /** date → gameId → today's challenge state. Only recent days are kept. */
  daily: Record<string, Record<string, { done: boolean; best: number | null }>>;
}

export type AchievementRule =
  | { kind: 'runs' | 'wins'; atLeast: number }
  | { kind: 'best'; atLeast: number; mode?: string; difficulty?: string }
  | { kind: 'peak' | 'total'; stat: string; atLeast: number }
  | { kind: 'progress'; key: string; atLeast: number }
  | { kind: 'daily'; atLeast: number }
  | { kind: 'manual' };

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  /** Kids games show a sticker instead of a badge. */
  kids?: { title: string; sticker: string };
  tier: 1 | 2 | 3;
  hidden?: boolean;
  rule: AchievementRule;
}

export interface DailyTemplate {
  id: string;
  /** May contain {n} (the goal) and {difficulty} (its label). */
  label: string;
  /** 'score' or a stats key. */
  stat: string;
  /** The goal is a multiple of `step` within this range. */
  range: [number, number];
  step: number;
  /** 'atMost' for times and step counts. Defaults to 'atLeast'. */
  compare?: 'atLeast' | 'atMost';
  mode?: string;
  difficulty?: { id: string; label: string }[];
  /** The game builds today's map from the challenge seed (same map for everyone today). */
  seeded?: boolean;
}

/** Records a game kept on its own before the arcade-wide store, read once (never written). */
export interface LegacyRecord {
  best?: Record<string, number>;
  progress?: Record<string, number>;
  runs?: number;
  wins?: number;
  /** 이전 adapter 버전이 잘못 채운 best 칸과 그때 넣은 값. 버전이 오를 때 아직 그 값이면 지운다. */
  retire?: Record<string, number>;
}
/** Parsing helpers the platform hands to adapters, so meta.ts files stay import-free. */
export interface LegacyParse {
  /** A positive whole number, or 0 for anything else. */
  num(raw: unknown): number;
  /** Parsed JSON, or null when missing or broken. */
  json(raw: string | null): unknown;
}
export interface LegacyAdapter {
  /** Raised when an adapter changes, to tell old imports apart. */
  version: number;
  read(get: (key: string) => string | null, parse: LegacyParse): LegacyRecord;
}

/** Data a game declares about its records. Small and import-free, so the registry can load it eagerly. */
export interface GameMeta {
  /** The game calls reportRun when a run ends. Only these games offer daily challenges on the hub,
   * since a challenge nobody can complete would be a broken promise. */
  reportsRuns?: boolean;
  scoreOrder?: ScoreOrder;
  scoreUnit?: string;
  /** The mode whose best is "the" best on cards and in the profile (e.g. full runs only). */
  bestMode?: string;
  achievements: AchievementDef[];
  daily?: DailyTemplate[];
  legacy?: LegacyAdapter;
}

export interface DailyChallenge {
  /** `${date}:${gameId}:${templateId}` */
  id: string;
  date: string;
  gameId: string;
  label: string;
  stat: string;
  goal: number;
  compare: 'atLeast' | 'atMost';
  mode?: string;
  difficulty?: string;
  seed: number;
  seeded: boolean;
}

export interface UnlockedAchievement {
  gameId: string;
  id: string;
  title: string;
  description: string;
  tier: 1 | 2 | 3;
  kids?: { title: string; sticker: string };
}

/** What a finished run earned, for the result screen. */
export interface RunRewards {
  newBest: boolean;
  previousBest: number | null;
  best: number | null;
  unlocked: UnlockedAchievement[];
  daily?: { id: string; label: string; completed: boolean; justCompleted: boolean };
  streak: { days: number; extendedToday: boolean };
}
