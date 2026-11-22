import type { GameMeta } from '../../platform/meta/types';

/** Records, achievements and daily challenges for this game. Data only, loaded with the registry. */
export const meta: GameMeta = {
  reportsRuns: true,
  scoreUnit: '점',
  achievements: [
    { id: 'first', title: '첫 공연', description: '한 판을 끝까지 해요', tier: 1, kids: { title: '음표 스티커', sticker: '🎵' }, rule: { kind: 'runs', atLeast: 1 } },
    { id: 'hit20', title: '손뼉 스무 번', description: '한 판에 스무 번 맞히기', tier: 1, kids: { title: '손뼉 스티커', sticker: '👏' }, rule: { kind: 'peak', stat: 'hits', atLeast: 20 } },
    { id: 'score50', title: '오십 점', description: '한 판에 50점 넘기', tier: 2, kids: { title: '북 스티커', sticker: '🥁' }, rule: { kind: 'best', atLeast: 50 } },
    { id: 'combo15', title: '열다섯 번 척척', description: '열다섯 번 이어서 맞히기', tier: 2, kids: { title: '반짝 스티커', sticker: '✨' }, rule: { kind: 'peak', stat: 'combo', atLeast: 15 } },
    { id: 'runs20', title: '숲속 단골', description: '스무 판 해 보기', tier: 3, kids: { title: '나무 스티커', sticker: '🌳' }, rule: { kind: 'runs', atLeast: 20 } },
    { id: 'daily10', title: '열 밤의 공연', description: '오늘의 도전 열 번 달성', tier: 3, kids: { title: '별 스티커', sticker: '🌟' }, rule: { kind: 'daily', atLeast: 10 } },
  ],
  /**
   * 빠르기에 따라 음표 수가 크게 달라서(천천히 ~32개, 보통 ~59개) 점수 목표를 하나로 묶을 수
   * 없다. 빠르기마다 따로 낸다. 이어 맞히기는 어느 빠르기에서도 같은 뜻이라 함께 쓴다.
   */
  daily: [
    { id: 'easy-score', label: '천천히에서 {n}점 넘기', stat: 'score', range: [20, 32], step: 4, mode: 'daily', difficulty: [{ id: 'easy', label: '천천히' }], seeded: true },
    { id: 'normal-score', label: '보통에서 {n}점 넘기', stat: 'score', range: [35, 55], step: 5, mode: 'daily', difficulty: [{ id: 'normal', label: '보통' }], seeded: true },
    { id: 'combo', label: '{n}번 이어서 맞히기', stat: 'combo', range: [6, 14], step: 4, mode: 'daily', seeded: true },
  ],
};
