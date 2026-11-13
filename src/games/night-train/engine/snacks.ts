import type { Effect } from './types';

/** One-shot consumables. They cost no energy and are used from the snack bag at any time in a fight. */
export interface SnackDef {
  id: string;
  name: string;
  desc: string;
  effects: Effect[];
  target: boolean;
  /** Usable on the map as well as in combat. */
  anywhere?: boolean;
  price: [number, number];
}

export const SNACK_SLOTS = 3;

export const SNACKS: Record<string, SnackDef> = Object.fromEntries(([
  { id: 'star-candy', name: '별사탕 한 줌', desc: '방어 12를 얻습니다.', effects: [{ k: 'block', n: 12 }], target: false, price: [40, 50] },
  { id: 'cocoa', name: '따끈한 코코아', desc: '체력 15를 회복합니다. 전투 밖에서도 마실 수 있어요.', effects: [{ k: 'heal', n: 15 }], target: false, anywhere: true, price: [45, 55] },
  { id: 'spicy-skewer', name: '매운 떡꼬치', desc: '이번 전투 동안 힘 +2.', effects: [{ k: 'apply', status: 'strength', n: 2, to: 'self' }], target: false, price: [50, 60] },
  { id: 'emergency-whistle', name: '비상 호루라기', desc: '모든 적에게 피해 10 (힘·약화와 무관).', effects: [{ k: 'damageAll', n: 10 }], target: false, price: [50, 60] },
  { id: 'mint', name: '박하 사탕', desc: '카드 3장을 뽑습니다.', effects: [{ k: 'draw', n: 3 }], target: false, price: [40, 50] },
  { id: 'lemon-drop', name: '새콤한 레몬캔디', desc: '적 하나에게 취약 3.', effects: [{ k: 'apply', status: 'vulnerable', n: 3, to: 'target' }], target: true, price: [40, 50] },
  { id: 'gimbap', name: '꼬마 김밥', desc: '에너지 2를 얻습니다.', effects: [{ k: 'energy', n: 2 }], target: false, price: [55, 65] },
] satisfies SnackDef[]).map(snack => [snack.id, snack]));

export const SNACK_POOL = Object.keys(SNACKS);
