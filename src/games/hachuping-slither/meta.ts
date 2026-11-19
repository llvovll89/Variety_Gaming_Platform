import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
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
    },
    {
      "id": "timed200",
      "title": "3분의 성장",
      "description": "3분 점수전에서 길이 200",
      "tier": 2,
      "rule": {
        "kind": "best",
        "mode": "timed",
        "atLeast": 200
      }
    },
    {
      "id": "survive300",
      "title": "끈질긴 생존",
      "description": "한 판에 5분 버티기",
      "tier": 2,
      "rule": {
        "kind": "peak",
        "stat": "survivalSec",
        "atLeast": 300
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
    },
    {
      "id": "timed",
      "label": "3분 점수전에서 길이 {n}",
      "stat": "score",
      "range": [
        100,
        250
      ],
      "step": 50,
      "mode": "timed"
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      return { best: { 'default|-': parse.num(get('arcade:hachuping-slither:highScore')) } };
    },
  },
};
