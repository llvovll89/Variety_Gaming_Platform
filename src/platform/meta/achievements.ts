import { bestOf, emptyRecord } from './records';
import type { AchievementDef, AchievementRule, GameRecord, MetaState, ScoreOrder, UnlockedAchievement } from './types';

export const achievementKey = (gameId: string, id: string) => `${gameId}/${id}`;

/** How far a rule is: shown as a progress bar, and met when current reaches target. */
export function ruleProgress(rule: AchievementRule, record: GameRecord | undefined, order: ScoreOrder = 'high'): { current: number; target: number; met: boolean } | null {
  const r = record ?? emptyRecord();
  switch (rule.kind) {
    case 'runs': return progress(r.runs, rule.atLeast);
    case 'wins': return progress(r.wins, rule.atLeast);
    case 'peak': return progress(r.peaks[rule.stat] ?? 0, rule.atLeast);
    case 'total': return progress(r.totals[rule.stat] ?? 0, rule.atLeast);
    case 'progress': return progress(r.progress[rule.key] ?? 0, rule.atLeast);
    case 'daily': return progress(r.dailyDone, rule.atLeast);
    case 'best': {
      const best = bestOf(r, order, rule.mode, rule.difficulty);
      // For lower-is-better scores, atLeast reads as "this good or better" (e.g. 60 seconds or less).
      if (order === 'low') return { current: best ?? 0, target: rule.atLeast, met: best !== null && best <= rule.atLeast };
      return progress(best ?? 0, rule.atLeast);
    }
    case 'manual': return null;
  }
}

function progress(current: number, target: number) {
  return { current, target, met: current >= target };
}

export function toUnlocked(gameId: string, def: AchievementDef): UnlockedAchievement {
  return { gameId, id: def.id, title: def.title, description: def.description, tier: def.tier, kids: def.kids };
}

/** Unlocks every not-yet-earned achievement whose rule is now met. Pure. */
export function evaluate(state: MetaState, gameId: string, defs: readonly AchievementDef[], order: ScoreOrder, now: number): { state: MetaState; unlocked: UnlockedAchievement[] } {
  const record = state.games[gameId];
  const unlocked: UnlockedAchievement[] = [];
  let achievements = state.achievements;
  for (const def of defs) {
    const key = achievementKey(gameId, def.id);
    if (achievements[key]) continue;
    if (!ruleProgress(def.rule, record, order)?.met) continue;
    if (achievements === state.achievements) achievements = { ...achievements };
    achievements[key] = now;
    unlocked.push(toUnlocked(gameId, def));
  }
  return { state: unlocked.length ? { ...state, achievements } : state, unlocked };
}

/** For rules a game decides itself ('manual'). Unknown ids and repeats do nothing. */
export function unlockManual(state: MetaState, gameId: string, defs: readonly AchievementDef[], id: string, now: number): { state: MetaState; unlocked: UnlockedAchievement[] } {
  const def = defs.find(d => d.id === id);
  const key = achievementKey(gameId, id);
  if (!def || state.achievements[key]) return { state, unlocked: [] };
  return { state: { ...state, achievements: { ...state.achievements, [key]: now } }, unlocked: [toUnlocked(gameId, def)] };
}
