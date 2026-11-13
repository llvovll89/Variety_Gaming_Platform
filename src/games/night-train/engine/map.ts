import { random, randInt, weighted, type RngHolder } from './rng';
import type { MapNode, NodeType } from './types';

/** Floors 0..11 are stations along the line; floor 12 is the terminal boss. */
export const FLOORS = 12;
export const BOSS_FLOOR = FLOORS;
export const TREASURE_FLOOR = 6;
export const REST_FLOOR = FLOORS - 1;

export const NODE_NAMES: Record<NodeType, string> = {
  battle: '그림자 승객', elite: '강적 칸', rest: '침대칸', shop: '매점칸', event: '수상한 객차', treasure: '화물칸', boss: '새벽역',
};

function rollType(rng: RngHolder, floor: number, parents: NodeType[]): NodeType {
  if (floor === 0) return 'battle';
  if (floor === TREASURE_FLOOR) return 'treasure';
  if (floor === REST_FLOOR) return 'rest';
  const early = floor < 4;
  const weights: Partial<Record<NodeType, number>> = early
    ? { battle: 55, event: 30, shop: 15 }
    : { battle: 44, event: 20, elite: 16, rest: floor === REST_FLOOR - 1 || floor === TREASURE_FLOOR - 1 ? 0 : 12, shop: 8 };
  for (let attempt = 0; attempt < 6; attempt++) {
    const type = weighted(rng, weights);
    // Special stops (rest, shop, elite) should not repeat back to back.
    if (type !== 'battle' && type !== 'event' && parents.includes(type)) continue;
    return type;
  }
  return 'battle';
}

/** Connects two sorted floors without crossing lines; every node gets at least one link both ways. */
function connect(rng: RngHolder, upper: MapNode[], lower: MapNode[]) {
  let i = 0, j = 0;
  const link = () => { if (!upper[i].next.includes(lower[j].id)) upper[i].next.push(lower[j].id); };
  link();
  while (i < upper.length - 1 || j < lower.length - 1) {
    if (i === upper.length - 1) j++;
    else if (j === lower.length - 1) i++;
    else {
      const roll = random(rng);
      if (roll < 0.36) i++;
      else if (roll < 0.72) j++;
      else { i++; j++; }
    }
    link();
  }
}

export function generateMap(rng: RngHolder): MapNode[] {
  const floors: MapNode[][] = [];
  for (let floor = 0; floor < FLOORS; floor++) {
    const count = floor === 0 ? 3 : randInt(rng, 2, 4);
    const row: MapNode[] = [];
    for (let i = 0; i < count; i++) {
      const jitter = (random(rng) - 0.5) * (0.5 / count);
      row.push({ id: `${floor}-${i}`, floor, x: Math.min(0.94, Math.max(0.06, (i + 0.5) / count + jitter)), type: 'battle', next: [] });
    }
    floors.push(row);
  }
  for (let floor = 0; floor < FLOORS - 1; floor++) connect(rng, floors[floor], floors[floor + 1]);
  const boss: MapNode = { id: `${BOSS_FLOOR}-0`, floor: BOSS_FLOOR, x: 0.5, type: 'boss', next: [] };
  for (const node of floors[FLOORS - 1]) node.next.push(boss.id);

  const parentsOf = (node: MapNode) => (node.floor === 0 ? [] : floors[node.floor - 1].filter(p => p.next.includes(node.id)));
  for (const row of floors) for (const node of row) node.type = rollType(rng, node.floor, parentsOf(node).map(p => p.type));

  // Guarantee at least one shop and one elite somewhere in the middle of the line.
  const middle = floors.slice(4, REST_FLOOR - 1).flat();
  for (const needed of ['elite', 'shop'] as const) {
    if (middle.some(node => node.type === needed)) continue;
    const candidates = middle.filter(node => node.type === 'battle' || node.type === 'event');
    if (candidates.length) candidates[Math.floor(random(rng) * candidates.length)].type = needed;
  }
  return [...floors.flat(), boss];
}

export function nodeById(map: MapNode[], id: string) {
  return map.find(node => node.id === id);
}

export function availableNodes(map: MapNode[], path: string[]): MapNode[] {
  if (path.length === 0) return map.filter(node => node.floor === 0);
  const current = nodeById(map, path[path.length - 1]);
  return current ? current.next.map(id => nodeById(map, id)).filter((node): node is MapNode => Boolean(node)) : [];
}
