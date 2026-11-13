import { CARDS, STARTER_DECK } from './cards';
import { aliveEnemies, checkPlay, endTurn, playCard, startCombat } from './combat';
import { ENCOUNTERS } from './enemies';
import { EVENTS } from './events';
import { availableNodes, generateMap, nodeById } from './map';
import { RELIC_POOL } from './relics';
import { pick, random, randInt, weighted } from './rng';
import type { CardInstance, Command, Mode, Rarity, RunState } from './types';

export const START_HP = { normal: 70, easy: 85 } as const;

export function createRun(seed: number, mode: Mode = 'normal'): RunState {
  const run: RunState = {
    version: 1, seed: seed >>> 0, rng: seed >>> 0, mode, phase: 'map',
    hp: START_HP[mode], maxHp: START_HP[mode], gold: 99,
    deck: [], relics: ['lantern'], nextUid: 1, map: [], path: [],
    combat: null, reward: null, shop: null, event: null, rest: null, treasure: null,
    seenEvents: [], stats: { battles: 0, elites: 0, damageDealt: 0, cardsPlayed: 0 }, fxSeq: 0,
  };
  run.map = generateMap(run);
  for (const id of STARTER_DECK) addCard(run, id);
  return run;
}

export function addCard(run: RunState, id: string, up = false): CardInstance {
  const card = { uid: run.nextUid++, id, up };
  run.deck.push(card);
  return card;
}

function makeCard(run: RunState, id: string): CardInstance {
  return { uid: run.nextUid++, id, up: false };
}

const BY_RARITY = (rarity: Exclude<Rarity, 'starter'>) => Object.values(CARDS).filter(card => card.rarity === rarity).map(card => card.id);

export function randomCardId(run: RunState, rarities: Exclude<Rarity, 'starter'>[], exclude: string[] = []) {
  const pool = rarities.flatMap(BY_RARITY).filter(id => !exclude.includes(id));
  return pick(run, pool.length ? pool : rarities.flatMap(BY_RARITY));
}

function rollCardChoices(run: RunState, weights: Record<'common' | 'uncommon' | 'rare', number>, count: number) {
  const ids: string[] = [];
  while (ids.length < count) ids.push(randomCardId(run, [weighted(run, weights)], ids));
  return ids.map(id => makeCard(run, id));
}

export function gainRelic(run: RunState): string | null {
  const pool = RELIC_POOL.filter(id => !run.relics.includes(id));
  if (!pool.length) return null;
  const relic = pick(run, pool);
  obtainRelic(run, relic);
  return relic;
}

function obtainRelic(run: RunState, relic: string) {
  run.relics.push(relic);
  if (relic === 'cap') { run.maxHp += 10; run.hp = Math.min(run.maxHp, run.hp + 10); }
}

export function restHeal(run: RunState) {
  return Math.floor(run.maxHp * 0.3) + (run.relics.includes('bell') ? 15 : 0);
}

const priceCut = (run: RunState, price: number) => (run.relics.includes('compass') ? Math.round(price * 0.75) : price);

