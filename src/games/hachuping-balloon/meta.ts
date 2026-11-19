import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  "scoreUnit": "개",
  "achievements": [
    {
      "id": "first",
      "title": "첫 풍선",
      "description": "한 판을 끝까지 해요",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      },
      "kids": {
        "title": "풍선 스티커",
        "sticker": "🎈"
      }
    },
    {
      "id": "best30",
      "title": "풍선 서른 개",
      "description": "한 판에 30개 터뜨리기",
      "tier": 1,
      "rule": {
        "kind": "best",
        "atLeast": 30
      },
      "kids": {
        "title": "폭죽 스티커",
        "sticker": "🎉"
      }
    },
    {
      "id": "total500",
      "title": "풍선 오백 개",
      "description": "모두 합쳐 500개",
      "tier": 2,
      "rule": {
        "kind": "total",
        "stat": "popped",
        "atLeast": 500
      },
      "kids": {
        "title": "색종이 스티커",
        "sticker": "🎊"
      }
    },
    {
      "id": "best60",
      "title": "풍선 예순 개",
      "description": "한 판에 60개 터뜨리기",
      "tier": 2,
      "rule": {
        "kind": "best",
        "atLeast": 60
      },
      "kids": {
        "title": "별 스티커",
        "sticker": "⭐"
      }
    },
    {
      "id": "runs10",
      "title": "풍선 친구",
      "description": "열 판 놀기",
      "tier": 2,
      "rule": {
        "kind": "runs",
        "atLeast": 10
      },
      "kids": {
        "title": "곰돌이 스티커",
        "sticker": "🧸"
      }
    },
    {
      "id": "daily5",
      "title": "매일 풍선",
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
      "label": "풍선 {n}개 터뜨리기",
      "stat": "score",
      "range": [
        20,
        50
      ],
      "step": 5
    }
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      return { best: { 'default|-': parse.num(get('arcade:hachuping-balloon:highScore')) } };
    },
  },
};
