import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
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
  legacy: {
    version: 1,
    read(get) {
      const p = JSON.parse(get('gh-ghost-movers-v1') ?? 'null');
      const stars = Object.entries(p?.best ?? {}).filter(([i, v]) => Number(i) < 24 && Number.isInteger((v as { stars?: unknown })?.stars)).map(([, v]) => Math.min(3, Math.max(1, (v as { stars: number }).stars)));
      return { progress: { cleared: stars.length, stars: stars.reduce((a, b) => a + b, 0) } };
    },
  },
};
