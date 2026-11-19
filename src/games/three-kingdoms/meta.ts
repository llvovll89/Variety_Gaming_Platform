import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  // A campaign that ends reports a run; the score of a 통일 is the turns it took (fewer is better).
  reportsRuns: true,
  "scoreOrder": "low",
  "scoreUnit": "순",
  "achievements": [
    { "id": "first", "title": "출사표", "description": "캠페인 시작", "tier": 1, "rule": { "kind": "progress", "key": "started", "atLeast": 1 } },
    { "id": "cities4", "title": "네 개의 성", "description": "성 4개 다스리기", "tier": 1, "rule": { "kind": "progress", "key": "cities", "atLeast": 4 } },
    { "id": "cities8", "title": "중원의 절반", "description": "성 8개 다스리기", "tier": 2, "rule": { "kind": "progress", "key": "cities", "atLeast": 8 } },
    { "id": "win1", "title": "천하통일", "description": "중원 통일", "tier": 3, "rule": { "kind": "wins", "atLeast": 1 } },
    { "id": "win3", "title": "패왕", "description": "세 번 통일", "tier": 3, "rule": { "kind": "wins", "atLeast": 3 } }
  ]
};
