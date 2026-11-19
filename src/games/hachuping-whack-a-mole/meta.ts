import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
// Achievement ids are stored keys: keep them when goals change (normal300/hard400 now ask 800/1,000,
// sized for combo scoring).
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreUnit": "점",
  "achievements": [
    {
      "id": "first",
      "title": "첫 두더지",
      "description": "한 판을 끝까지 해요",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      },
      "kids": {
        "title": "뿅망치 스티커",
        "sticker": "🔨"
      }
    },
    {
      "id": "combo10",
      "title": "연타 박사",
      "description": "한 판에 10콤보",
      "tier": 1,
      "rule": {
        "kind": "peak",
        "stat": "combo",
        "atLeast": 10
      },
      "kids": {
        "title": "번개 스티커",
        "sticker": "⚡"
      }
    },
    {
      "id": "hits100",
      "title": "두더지 백 마리",
      "description": "모두 합쳐 100마리 잡기",
      "tier": 1,
      "rule": {
        "kind": "total",
        "stat": "hits",
        "atLeast": 100
      },
      "kids": {
        "title": "두더지 스티커",
        "sticker": "🐹"
      }
    },
    {
      "id": "normal300",
      "title": "보통 800점",
      "description": "보통에서 800점",
      "tier": 2,
      "rule": {
        "kind": "best",
        "atLeast": 800,
        "difficulty": "normal"
      },
      "kids": {
        "title": "동메달 스티커",
        "sticker": "🥉"
      }
    },
    {
      "id": "hard400",
      "title": "어려움 1,000점",
      "description": "어려움에서 1,000점",
      "tier": 2,
      "rule": {
        "kind": "best",
        "atLeast": 1000,
        "difficulty": "hard"
      },
      "kids": {
        "title": "은메달 스티커",
        "sticker": "🥈"
      }
    },
    {
      "id": "daily5",
      "title": "매일 두더지",
      "description": "오늘의 도전 5번 완료",
      "tier": 3,
      "rule": {
        "kind": "daily",
        "atLeast": 5
      },
      "kids": {
        "title": "트로피 스티커",
        "sticker": "🏆"
      }
    }
  ],
  "daily": [
    {
      "id": "score-easy",
      "label": "쉬움에서 {n}점 넘기",
      "stat": "score",
      "range": [250, 500],
      "step": 50,
      "difficulty": [{ "id": "easy", "label": "쉬움" }]
    },
    {
      "id": "score-normal",
      "label": "보통에서 {n}점 넘기",
      "stat": "score",
      "range": [400, 800],
      "step": 50,
      "difficulty": [{ "id": "normal", "label": "보통" }]
    },
    {
      "id": "score-hard",
      "label": "어려움에서 {n}점 넘기",
      "stat": "score",
      "range": [500, 1000],
      "step": 50,
      "difficulty": [{ "id": "hard", "label": "어려움" }]
    },
    {
      "id": "combo",
      "label": "한 판에 {n}콤보 만들기",
      "stat": "combo",
      "range": [
        6,
        14
      ],
      "step": 2
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      const best: Record<string, number> = {};
      for (const d of ['easy', 'normal', 'hard']) best[`default|${d}`] = parse.num(get(`arcade:hachuping-whack-a-mole:${d}:highScore`));
      best['legacy|-'] = parse.num(get('arcade:hachuping-whack-a-mole:highScore'));
      return { best };
    },
  },
};
