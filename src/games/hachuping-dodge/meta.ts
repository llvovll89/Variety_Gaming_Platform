import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  "scoreUnit": "처치",
  "achievements": [
    {
      "id": "first",
      "title": "첫 원정",
      "description": "한 번 출정하기",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "region2",
      "title": "두 번째 지역",
      "description": "두 번째 지역에 도착",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "region",
        "atLeast": 2
      }
    },
    {
      "id": "kills1000",
      "title": "천의 처치",
      "description": "모두 합쳐 1,000 처치",
      "tier": 2,
      "rule": {
        "kind": "total",
        "stat": "kills",
        "atLeast": 1000
      }
    },
    {
      "id": "region4",
      "title": "네 번째 지역",
      "description": "네 번째 지역에 도착",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "region",
        "atLeast": 4
      }
    },
    {
      "id": "clear",
      "title": "원정 완수",
      "description": "여섯 지역을 모두 돌파",
      "tier": 3,
      "rule": {
        "kind": "wins",
        "atLeast": 1
      }
    },
    {
      "id": "nightmare",
      "title": "악몽의 생존자",
      "description": "악몽에서 500 처치",
      "tier": 3,
      "rule": {
        "kind": "best",
        "atLeast": 500,
        "difficulty": "nightmare"
      }
    }
  ],
  "daily": [
    {
      "id": "kills",
      "label": "{difficulty}에서 {n} 처치",
      "stat": "score",
      "range": [
        150,
        450
      ],
      "step": 50,
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
      ]
    }
  ]
};