function enterNode(run: RunState) {
  const node = nodeById(run.map, run.path[run.path.length - 1]);
  if (!node) return;
  switch (node.type) {
    case 'battle': {
      const pool = node.floor < 3 ? ENCOUNTERS.easy : ENCOUNTERS.normal;
      startCombat(run, pick(run, pool), 'normal');
      break;
    }
    case 'elite':
      startCombat(run, pick(run, ENCOUNTERS.elite), 'elite');
      break;
    case 'boss':
      startCombat(run, ENCOUNTERS.boss[0], 'boss');
      break;
    case 'rest':
      run.phase = 'rest';
      run.rest = { done: false };
      break;
    case 'treasure': {
      run.phase = 'treasure';
      const pool = RELIC_POOL.filter(id => !run.relics.includes(id));
      run.treasure = { relic: pool.length ? pick(run, pool) : null, gold: randInt(run, 25, 40), opened: false };
      break;
    }
    case 'shop': {
      run.phase = 'shop';
      const base = { common: [45, 55], uncommon: [68, 80], rare: [135, 155] } as const;
      const cards = rollCardChoices(run, { common: 50, uncommon: 37, rare: 13 }, 5).map(card => {
        const rarity = CARDS[card.id].rarity as keyof typeof base;
        return { card, price: priceCut(run, randInt(run, base[rarity][0], base[rarity][1])), sold: false };
      });
      const relicPool = RELIC_POOL.filter(id => !run.relics.includes(id));
      const relics: { id: string; price: number; sold: boolean }[] = [];
      while (relics.length < 2 && relicPool.length) {
        const index = Math.floor(random(run) * relicPool.length);
        relics.push({ id: relicPool.splice(index, 1)[0], price: priceCut(run, randInt(run, 140, 165)), sold: false });
      }
      run.shop = { cards, relics, removePrice: priceCut(run, 75), removed: false };
      break;
    }
    case 'event': {
      const unseen = Object.keys(EVENTS).filter(id => !run.seenEvents.includes(id));
      const id = pick(run, unseen.length ? unseen : Object.keys(EVENTS));
      run.seenEvents.push(id);
      run.phase = 'event';
      run.event = { id, result: null };
      break;
    }
  }
}

function finishCombat(run: RunState) {
  const combat = run.combat;
  if (!combat) return;
  run.stats.battles += 1;
  if (combat.kind === 'elite') run.stats.elites += 1;
  if (run.relics.includes('thermos')) run.hp = Math.min(run.maxHp, run.hp + 5);
  run.combat = null;
  if (combat.kind === 'boss') {
    run.phase = 'victory';
    return;
  }
  const elite = combat.kind === 'elite';
  run.phase = 'reward';
  run.reward = {
    gold: (elite ? randInt(run, 28, 36) : randInt(run, 12, 20)) + (run.relics.includes('ticket') ? 10 : 0),
    cards: rollCardChoices(run, elite ? { common: 45, uncommon: 42, rare: 13 } : { common: 62, uncommon: 33, rare: 5 }, 3),
    relic: elite ? (RELIC_POOL.filter(id => !run.relics.includes(id)).length ? pick(run, RELIC_POOL.filter(id => !run.relics.includes(id))) : null) : null,
  };
}

function settleCombat(run: RunState) {
  if (run.phase === 'combat' && run.combat && aliveEnemies(run.combat).length === 0) finishCombat(run);
}

function backToMap(run: RunState) {
  run.phase = 'map';
  run.combat = null;
  run.reward = null;
  run.shop = null;
  run.event = null;
  run.rest = null;
  run.treasure = null;
}

/** Pure transition: returns a new run and never mutates the input. Invalid commands return the same object. */
export function act(state: RunState, command: Command): RunState {
  if (!isLegal(state, command)) return state;
  const run = structuredClone(state);
  if (run.combat) run.combat.fx = [];
  switch (command.t) {
    case 'travel':
      backToMap(run);
      run.path.push(command.nodeId);
      enterNode(run);
      break;
    case 'play':
      playCard(run, command.uid, command.target);
      settleCombat(run);
      break;
    case 'endTurn':
      endTurn(run);
      settleCombat(run);
      break;
    case 'takeGold':
      run.gold += run.reward!.gold!;
      run.reward!.gold = null;
      break;
    case 'pickCard': {
      const card = run.reward!.cards![command.index];
      run.deck.push(card);
      run.reward!.cards = null;
      break;
    }
    case 'skipCards':
      run.reward!.cards = null;
      break;
    case 'takeRelic':
      obtainRelic(run, run.reward!.relic!);
      run.reward!.relic = null;
      break;
    case 'rest':
      run.hp = Math.min(run.maxHp, run.hp + restHeal(run));
      run.rest!.done = true;
      break;
    case 'upgrade':
      run.deck.find(card => card.uid === command.uid)!.up = true;
      run.rest!.done = true;
      break;
    case 'buyCard': {
      const item = run.shop!.cards[command.index];
      run.gold -= item.price;
      item.sold = true;
      run.deck.push(item.card);
      break;
    }
    case 'buyRelic': {
      const item = run.shop!.relics[command.index];
      run.gold -= item.price;
      item.sold = true;
      obtainRelic(run, item.id);
      break;
    }
    case 'removeCard':
      run.gold -= run.shop!.removePrice;
      run.shop!.removed = true;
      run.deck = run.deck.filter(card => card.uid !== command.uid);
      break;
    case 'eventChoice': {
      const choice = EVENTS[run.event!.id].choices[command.index];
      const card = command.uid === undefined ? undefined : run.deck.find(c => c.uid === command.uid);
      run.event!.result = choice.resolve(run, {
        addCard: (id, up) => addCard(run, id, up),
        gainRelic: () => gainRelic(run),
        randomCardId: rarities => randomCardId(run, rarities),
      }, card);
      if (run.hp <= 0) run.phase = 'defeat';
      break;
    }
    case 'openTreasure':
      run.treasure!.opened = true;
      run.gold += run.treasure!.gold;
      if (run.treasure!.relic) obtainRelic(run, run.treasure!.relic);
      break;
    case 'leave':
      backToMap(run);
      break;
  }
  return run;
}

