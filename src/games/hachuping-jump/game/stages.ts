import type { ObstacleKind } from './types';

export const GATES_PER_STAGE = 24;
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
  { name: '바람의 공중 정원', subtitle: '풀꽃과 덩굴이 자라는 공중 섬을 날아요', sky: ['#91cbea','#c6e8f4','#f2f9ef'], ground: '#ad9673', frosting: '#96b55d', hills: ['#b5d8cf','#8bbdc4'], speedStart: 185, speedEnd: 195, gapStart: 235, gapEnd: 230, kinds: ['candy','flower','waffle','cloud','mushroom','candy'], theme: 'garden' },
  { name: '반딧불 버섯숲', subtitle: '민트빛 숲에서 버섯과 꽃을 지나가요', sky: ['#d3f0e2','#ecf8df','#fff5de'], ground: '#c4dfb8', frosting: '#f5fbe6', hills: ['#bde4cc','#a7d4b8'], speedStart: 195, speedEnd: 205, gapStart: 230, gapEnd: 225, kinds: ['mushroom','flower','cloud','flower','mushroom','waffle'], theme: 'forest' },
  { name: '오로라 얼음성', subtitle: '반짝이는 얼음과 구름 문을 통과해요', sky: ['#d5f0fa','#e8f9fa','#fff5eb'], ground: '#c1e1ec', frosting: '#f6fcfc', hills: ['#d9f1ed','#b7dde7'], speedStart: 205, speedEnd: 215, gapStart: 225, gapEnd: 215, kinds: ['crystal','cloud','castle','crystal','cloud','waffle'], theme: 'ice' },
  { name: '노을 장난감 마을', subtitle: '알록달록 블록과 비스킷 탑을 지나가요', sky: ['#ffe3d4','#fff0da','#fff8e5'], ground: '#edc6b0', frosting: '#fff4dc', hills: ['#f6d5b4','#edbfae'], speedStart: 215, speedEnd: 225, gapStart: 215, gapEnd: 210, kinds: ['toy','waffle','candy','toy','castle','cloud'], theme: 'toy' },
  { name: '달빛 별궁전', subtitle: '진주빛 성탑과 별빛 얼음을 따라가요', sky: ['#e0f0f8','#fff0ed','#fff7df'], ground: '#e4d9c5', frosting: '#fff9ed', hills: ['#d4e5e9','#c1d9df'], speedStart: 225, speedEnd: 235, gapStart: 210, gapEnd: 200, kinds: ['castle','crystal','cloud','castle','flower','candy'], theme: 'palace' },
  { name: '새벽 무지개 하늘', subtitle: '모든 친구와 마지막 무지개 길을 날아요', sky: ['#e1f3f8','#ffeced','#fff4dc'], ground: '#e7d5b8', frosting: '#fff8e8', hills: ['#d8ecdd','#c3e1d4'], speedStart: 235, speedEnd: 245, gapStart: 200, gapEnd: 190, kinds: ['cloud','candy','toy','flower','crystal','waffle','castle','mushroom'], theme: 'rainbow' },
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
