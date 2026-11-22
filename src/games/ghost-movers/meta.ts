import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreOrder": "low",
  "scoreUnit": "걸음",
  "achievements": [
    {
      "id": "first",
      "title": "첫 의뢰",
      "description": "의뢰 하나 완료",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 1
      }
    },
    {
      "id": "chapter1",
      "title": "1장 완료",
      "description": "의뢰 8개 완료",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 8
      }
    },
    {
      "id": "stars24",
      "title": "별 24개",
      "description": "별 24개 모으기",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "stars",
        "atLeast": 24
      }
    },
    {
      "id": "chapter2",
      "title": "2장 완료",
      "description": "의뢰 16개 완료",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 16
      }
    },
    {
      "id": "all",
      "title": "모든 현장",
      "description": "의뢰 24개 완료",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 24
      }
    },
    {
      "id": "stars72",
      "title": "완벽한 이사",
      "description": "별 72개 모두 모으기",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "stars",
        "atLeast": 72
      }
    }
  ],
  // Today's job: one the player has already cleared (chosen with the day's seed), within par.
  daily: [
    { id: 'par', label: '오늘의 의뢰를 기준 행동 안에 끝내기 (별 {n}개)', stat: 'stars', range: [3, 3], step: 1, mode: 'daily', seeded: true },
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      const p = parse.json(get('gh-ghost-movers-v1')) as { best?: Record<string, unknown> } | null;
      // Same checks as the game's own loader: whole-number level keys, 1 to 3 stars.
      const stars = Object.entries(p?.best ?? {}).filter(([i]) => /^\d+$/.test(i) && Number(i) < 24)
        .map(([, v]) => (v as { stars?: unknown })?.stars).filter((n): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 3);
      return { progress: { cleared: stars.length, stars: stars.reduce((a, b) => a + b, 0) } };
    },
  },
};