export function isLegal(run: RunState, command: Command): boolean {
  switch (command.t) {
    case 'travel':
      return run.phase === 'map' && availableNodes(run.map, run.path).some(node => node.id === command.nodeId);
    case 'play':
      return checkPlay(run, command.uid, command.target).ok;
    case 'endTurn':
      return run.phase === 'combat' && !!run.combat;
    case 'takeGold':
      return run.phase === 'reward' && run.reward?.gold != null;
    case 'pickCard':
      return run.phase === 'reward' && !!run.reward?.cards && command.index >= 0 && command.index < run.reward.cards.length;
    case 'skipCards':
      return run.phase === 'reward' && !!run.reward?.cards;
    case 'takeRelic':
      return run.phase === 'reward' && !!run.reward?.relic;
    case 'rest':
      return run.phase === 'rest' && !!run.rest && !run.rest.done;
    case 'upgrade':
      return run.phase === 'rest' && !!run.rest && !run.rest.done && run.deck.some(card => card.uid === command.uid && !card.up);
    case 'buyCard': {
      const item = run.phase === 'shop' ? run.shop?.cards[command.index] : undefined;
      return !!item && !item.sold && run.gold >= item.price;
    }
    case 'buyRelic': {
      const item = run.phase === 'shop' ? run.shop?.relics[command.index] : undefined;
      return !!item && !item.sold && run.gold >= item.price;
    }
    case 'removeCard':
      return run.phase === 'shop' && !!run.shop && !run.shop.removed && run.gold >= run.shop.removePrice && run.deck.length > 5 && run.deck.some(card => card.uid === command.uid);
    case 'eventChoice': {
      if (run.phase !== 'event' || !run.event || run.event.result !== null) return false;
      const choice = EVENTS[run.event.id]?.choices[command.index];
      if (!choice || (choice.available && !choice.available(run))) return false;
      if (!choice.pick) return true;
      const card = run.deck.find(c => c.uid === command.uid);
      return !!card && (choice.pick !== 'upgrade' || !card.up);
    }
    case 'openTreasure':
      return run.phase === 'treasure' && !!run.treasure && !run.treasure.opened;
    case 'leave':
      return ['reward', 'rest', 'shop', 'event', 'treasure'].includes(run.phase) && (run.phase !== 'rest' || !!run.rest?.done) && (run.phase !== 'event' || run.event?.result !== null);
  }
}

export function currentFloor(run: RunState) {
  return run.path.length === 0 ? 0 : (nodeById(run.map, run.path[run.path.length - 1])?.floor ?? 0) + 1;
}

/** Simple, stable score for records: stations passed, elites beaten and a big bonus for reaching dawn. */
export function runScore(run: RunState) {
  const cleared = run.phase === 'victory' ? run.path.length : Math.max(0, run.path.length - 1);
  return cleared * 10 + run.stats.elites * 25 + (run.phase === 'victory' ? 200 : 0) + Math.floor(run.gold / 10);
}
