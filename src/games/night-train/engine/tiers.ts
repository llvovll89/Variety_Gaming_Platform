import type { RunState } from './types';

/**
 * 운행 등급: each completed journey opens the next step. Every step adds 15% enemy health and one
 * damage to every enemy hit, and a bigger dawn bonus to the score.
 */
export const TIERS = [
  { name: '정규 운행', note: '기본 난이도' },
  { name: '심야 급행', note: '적 체력 +15% · 공격 +1' },
  { name: '폭풍 노선', note: '적 체력 +30% · 공격 +2' },
  { name: '그믐 운행', note: '적 체력 +45% · 공격 +3' },
] as const;
export const MAX_TIER = TIERS.length - 1;
export const tierOf = (run: Pick<RunState, 'tier'>) => Math.max(0, Math.min(MAX_TIER, run.tier ?? 0));
/** An enemy hit's base damage on this run (before strength, weak and vulnerable). The engine and the intent tags both use it. */
export const enemyHitBase = (run: Pick<RunState, 'tier'>, base: number) => base + tierOf(run);
