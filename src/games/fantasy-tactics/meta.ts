import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
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
  ]
};
