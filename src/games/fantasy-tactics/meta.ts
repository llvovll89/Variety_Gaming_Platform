import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  // One battle is one run. No score is reported, so no scoreOrder/scoreUnit either.
  reportsRuns: true,
  "achievements": [
    {
      "id": "first",
      "title": "원정 시작",
      "description": "첫 전투 치르기",
      "tier": 1,
      "rule": {
        "kind": "runs",
        "atLeast": 1
      }
    },
    {
      "id": "ch1",
      "title": "첫 번째 장",
      "description": "1장 완료",
      "tier": 1,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 1
      }
    },
    {
      "id": "ch3",
      "title": "1부 완결",
      "description": "3장 완료",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 3
      }
    },
    {
      "id": "ch5",
      "title": "바다 건너",
      "description": "5장 완료",
      "tier": 2,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 5
      }
    },
    {
      "id": "ch6",
      "title": "별빛 원정 완결",
      "description": "6장 완료",
      "tier": 3,
      "rule": {
        "kind": "progress",
        "key": "chapter",
        "atLeast": 6
      }
    },
    {
      "id": "wins20",
      "title": "백전노장",
      "description": "전투 20번 승리",
      "tier": 3,
      "rule": {
        "kind": "wins",
        "atLeast": 20
      }
    }
  ],
  /**
   * 한 전투 안에서 끝나는 도전만 낸다. 차례 수 범위는 캠페인을 끝까지 자동으로 돌려 재 보고
   * 정했다(승리한 전투가 7~12차례). 8은 빠듯하고 12는 여유 있는 쪽이다.
   */
  daily: [
    { id: 'swift', label: '전투를 {n}차례 안에 승리', stat: 'rounds', range: [8, 12], step: 1, compare: 'atMost', mode: 'stage', outcome: 'win' },
    { id: 'intact', label: '동료 {n}명 모두 살아남아 승리', stat: 'survivors', range: [4, 4], step: 1, mode: 'stage', outcome: 'win' },
    { id: 'chest', label: '한 전투에서 보물상자 {n}개 열기', stat: 'chests', range: [1, 3], step: 1, mode: 'stage' },
  ],
  legacy: {
    version: 1,
    read(get, parse) {
      // The save holds the chapter in play (0-based); after its battle is won it counts as finished.
      const s = parse.json(get('gh-arcade:fantasy-tactics:v1')) as { stage?: unknown; phase?: unknown } | null;
      if (!Number.isInteger(s?.stage) || (s!.stage as number) < 0 || (s!.stage as number) > 5) return {};
      const finished = ['won', 'camp', 'ending'].includes(String(s!.phase)) ? (s!.stage as number) + 1 : (s!.stage as number);
      return finished > 0 ? { progress: { chapter: finished } } : {};
    },
  },
};
