/** Shared shapes for the Night Train deckbuilder. Everything here is plain JSON so a run can be saved mid-combat. */

export type StatusId =
  | 'strength'   // 힘: 공격 피해 +N (영구)
  | 'weak'       // 약화: 주는 공격 피해 25% 감소, 턴마다 1 감소
  | 'vulnerable' // 취약: 받는 공격 피해 50% 증가, 턴마다 1 감소
  | 'burn'       // 화상: 자기 턴 시작 시 N 피해, 이후 1 감소
  | 'thorns'     // 가시: 공격받을 때마다 공격자에게 N 피해
  | 'plating'    // 철갑: 턴 종료 시 방어 N
  | 'drawUp'     // 시간표: 턴 시작 시 카드 N장 더 뽑기
  | 'kindle';    // 불꽃 엔진: 턴 시작 시 모든 적에게 화상 N

export type Statuses = Partial<Record<StatusId, number>>;

export type Effect =
  | { k: 'attack'; n: number; times?: number }
  | { k: 'attackAll'; n: number }
  | { k: 'blockAttack' }
  | { k: 'block'; n: number }
  | { k: 'draw'; n: number }
  | { k: 'energy'; n: number }
  | { k: 'apply'; status: StatusId; n: number; to: 'target' | 'all' | 'self' }
  | { k: 'heal'; n: number };

export type CardType = 'attack' | 'skill' | 'power';
export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare';

export interface CardStats {
  cost: number;
  effects: Effect[];
  exhaust?: boolean;
}

export interface CardDef extends CardStats {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  flavor: string;
  up: Partial<CardStats>;
}

export interface CardInstance {
  uid: number;
  id: string;
  up: boolean;
}

export type EnemyEffect =
  | { k: 'attack'; n: number; times?: number }
  | { k: 'block'; n: number }
  | { k: 'blockAll'; n: number }
  | { k: 'buff'; status: StatusId; n: number }
  | { k: 'buffAll'; status: StatusId; n: number }
  | { k: 'debuff'; status: StatusId; n: number };

export type Intent = 'attack' | 'defend' | 'buff' | 'debuff' | 'attack-debuff' | 'attack-defend' | 'defend-buff';

export interface EnemyMove {
  id: string;
  name: string;
  intent: Intent;
  effects: EnemyEffect[];
}

export interface EnemyState {
  uid: number;
  defId: string;
  hp: number;
  maxHp: number;
  block: number;
  statuses: Statuses;
  intent: string;
  history: string[];
  enraged?: boolean;
}

export interface PlayerCombat {
  block: number;
  energy: number;
  maxEnergy: number;
  statuses: Statuses;
}

export type FxTarget = 'player' | number;
export interface Fx {
  id: number;
  target: FxTarget;
  kind: 'damage' | 'block' | 'heal' | 'status' | 'blocked';
  amount: number;
  label?: string;
}

export interface CombatState {
  kind: 'normal' | 'elite' | 'boss';
  turn: number;
  enemies: EnemyState[];
  player: PlayerCombat;
  draw: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];
  exhausted: CardInstance[];
  fx: Fx[];
  log: string[];
  attacksPlayed: number;
}

export type NodeType = 'battle' | 'elite' | 'rest' | 'shop' | 'event' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  floor: number;
  x: number;
  type: NodeType;
  next: string[];
}

export interface RewardState {
  gold: number | null;
  cards: CardInstance[] | null;
  relic: string | null;
}

export interface ShopState {
  cards: { card: CardInstance; price: number; sold: boolean }[];
  relics: { id: string; price: number; sold: boolean }[];
  removePrice: number;
  removed: boolean;
}

export interface EventState {
  id: string;
  result: string | null;
}

export type Phase = 'map' | 'combat' | 'reward' | 'rest' | 'shop' | 'event' | 'treasure' | 'victory' | 'defeat';
export type Mode = 'normal' | 'easy';

export interface RunState {
  version: 1;
  seed: number;
  rng: number;
  mode: Mode;
  phase: Phase;
  hp: number;
  maxHp: number;
  gold: number;
  deck: CardInstance[];
  relics: string[];
  nextUid: number;
  map: MapNode[];
  path: string[];
  combat: CombatState | null;
  reward: RewardState | null;
  shop: ShopState | null;
  event: EventState | null;
  rest: { done: boolean } | null;
  treasure: { relic: string | null; gold: number; opened: boolean } | null;
  seenEvents: string[];
  stats: { battles: number; elites: number; damageDealt: number; cardsPlayed: number };
  fxSeq: number;
}

export type Command =
  | { t: 'travel'; nodeId: string }
  | { t: 'play'; uid: number; target?: number }
  | { t: 'endTurn' }
  | { t: 'takeGold' }
  | { t: 'pickCard'; index: number }
  | { t: 'skipCards' }
  | { t: 'takeRelic' }
  | { t: 'rest' }
  | { t: 'upgrade'; uid: number }
  | { t: 'buyCard'; index: number }
  | { t: 'buyRelic'; index: number }
  | { t: 'removeCard'; uid: number }
  | { t: 'eventChoice'; index: number; uid?: number }
  | { t: 'openTreasure' }
  | { t: 'leave' };
