import { random, randInt, weighted, type RngHolder } from './rng';
import type { MapNode, NodeType } from './types';

/** Floors 0..11 are stations along the line; floor 12 is the terminal boss. */
export const FLOORS = 12;
export const BOSS_FLOOR = FLOORS;
export const TREASURE_FLOOR = 6;
export const REST_FLOOR = FLOORS - 1;

/** Each stretch of the line has its own name and scenery. */
export const REGIONS = [
  { from: 0, to: 3, name: '교외 선로', note: '불 꺼진 마을을 지나는 첫 구간', color: '#2f8a5a' },
  { from: 4, to: 7, name: '안개 협곡', note: '강적이 숨어드는 깊은 골짜기', color: '#7a52b0' },
  { from: 8, to: 11, name: '별빛 철교', note: '하늘과 가장 가까운 다리', color: '#2c6cc0' },
  { from: 12, to: 12, name: '새벽역', note: '검은 기관차가 기다리는 종착역', color: '#d0562a' },
] as const;

const STATION_POOLS = [
  ['등불마을', '버드나무', '우체국 앞', '물레방아', '붉은 지붕', '종탑', '양떼 목장', '건초 언덕', '작은 다리', '시계방', '빵집 골목', '풍차', '사과밭', '우물가', '개울', '달맞이'],
  ['안개 고개', '이끼 동굴', '메아리 절벽', '흐린 호수', '부엉이 숲', '고사리 계곡', '낡은 등대', '회색 폭포', '구름다리', '늑대 바위', '버섯 마을', '은방울 숲', '바람 고개', '물안개 나루', '갈대밭', '이슬 언덕'],
  ['북두 철교', '은하 나루', '별똥 언덕', '혜성 광장', '달빛 정원', '오리온', '견우 다리', '직녀 정원', '유성 전망대', '성운 터널', '샛별 마을', '천문대', '은빛 철탑', '별자리 공원', '하늘 정원', '새벽별'],
] as const;

/**
 * Deterministic station names: every node gets a unique name from its region's pool, shuffled by
 * the run seed, so the same run always shows the same line without storing names in the save.
 */
export function stationNames(map: MapNode[], seed: number): Map<string, string> {
  const names = new Map<string, string>();
  STATION_POOLS.forEach((pool, region) => {
    const nodes = map.filter(n => n.type !== 'boss' && regionIndex(n.floor) === region).sort((a, b) => a.floor - b.floor || a.x - b.x);
    const order = [...pool];
    let h = (seed ^ (region + 1) * 0x9e3779b1) >>> 0;
    for (let i = order.length - 1; i > 0; i--) {
      h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
      const j = h % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    nodes.forEach((node, i) => names.set(node.id, order[i % order.length]));
  });
  for (const node of map) if (node.type === 'boss') names.set(node.id, '새벽역');
  return names;
}

export function regionIndex(floor: number) {
  return Math.max(0, REGIONS.findIndex(region => floor >= region.from && floor <= region.to));
}

/** Pretend timetable: the train leaves at 23:58 and each stop is 24 minutes up the line. */
export function departureTime(floor: number, platform = 0) {
  const minutes = (23 * 60 + 58 + floor * 24 + platform * 4) % (24 * 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function regionOf(floor: number) {
  return REGIONS.find(region => floor >= region.from && floor <= region.to) ?? REGIONS[0];
}

export const NODE_NOTES: Record<NodeType, string> = {
  battle: '그림자 승객과 싸워 카드와 골드를 얻어요.',
  elite: '위험하지만 유물을 꼭 하나 줘요.',
  rest: '체력을 회복하거나 카드 한 장을 강화해요.',
  shop: '카드·유물·간식을 사거나 카드를 덜어 내요.',
  event: '무슨 일이 일어날지 몰라요.',
  treasure: '잠긴 화물 상자에 유물이 들어 있어요.',
  boss: '새벽을 삼킨 검은 기관차. 체력이 절반 아래면 폭주해요.',
};

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
