import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  // 적게 맞힐수록 좋은 기록이다. '세 번 만에'는 3이 4보다 낫다.
  scoreOrder: 'low',
  scoreUnit: '번',
  achievements: [
    { id: 'first', title: '첫 낱말', description: '한 판 해 보기', tier: 1, rule: { kind: 'runs', atLeast: 1 } },
    { id: 'solved', title: '정답', description: '낱말 하나 맞히기', tier: 1, rule: { kind: 'total', stat: 'solved', atLeast: 1 } },
    { id: 'solved25', title: '낱말 수집가', description: '낱말 25개 맞히기', tier: 2, rule: { kind: 'total', stat: 'solved', atLeast: 25 } },
    { id: 'quick', title: '세 번 만에', description: '세 번 안에 맞히기', tier: 2, rule: { kind: 'best', atLeast: 3 } },
    { id: 'daily30', title: '서른 날의 낱말', description: '오늘의 도전 30번 달성', tier: 3, rule: { kind: 'daily', atLeast: 30 } },
    { id: 'solved100', title: '낱말의 달인', description: '낱말 100개 맞히기', tier: 3, rule: { kind: 'total', stat: 'solved', atLeast: 100 } },
  ],
  /**
   * 오늘의 낱말은 하루에 한 번뿐이라 "맞히기"까지만 도전으로 낸다. 횟수를 줄이는 도전은 다시
   * 해 볼 수 있는 연습 낱말에 건다. 한 번 어긋나면 그날은 손쓸 수 없는 약속이 되지 않게 한다.
   */
  daily: [
    { id: 'solve', label: '오늘의 낱말 맞히기', stat: 'solved', range: [1, 1], step: 1, mode: 'daily', outcome: 'win', seeded: true },
    { id: 'quick', label: '연습 낱말을 {n}번 안에 맞히기', stat: 'guesses', range: [3, 5], step: 1, compare: 'atMost', mode: 'free', outcome: 'win' },
  ],
};
