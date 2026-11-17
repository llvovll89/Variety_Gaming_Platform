import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
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
      "id": "maze",
      "label": "오늘의 {difficulty} 미로를 {n}초 안에 탈출",
      "stat": "score",
      "range": [
        90,
        180
      ],
      "step": 30,
      "compare": "atMost",
      "difficulty": [
        {
          "id": "easy",
          "label": "쉬움"
        },
        {
          "id": "normal",
          "label": "보통"
        },
        {
          "id": "hard",
          "label": "어려움"
        }
      ],
      "seeded": true
    }
  ]
};
