import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreUnit": "점",
  "achievements": [
    {
      "id": "first",
      "title": "첫 비행",
      "description": "한 판 날아 보기",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "world2",
      "title": "두 번째 세계",
      "description": "두 번째 세계에 도착",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "world",
        "atLeast": 2
      }
    },
    {
      "id": "best500",
      "title": "500점",
      "description": "한 판에 500점",
      "tier": 1,
      "rule": {
        "kind": "best",
        "atLeast": 500
      }
    },
    {
      "id": "world4",
      "title": "네 번째 세계",
      "description": "네 번째 세계에 도착",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "world",
        "atLeast": 4
      }
    },
    {
      "id": "world6",
      "title": "마지막 세계",
      "description": "여섯 번째 세계에 도착",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "world",
        "atLeast": 6
      }
    },
    {
      "id": "clear",
      "title": "끝까지 비행",
      "description": "여섯 세계를 모두 통과",
      "tier": 3,
      "rule": {
        "kind": "wins",
        "atLeast": 1
      }
    }
  ],
  "daily": [
    {
      "id": "score",
      "label": "한 판에 {n}점 넘기",
      "stat": "score",
      "range": [
        200,
        800
      ],
      "step": 100
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      return { best: { 'default|-': parse.num(get('arcade:hachuping-jump:highScore')) } };
    },
  },
};
