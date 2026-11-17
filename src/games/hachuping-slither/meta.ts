import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  "achievements": [
    {
      "id": "first",
      "title": "첫 꿈틀",
      "description": "한 판 해 보기",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "len100",
      "title": "길이 100",
      "description": "길이 100 만들기",
      "tier": 1,
      "rule": {
        "kind": "best",
        "atLeast": 100
      }
    },
    {
      "id": "kills5",
      "title": "사냥꾼",
      "description": "한 판에 5마리 잡기",
      "tier": 2,
      "rule": {
        "kind": "peak",
        "stat": "kills",
        "atLeast": 5
      }
    },
    {
      "id": "len300",
      "title": "길이 300",
      "description": "길이 300 만들기",
      "tier": 2,
      "rule": {
        "kind": "best",
        "atLeast": 300
      }
    },
    {
      "id": "kills100",
      "title": "백 번의 사냥",
      "description": "모두 합쳐 100마리",
      "tier": 2,
      "rule": {
        "kind": "total",
        "stat": "kills",
        "atLeast": 100
      }
    },
    {
      "id": "len800",
      "title": "거대한 슬리더",
      "description": "길이 800 만들기",
      "tier": 3,
      "rule": {
        "kind": "best",
        "atLeast": 800
      }
    }
  ],
  "daily": [
    {
      "id": "length",
      "label": "길이 {n} 만들기",
      "stat": "score",
      "range": [
        100,
        300
      ],
      "step": 50
    },
    {
      "id": "kills",
      "label": "한 판에 {n}마리 잡기",
      "stat": "kills",
      "range": [
        2,
        6
      ],
      "step": 1
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      return { best: { 'default|-': parse.num(get('arcade:hachuping-slither:highScore')) } };
    },
  },
};
