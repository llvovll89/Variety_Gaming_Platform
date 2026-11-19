import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "achievements": [
    {
      "id": "first",
      "title": "첫 대결",
      "description": "한 판 붙기",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "win1",
      "title": "첫 승리",
      "description": "CPU를 이기기",
      "tier": 1,
      "rule": {
        "kind": "total",
        "stat": "cpuWins",
        "atLeast": 1
      }
    },
    {
      "id": "wins10",
      "title": "동네 챔피언",
      "description": "CPU를 열 번 이기기",
      "tier": 2,
      "rule": {
        "kind": "total",
        "stat": "cpuWins",
        "atLeast": 10
      }
    },
    {
      "id": "runs30",
      "title": "단골 선수",
      "description": "서른 판 하기",
      "tier": 2,
      "rule": {
        "kind": "runs",
        "atLeast": 30
      }
    },
    {
      "id": "ladder5",
      "title": "주방의 왕",
      "description": "CPU 사다리 5단계 돌파",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "ladder",
        "atLeast": 5
      }
    }
  ]
};
