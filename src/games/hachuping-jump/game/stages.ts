import type { ObstacleKind } from './types';

export const GATES_PER_STAGE = 12;
export const STAGE_BONUS = 100;
export const INTRO_DURATION = 2;
export const CHECKPOINT_DURATION = 3;
export type JourneyPhase = 'intro' | 'playing' | 'checkpoint' | 'finale' | 'completed';
export type StageTheme = 'garden' | 'forest' | 'ice' | 'toy' | 'palace' | 'rainbow';

export interface StageDefinition {
  name: string; subtitle: string; sky: [string, string, string]; ground: string; frosting: string;
  hills: [string, string]; speedStart: number; speedEnd: number; gapStart: number; gapEnd: number;
  kinds: ObstacleKind[]; theme: StageTheme;
}

export const STAGES: StageDefinition[] = [
  { name: '솜사탕 정원', subtitle: '사탕 문을 지나 모험을 시작해요', sky: ['#aee0f0','#f7e9f3','#fff0d7'], ground: '#ecc7a0', frosting: '#fff5de', hills: ['#c7e4d8','#a6d7c2'], speedStart: 185, speedEnd: 195, gapStart: 235, gapEnd: 230, kinds: ['candy','mushroom','candy','cloud'], theme: 'garden' },
  { name: '반딧불 버섯숲', subtitle: '큰 버섯과 흔들리는 구름을 조심!', sky: ['#204d57','#56857a','#c8d8ae'], ground: '#6f8d64', frosting: '#c0d793', hills: ['#699689','#396e64'], speedStart: 195, speedEnd: 205, gapStart: 230, gapEnd: 225, kinds: ['mushroom','cloud','mushroom','candy'], theme: 'forest' },
  { name: '오로라 얼음성', subtitle: '숨 쉬는 얼음 문 사이를 지나가요', sky: ['#343b78','#8abccc','#dbf5f2'], ground: '#89b7ce', frosting: '#edffff', hills: ['#c6e7ec','#96c6db'], speedStart: 205, speedEnd: 215, gapStart: 225, gapEnd: 215, kinds: ['crystal','cloud','crystal','mushroom'], theme: 'ice' },
  { name: '노을 장난감 마을', subtitle: '태엽 장난감과 반짝이는 탑을 지나가요', sky: ['#ee8f82','#f7c78d','#fff0c6'], ground: '#b67865', frosting: '#ffe3ad', hills: ['#e7ad82','#c98276'], speedStart: 215, speedEnd: 225, gapStart: 215, gapEnd: 210, kinds: ['candy','crystal','cloud','mushroom'], theme: 'toy' },
  { name: '달빛 별궁전', subtitle: '별빛 기둥 사이로 달을 따라가요', sky: ['#242046','#68557f','#bc91aa'], ground: '#766187', frosting: '#edcce2', hills: ['#9580a5','#75658f'], speedStart: 225, speedEnd: 235, gapStart: 210, gapEnd: 200, kinds: ['cloud','crystal','mushroom','candy'], theme: 'palace' },
  { name: '새벽 무지개 하늘', subtitle: '마지막 무지개 길을 끝까지 날아가요', sky: ['#433c86','#9b8ed0','#ffd2bd'], ground: '#8470a8', frosting: '#fff1ca', hills: ['#b5a8d5','#8979b3'], speedStart: 235, speedEnd: 245, gapStart: 200, gapEnd: 190, kinds: ['crystal','cloud','candy','mushroom'], theme: 'rainbow' },
];

export function createJourney() { return { stage: 0, spawned: 0, cleared: 0, phase: 'intro' as JourneyPhase, phaseTime: INTRO_DURATION, completed: false }; }
export type Journey = ReturnType<typeof createJourney>;
export function stageProgress(journey: Journey): number { return Math.max(0, Math.min(1, journey.cleared / GATES_PER_STAGE)); }
export function finishStage(journey: Journey): boolean {
  if (journey.completed || journey.phase !== 'playing' || journey.cleared < GATES_PER_STAGE) return false;
  journey.phase = journey.stage === STAGES.length - 1 ? 'finale' : 'checkpoint';
  journey.phaseTime = CHECKPOINT_DURATION;
  return true;
}
export function advanceJourneyPhase(journey: Journey, dt: number): 'none' | 'play' | 'next' | 'complete' {
  if (journey.phase === 'playing' || journey.phase === 'completed') return 'none';
  journey.phaseTime = Math.max(0, journey.phaseTime - dt);
  if (journey.phaseTime > 0) return 'none';
  if (journey.phase === 'intro') { journey.phase = 'playing'; return 'play'; }
  if (journey.phase === 'checkpoint') { journey.stage++; journey.spawned = 0; journey.cleared = 0; journey.phase = 'playing'; return 'next'; }
  journey.phase = 'completed'; journey.completed = true; return 'complete';
}
