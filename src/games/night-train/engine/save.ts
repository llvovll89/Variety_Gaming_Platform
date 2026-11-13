import { z } from 'zod';
import { CARDS } from './cards';
import { ENEMIES } from './enemies';
import { EVENTS } from './events';
import { RELICS } from './relics';
import { SNACKS } from './snacks';
import type { RunState } from './types';

export const SAVE_KEY = 'arcade:night-train:run';
export const RECORD_KEY = 'arcade:night-train:records';

const count = z.number().int().min(0).max(1_000_000);
const statusIds = ['strength', 'weak', 'vulnerable', 'burn', 'thorns', 'plating', 'drawUp', 'kindle'] as const;
const statuses = z.partialRecord(z.enum(statusIds), z.number().int().min(-99).max(999));
const cardId = z.string().refine(id => id in CARDS, '알 수 없는 카드');
const relicId = z.string().refine(id => id in RELICS, '알 수 없는 유물');
const snackId = z.string().refine(id => id in SNACKS, '알 수 없는 간식');
const card = z.object({ uid: count, id: cardId, up: z.boolean() });
const pile = z.array(card).max(200);

const enemy = z.object({
  uid: count, defId: z.string().refine(id => id in ENEMIES, '알 수 없는 적'), hp: count, maxHp: count.min(1), block: count,
  statuses, intent: z.string(), history: z.array(z.string()).max(500), enraged: z.boolean().optional(),
}).refine(e => e.intent in ENEMIES[e.defId].moves || e.hp === 0, '알 수 없는 행동');

const combat = z.object({
  kind: z.enum(['normal', 'elite', 'boss']), turn: count, enemies: z.array(enemy).min(1).max(5),
  player: z.object({ block: count, energy: count, maxEnergy: count, statuses }),
  draw: pile, hand: pile.max(10), discard: pile, exhausted: pile,
  fx: z.array(z.unknown()).transform(() => []), log: z.array(z.string()).max(60), attacksPlayed: count,
  frames: z.array(z.unknown()).optional().transform(() => []), lastPlayed: z.unknown().optional().transform(() => null),
});

const node = z.object({
  id: z.string(), floor: count, x: z.number().min(0).max(1),
  type: z.enum(['battle', 'elite', 'rest', 'shop', 'event', 'treasure', 'boss']), next: z.array(z.string()).max(6),
});

export const runSchema = z.object({
  // Seeds are full 32-bit values (createRun uses the clock), so they must not share `count`'s cap.
  version: z.literal(1), seed: z.number().int().min(0).max(2 ** 32), rng: z.number().int().min(0).max(2 ** 32), mode: z.enum(['normal', 'easy']),
  phase: z.enum(['map', 'combat', 'reward', 'rest', 'shop', 'event', 'treasure', 'victory', 'defeat']),
  hp: count, maxHp: count.min(1), gold: count, deck: pile.min(1), relics: z.array(relicId).max(20), snacks: z.array(snackId).max(3).default([]), nextUid: count,
  map: z.array(node).min(2).max(80), path: z.array(z.string()).max(20),
  combat: combat.nullable(),
  reward: z.object({ gold: count.nullable(), cards: z.array(card).max(4).nullable(), relic: relicId.nullable(), snack: snackId.nullable().default(null) }).nullable(),
  shop: z.object({
    cards: z.array(z.object({ card, price: count, sold: z.boolean() })).max(8),
    relics: z.array(z.object({ id: relicId, price: count, sold: z.boolean() })).max(4),
    snacks: z.array(z.object({ id: snackId, price: count, sold: z.boolean() })).max(4).default([]),
    removePrice: count, removed: z.boolean(),
  }).nullable(),
  event: z.object({ id: z.string().refine(id => id in EVENTS, '알 수 없는 사건'), result: z.string().nullable() }).nullable(),
  rest: z.object({ done: z.boolean() }).nullable(),
  treasure: z.object({ relic: relicId.nullable(), gold: count, opened: z.boolean() }).nullable(),
  seenEvents: z.array(z.string()).max(20),
  stats: z.object({ battles: count, elites: count, damageDealt: count, cardsPlayed: count }),
  fxSeq: count,
}).refine(run => run.hp <= run.maxHp, '체력이 최대치를 넘습니다')
  .refine(run => run.path.every(id => run.map.some(n => n.id === id)), '경로가 지도와 맞지 않습니다')
  .refine(run => run.phase !== 'combat' || run.combat !== null, '전투 정보가 없습니다');

/** Returns null for missing, corrupt or finished runs so the hub never offers to resume a broken save. */
export function loadRun(raw: string | null): RunState | null {
  if (!raw) return null;
  try {
    const parsed = runSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const run = parsed.data as RunState;
    return run.phase === 'victory' || run.phase === 'defeat' ? null : run;
  } catch {
    return null;
  }
}

export interface Records {
  runs: number;
  wins: number;
  bestFloor: number;
  bestScore: number;
}

const recordSchema = z.object({ runs: count, wins: count, bestFloor: count, bestScore: count });

export function loadRecords(raw: string | null): Records {
  try {
    const parsed = raw ? recordSchema.safeParse(JSON.parse(raw)) : null;
    if (parsed?.success) return parsed.data;
  } catch { /* fall through */ }
  return { runs: 0, wins: 0, bestFloor: 0, bestScore: 0 };
}

export function recordRun(records: Records, result: { won: boolean; floor: number; score: number }): Records {
  return {
    runs: records.runs + 1,
    wins: records.wins + (result.won ? 1 : 0),
    bestFloor: Math.max(records.bestFloor, result.floor),
    bestScore: Math.max(records.bestScore, result.score),
  };
}
