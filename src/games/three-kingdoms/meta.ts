import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  "achievements": [
    {
      "id": "first",
      "title": "출사표",
      "description": "캠페인 시작",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "win1",
      "title": "천하통일",
      "description": "중원 통일",
      "tier": 3,
      "rule": {
        "kind": "wins",
        "atLeast": 1
      }
    },
    {
      "id": "win3",
      "title": "패왕",
      "description": "세 번 통일",
      "tier": 3,
      "rule": {
        "kind": "wins",
        "atLeast": 3
      }
    }
  ]
};
