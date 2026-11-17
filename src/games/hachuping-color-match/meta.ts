import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  "scoreUnit": "점",
  "achievements": [
    {
      "id": "first",
      "title": "첫 물감",
      "description": "한 판을 끝까지 해요",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      },
      "kids": {
        "title": "팔레트 스티커",
        "sticker": "🎨"
      }
    },
    {
      "id": "streak10",
      "title": "색깔 박사",
      "description": "10번 연속 정답",
      "tier": 1,
      "rule": {
        "kind": "peak",
        "stat": "streak",
        "atLeast": 10
      },
      "kids": {
        "title": "무지개 스티커",
        "sticker": "🌈"
      }
    },
    {
      "id": "correct200",
      "title": "물감 이백 방울",
      "description": "모두 합쳐 200번 맞히기",
      "tier": 1,
      "rule": {
        "kind": "total",
        "stat": "correct",
        "atLeast": 200
      },
      "kids": {
        "title": "물방울 스티커",
        "sticker": "💧"
      }
    },
    {
      "id": "normal300",
      "title": "보통 300점",
      "description": "보통에서 300점",
      "tier": 2,
      "rule": {
        "kind": "best",
        "atLeast": 300,
        "difficulty": "normal"
      },
      "kids": {
        "title": "붓 스티커",
        "sticker": "🖌️"
      }
    },
    {
      "id": "hard300",
      "title": "어려움 300점",
      "description": "어려움에서 300점",
      "tier": 2,
      "rule": {
        "kind": "best",
        "atLeast": 300,
        "difficulty": "hard"
      },
      "kids": {
        "title": "훈장 스티커",
        "sticker": "🎖️"
      }
    },
    {
      "id": "daily5",
      "title": "매일 색칠",
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
      "id": "score",
      "label": "{difficulty}에서 {n}점 넘기",
      "stat": "score",
      "range": [
        100,
        300
      ],
      "step": 50,
      "difficulty": [
        {
          "id": "easy",
          "label": "쉬움"
        },
        {
          "id": "normal",
          "label": "보통"
        },
        {
          "id": "hard",
          "label": "어려움"
        }
      ]
    },
    {
      "id": "streak",
      "label": "{n}번 연속 맞히기",
      "stat": "streak",
      "range": [
        5,
        12
      ],
      "step": 1
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      const best: Record<string, number> = {};
      for (const d of ['easy', 'normal', 'hard']) best[`default|${d}`] = parse.num(get(`arcade:hachuping-color-match:${d}:highScore`));
      best['legacy|-'] = parse.num(get('arcade:hachuping-color-match:highScore'));
      return { best };
    },
  },
};
