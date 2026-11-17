import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  "achievements": [
    {
      "id": "tower5",
      "title": "연무탑 5층",
      "description": "연무탑 5층 돌파",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "tower",
        "atLeast": 5
      }
    },
    {
      "id": "tower15",
      "title": "연무탑 15층",
      "description": "연무탑 15층 돌파",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "tower",
        "atLeast": 15
      }
    },
    {
      "id": "tower30",
      "title": "연무탑 정상",
      "description": "연무탑 30층 돌파",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "tower",
        "atLeast": 30
      }
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      const save = parse.json(get('three-kingdoms-local-v2')) as { warRoom?: { towerFloor?: unknown } } | null;
      return { progress: { tower: parse.num(save?.warRoom?.towerFloor) } };
    },
  },
};
