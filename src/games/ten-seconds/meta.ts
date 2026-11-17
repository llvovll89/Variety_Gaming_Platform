import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  "scoreOrder": "low",
  "scoreUnit": "회",
  "achievements": [
    {
      "id": "first",
      "title": "첫 방",
      "description": "방 하나 탈출",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 1
      }
    },
    {
      "id": "rooms3",
      "title": "세 개의 방",
      "description": "방 3개 탈출",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 3
      }
    },
    {
      "id": "stars12",
      "title": "별 12개",
      "description": "별 12개 모으기",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "stars",
        "atLeast": 12
      }
    },
    {
      "id": "rooms6",
      "title": "여섯 개의 방",
      "description": "방 6개 탈출",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 6
      }
    },
    {
      "id": "all",
      "title": "연구소 탈출",
      "description": "방 9개 모두 탈출",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "cleared",
        "atLeast": 9
      }
    },
    {
      "id": "stars27",
      "title": "시간의 달인",
      "description": "별 27개 모두 모으기",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "stars",
        "atLeast": 27
      }
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      const p = parse.json(get('ten-seconds-progress-v1')) as any;
      // Same checks as the game's own loader: whole-number level keys, 1 to 3 stars.
      const stars = Object.entries(p?.best ?? {}).filter(([i]) => /^\d+$/.test(i) && Number(i) < 9)
        .map(([, v]) => (v as { stars?: unknown })?.stars).filter((n): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 3);
      return { progress: { cleared: stars.length, stars: stars.reduce((a, b) => a + b, 0) } };
    },
  },
};
