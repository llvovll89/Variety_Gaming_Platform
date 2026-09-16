import type { ObstacleKind } from './types';
export const GATES_PER_STAGE = 8;
export const STAGE_BONUS = 100;
export const STAGES: { name: string; subtitle: string; sky: [string, string, string]; ground: string; frosting: string; speed: number; gap: number; kinds: ObstacleKind[] }[] = [
  { name: '솜사탕 정원', subtitle: '사탕 문을 지나 모험을 시작해요', sky: ['#aee0f0','#f7e9f3','#fff0d7'], ground: '#ecc7a0', frosting: '#fff5de', speed: 200, gap: 230, kinds: ['candy','mushroom','candy','cloud'] },
  { name: '반딧불 버섯숲', subtitle: '큰 버섯과 흔들리는 구름을 조심!', sky: ['#204d57','#56857a','#c8d8ae'], ground: '#6f8d64', frosting: '#c0d793', speed: 215, gap: 225, kinds: ['mushroom','cloud','mushroom','candy'] },
  { name: '오로라 얼음성', subtitle: '얼음 문의 틈이 넓어졌다 좁아져요', sky: ['#343b78','#8abccc','#dbf5f2'], ground: '#89b7ce', frosting: '#edffff', speed: 230, gap: 220, kinds: ['crystal','cloud','crystal','mushroom'] },
  { name: '달빛 별궁전', subtitle: '마지막 여덟 개의 문을 넘어봐요', sky: ['#242046','#68557f','#bc91aa'], ground: '#766187', frosting: '#edcce2', speed: 245, gap: 215, kinds: ['cloud','crystal','mushroom','candy'] },
];
export function createJourney() { return { stage: 0, spawned: 0, cleared: 0, bannerTime: 3, completed: false }; }
export type Journey = ReturnType<typeof createJourney>;
export function finishStage(journey: Journey): boolean {
  if (journey.completed || journey.cleared < GATES_PER_STAGE) return false;
  if (journey.stage === STAGES.length - 1) journey.completed = true;
  else { journey.stage++; journey.spawned = 0; journey.cleared = 0; journey.bannerTime = 3; }
  return true;
}
