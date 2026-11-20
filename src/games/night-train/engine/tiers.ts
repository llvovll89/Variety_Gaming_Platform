import type { RunState } from './types';

/**
 * 운행 등급: 완주할 때마다 다음 등급이 열린다. 한 등급마다 적 체력 +15%, 적 공격 한 번마다 피해 +1,
 * 새벽역 도착 보너스 점수가 커진다.
 */
export const TIERS = [
  { name: '정규 운행', note: '기본 난이도' },
  { name: '심야 급행', note: '적 체력 +15% · 공격 +1' },
  { name: '폭풍 노선', note: '적 체력 +30% · 공격 +2' },
  { name: '그믐 운행', note: '적 체력 +45% · 공격 +3' },
] as const;
export const MAX_TIER = TIERS.length - 1;
export const tierOf = (run: Pick<RunState, 'tier'>) => Math.max(0, Math.min(MAX_TIER, run.tier ?? 0));
/** 이 여행에서 적 공격 한 번의 기본 피해(힘·약화·취약 적용 전). 엔진과 의도 태그가 함께 쓴다. */
export const enemyHitBase = (run: Pick<RunState, 'tier'>, base: number) => base + tierOf(run);
