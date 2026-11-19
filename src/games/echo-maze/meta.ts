import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreOrder": "low",
  "scoreUnit": "초",
  "achievements": [
    {
      "id": "first",
      "title": "첫 탈출",
      "description": "미로 하나 탈출",
      "tier": 1,
      "rule": {
        "kind": "wins",
        "atLeast": 1
      }
    },
    {
      "id": "normal",
      "title": "보통 미로",
      "description": "보통 미로 탈출",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "escapedNormal",
        "atLeast": 1
      }
    },
    {
      "id": "hard",
      "title": "어려운 미로",
      "description": "어려움 미로 탈출",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "escapedHard",
        "atLeast": 1
      }
    },
    {
      "id": "wins10",
      "title": "미로 탐험가",
      "description": "미로 10개 탈출",
      "tier": 2,
      "rule": {
        "kind": "wins",
        "atLeast": 10
      }
    },
    {
      "id": "fast",
      "title": "번개 탈출",
      "description": "보통 미로를 60초 안에",
      "tier": 3,
      "rule": {
        "kind": "best",
        "atLeast": 60,
        "difficulty": "normal"
      }
    },
    {
      "id": "daily5",
      "title": "매일 미로",
      "description": "오늘의 미로 5번 탈출",
      "tier": 3,
      "rule": {
        "kind": "daily",
        "atLeast": 5
      }
    }
  ],
  "daily": [
    {
      "id": "maze-easy",
      "label": "오늘의 쉬움 미로를 {n}초 안에 탈출",
      "stat": "score",
      "range": [50, 80],
      "step": 10,
      "compare": "atMost",
      "mode": "daily",
      "difficulty": [{ "id": "easy", "label": "쉬움" }],
      "seeded": true
    },
    {
      "id": "maze-normal",
      "label": "오늘의 보통 미로를 {n}초 안에 탈출",
      "stat": "score",
      "range": [70, 100],
      "step": 10,
      "compare": "atMost",
      "mode": "daily",
      "difficulty": [{ "id": "normal", "label": "보통" }],
      "seeded": true
    },
    {
      "id": "maze-hard",
      "label": "오늘의 어려움 미로를 {n}초 안에 탈출",
      "stat": "score",
      "range": [90, 130],
      "step": 10,
      "compare": "atMost",
      "mode": "daily",
      "difficulty": [{ "id": "hard", "label": "어려움" }],
      "seeded": true
    }
  ],
};
