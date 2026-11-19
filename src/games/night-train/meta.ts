import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreUnit": "점",
  "achievements": [
    {
      "id": "first",
      "title": "첫 승차",
      "description": "한 번 출발하기",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "station7",
      "title": "중간역",
      "description": "일곱 번째 역 도착",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "station",
        "atLeast": 7
      }
    },
    {
      "id": "win1",
      "title": "종착역",
      "description": "열차 여행 완주",
      "tier": 2,
      "rule": {
        "kind": "wins",
        "atLeast": 1
      }
    },
    {
      "id": "runs10",
      "title": "단골 승객",
      "description": "열 번 출발",
      "tier": 2,
      "rule": {
        "kind": "runs",
        "atLeast": 10
      }
    },
    {
      "id": "win5",
      "title": "기관사",
      "description": "다섯 번 완주",
      "tier": 3,
      "rule": {
        "kind": "wins",
        "atLeast": 5
      }
    },
    {
      "id": "daily5",
      "title": "매일 승차",
      "description": "오늘의 도전 5번 완료",
      "tier": 3,
      "rule": {
        "kind": "daily",
        "atLeast": 5
      }
    }
  ],
  "daily": [
    {
      "id": "station",
      "label": "{n}번째 역까지 가기",
      "stat": "station",
      "range": [
        5,
        11
      ],
      "step": 1
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      const r = parse.json(get('arcade:night-train:records')) as any;
      if (!r || typeof r !== 'object') return {};
      return { runs: parse.num(r.runs), wins: parse.num(r.wins), best: { 'default|-': parse.num(r.bestScore) }, progress: { station: parse.num(r.bestFloor) } };
    },
  },
};
