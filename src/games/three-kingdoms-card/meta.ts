import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  // Every battle (토벌, 연무탑, 요일 전장) reports a run; the game keeps its own daily quests.
  reportsRuns: true,
  "achievements": [
    { "id": "firstWin", "title": "첫 승전", "description": "전투에서 처음 승리", "tier": 1, "rule": { "kind": "wins", "atLeast": 1 } },
    { "id": "stage2", "title": "전선 확장", "description": "세 거점을 토벌해 두 번째 전선 열기", "tier": 1, "rule": { "kind": "progress", "key": "stage", "atLeast": 2 } },
    { "id": "tower5", "title": "연무탑 5층", "description": "연무탑 5층 돌파", "tier": 1, "rule": { "kind": "progress", "key": "tower", "atLeast": 5 } },
    { "id": "heroes10", "title": "열 명의 장수", "description": "장수 10명 거느리기", "tier": 2, "rule": { "kind": "progress", "key": "heroes", "atLeast": 10 } },
    { "id": "stage5", "title": "다섯 번째 전선", "description": "다섯 번째 전선 열기", "tier": 2, "rule": { "kind": "progress", "key": "stage", "atLeast": 5 } },
    { "id": "tower15", "title": "연무탑 15층", "description": "연무탑 15층 돌파", "tier": 2, "rule": { "kind": "progress", "key": "tower", "atLeast": 15 } },
    { "id": "tower30", "title": "연무탑 정상", "description": "연무탑 30층 돌파", "tier": 3, "rule": { "kind": "progress", "key": "tower", "atLeast": 30 } }
  ],
  legacy: {
    // v2 also reads the stage and the number of heroes.
    version: 2,
    read(get, parse) {
      const save = parse.json(get('three-kingdoms-local-v2')) as { stage?: unknown; heroes?: unknown; warRoom?: { towerFloor?: unknown } } | null;
      return { progress: { tower: parse.num(save?.warRoom?.towerFloor), stage: parse.num(save?.stage), heroes: Array.isArray(save?.heroes) ? save.heroes.length : 0 } };
    },
  },
};
