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
  ],
  /**
   * 한 경기 안에서 끝나고, 플레이어가 화면에서 직접 고를 수 있는 것만 도전으로 낸다.
   * 난이도는 mode 문자열에 섞여 보고되므로(cpu-easy / cpu-normal) 도전에서 지정하지 않는다.
   * 지정하면 설정이 다른 날 아무리 이겨도 조용히 인정되지 않는다.
   */
  daily: [
    { id: 'cpu', label: 'CPU를 이기기', stat: 'cpuWins', range: [1, 1], step: 1, outcome: 'win' },
    { id: 'sweep', label: '{n}라운드로 완승하기', stat: 'rounds', range: [2, 2], step: 1, compare: 'atMost', outcome: 'win' },
    { id: 'spatula', label: '밥심 주걱으로 CPU 이기기', stat: 'win-spatula', range: [1, 1], step: 1, outcome: 'win' },
  ],
};
