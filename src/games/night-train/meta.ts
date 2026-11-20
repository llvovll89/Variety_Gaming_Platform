import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreUnit": "점",
  "achievements": [
    { "id": "first", "title": "첫 승차", "description": "첫 여행 마치기", "tier": 1, "rule": { "kind": "runs", "atLeast": 1 } },
    { "id": "station7", "title": "중간역", "description": "일곱 번째 역 도착", "tier": 1, "rule": { "kind": "progress", "key": "station", "atLeast": 7 } },
    { "id": "win1", "title": "종착역", "description": "열차 여행 완주", "tier": 2, "rule": { "kind": "wins", "atLeast": 1 } },
    { "id": "runs10", "title": "단골 승객", "description": "여행 열 번 마치기", "tier": 2, "rule": { "kind": "runs", "atLeast": 10 } },
    // tierWon = 일반석에서 완주한 가장 높은 운행 등급 + 1 (2 = 심야 급행).
    { "id": "express", "title": "심야 급행", "description": "심야 급행 등급으로 완주", "tier": 2, "rule": { "kind": "progress", "key": "tierWon", "atLeast": 2 } },
    { "id": "win5", "title": "기관사", "description": "다섯 번 완주", "tier": 3, "rule": { "kind": "wins", "atLeast": 5 } },
    { "id": "newmoon", "title": "그믐 운행", "description": "가장 높은 등급으로 완주", "tier": 3, "rule": { "kind": "progress", "key": "tierWon", "atLeast": 4 } },
    { "id": "daily5", "title": "매일 승차", "description": "오늘의 도전 5번 완료", "tier": 3, "rule": { "kind": "daily", "atLeast": 5 } }
  ],
  "daily": [
    // 오늘의 노선: 그날 seed로 만든 같은 노선도를 모두가 탄다.
    { "id": "route", "label": "오늘의 노선에서 {n}번째 역까지 가기", "stat": "station", "range": [5, 11], "step": 1, "mode": "daily", "seeded": true }
  ],
  legacy: {
    // v2: 옛 최고 점수는 모든 좌석이 섞인 값이라 일반석 칸('default|-') 대신 'legacy|-'에 넣는다.
    // v1이 일반석 칸에 넣었던 값은 retire로 정리한다. 게임이 옛 키도 계속 쓰므로 'legacy|-'는 전 좌석 최고 점수를 따라간다.
    version: 2,
    read(get, parse) {
      const r = parse.json(get('arcade:night-train:records')) as any;
      if (!r || typeof r !== 'object') return {};
      return { runs: parse.num(r.runs), wins: parse.num(r.wins), best: { 'legacy|-': parse.num(r.bestScore) }, retire: { 'default|-': parse.num(r.bestScore) }, progress: { station: parse.num(r.bestFloor) } };
    },
  },
};
