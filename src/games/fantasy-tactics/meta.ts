import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  // One battle is one run. No score is reported, so no scoreOrder/scoreUnit either.
  reportsRuns: true,
  "achievements": [
    {
      "id": "first",
      "title": "원정 시작",
      "description": "첫 전투 치르기",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "ch1",
      "title": "첫 번째 장",
      "description": "1장 완료",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 1
      }
    },
    {
      "id": "ch3",
      "title": "1부 완결",
      "description": "3장 완료",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 3
      }
    },
    {
      "id": "ch5",
      "title": "바다 건너",
      "description": "5장 완료",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 5
      }
    },
    {
      "id": "ch6",
      "title": "별빛 원정 완결",
      "description": "6장 완료",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 6
      }
    },
    {
      "id": "wins20",
      "title": "백전노장",
      "description": "전투 20번 승리",
      "tier": 3,
      "rule": {
        "kind": "wins",
        "atLeast": 20
      }
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      // The save holds the chapter in play (0-based); after its battle is won it counts as finished.
      const s = parse.json(get('gh-arcade:fantasy-tactics:v1')) as { stage?: unknown; phase?: unknown } | null;
      if (!Number.isInteger(s?.stage) || (s!.stage as number) < 0 || (s!.stage as number) > 5) return {};
      const finished = ['won', 'camp', 'ending'].includes(String(s!.phase)) ? (s!.stage as number) + 1 : (s!.stage as number);
      return finished > 0 ? { progress: { chapter: finished } } : {};
    },
  },
};
