import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreUnit": "점",
  "achievements": [
    {
      "id": "first",
      "title": "첫 기억",
      "description": "한 판을 끝까지 해요",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      },
      "kids": {
        "title": "병아리 스티커",
        "sticker": "🐣"
      }
    },
    {
      "id": "best5",
      "title": "기억 다섯 개",
      "description": "5점 넘기",
      "tier": 1,
      "rule": {
        "kind": "best",
        "atLeast": 5
      },
      "kids": {
        "title": "토끼 스티커",
        "sticker": "🐰"
      }
    },
    {
      "id": "stage2",
      "title": "두 번째 단계",
      "description": "2단계까지 가기",
      "tier": 2,
      "rule": {
        "kind": "peak",
        "stat": "stage",
        "atLeast": 2
      },
      "kids": {
        "title": "여우 스티커",
        "sticker": "🦊"
      }
    },
    {
      "id": "best15",
      "title": "기억 열다섯 개",
      "description": "15점 넘기",
      "tier": 2,
      "rule": {
        "kind": "best",
        "atLeast": 15
      },
      "kids": {
        "title": "사자 스티커",
        "sticker": "🦁"
      }
    },
    {
      "id": "stage4",
      "title": "네 번째 단계",
      "description": "4단계까지 가기",
      "tier": 3,
      "rule": {
        "kind": "peak",
        "stat": "stage",
        "atLeast": 4
      },
      "kids": {
        "title": "유니콘 스티커",
        "sticker": "🦄"
      }
    },
    {
      "id": "daily5",
      "title": "매일 기억",
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
      "label": "{n}점 넘기",
      "stat": "score",
      "range": [
        4,
        12
      ],
      "step": 2
    }
  ],
  legacy: {
    version: 2,
    read(get, parse) {
      // Bests from before speeds existed were all played at the normal speed.
      const normal = Math.max(parse.num(get('arcade:hachuping-memory:normal:highScore')), parse.num(get('arcade:hachuping-memory:highScore')), parse.num(get('hachuping-memory-highscore')));
      return { best: { 'default|normal': normal, 'default|slow': parse.num(get('arcade:hachuping-memory:slow:highScore')) } };
    },
  },
};
