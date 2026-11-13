import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['src/games/night-train/engine/index.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const E = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].text).toString('base64'));
const { createRun, act, availableNodes, attackDamage, cardStats, describeCard, loadRun, loadRecords, recordRun, runScore, ENEMIES, CARDS, EVENTS, BOSS_FLOOR, TREASURE_FLOOR, REST_FLOOR, restHeal, aliveEnemies, needsTarget } = E;

/** Starts a fight on floor 0 and then replaces the enemies so each rule can be tested in isolation. */
function fight(enemies, { seed = 7, hand } = {}) {
  let run = createRun(seed);
  run = act(run, { t: 'travel', nodeId: availableNodes(run.map, run.path)[0].id });
  assert.equal(run.phase, 'combat');
  run = structuredClone(run);
  run.combat.enemies = enemies.map((e, uid) => ({ uid, defId: e.defId, hp: e.hp ?? 30, maxHp: e.maxHp ?? e.hp ?? 30, block: 0, statuses: e.statuses ?? {}, intent: e.intent, history: [] }));
  if (hand) {
    run.combat.hand = hand.map((id, i) => ({ uid: 1000 + i, id, up: false }));
    run.combat.player.energy = 3;
  }
  return run;
}

test('runs are deterministic for a seed and start with the expected deck', () => {
  assert.deepEqual(createRun(42), createRun(42));
  assert.notDeepEqual(createRun(42).map, createRun(43).map);
  const run = createRun(1);
  assert.equal(run.deck.length, 10);
  assert.equal(run.hp, 70);
  assert.deepEqual(run.relics, ['lantern']);
  assert.equal(createRun(1, 'easy').maxHp, 85);
  assert.equal(new Set(run.deck.map(c => c.uid)).size, 10);
});

test('railway map is connected, never crosses and has fixed treasure, rest and boss stops', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { map } = createRun(seed * 31);
    const byId = new Map(map.map(n => [n.id, n]));
    const boss = map.filter(n => n.type === 'boss');
    assert.equal(boss.length, 1);
    assert.equal(boss[0].floor, BOSS_FLOOR);
    for (const node of map) {
      if (node.type !== 'boss') assert.ok(node.next.length > 0, `${node.id} has a way forward`);
      if (node.floor > 0) assert.ok(map.some(p => p.next.includes(node.id)), `${node.id} can be reached`);
      for (const id of node.next) assert.equal(byId.get(id).floor, node.floor + 1);
      if (node.floor === TREASURE_FLOOR) assert.equal(node.type, 'treasure');
      if (node.floor === REST_FLOOR) assert.equal(node.type, 'rest');
      if (node.floor === 0) assert.equal(node.type, 'battle');
      if (node.floor < 4) assert.ok(!['elite', 'rest'].includes(node.type));
    }
    for (let floor = 0; floor < BOSS_FLOOR - 1; floor++) {
      const edges = map.filter(n => n.floor === floor).flatMap(n => n.next.map(id => [n.x, byId.get(id).x]));
      for (const [a1, b1] of edges) for (const [a2, b2] of edges) assert.ok(!(a1 < a2 && b1 > b2), 'rails do not cross');
    }
  }
});

test('act is pure and rejects illegal commands by returning the same state', () => {
  const run = createRun(5);
  const before = JSON.stringify(run);
  const far = run.map.find(n => n.floor === 3);
  assert.equal(act(run, { t: 'travel', nodeId: far.id }), run);
  assert.equal(act(run, { t: 'endTurn' }), run);
  assert.equal(act(run, { t: 'leave' }), run);
  const next = act(run, { t: 'travel', nodeId: availableNodes(run.map, run.path)[0].id });
  assert.notEqual(next, run);
  assert.equal(JSON.stringify(run), before);
});

test('attack math applies strength, then weak, then vulnerable and rounds down', () => {
  assert.equal(attackDamage(6, {}, {}), 6);
  assert.equal(attackDamage(6, { strength: 2 }, { vulnerable: 1 }), 12);
  assert.equal(attackDamage(6, { weak: 1 }, {}), 4);
  assert.equal(attackDamage(6, { weak: 1 }, { vulnerable: 2 }), 6);
  assert.equal(attackDamage(0, { strength: -3 }), 0);
});

test('playing cards spends energy, uses block first and auto-targets a lone enemy', () => {
  let run = fight([{ defId: 'soot-rat', hp: 20, intent: 'bite' }], { hand: ['punch', 'coat', 'trunk-swing'] });
  run.combat.enemies[0].block = 4;
  run = act(run, { t: 'play', uid: 1000 });
  assert.equal(run.combat.enemies[0].block, 0);
  assert.equal(run.combat.enemies[0].hp, 18);
  assert.equal(run.combat.player.energy, 2);
  run = act(run, { t: 'play', uid: 1001 });
  assert.equal(run.combat.player.block, 5);
  const tooExpensive = act(run, { t: 'play', uid: 1002 });
  assert.equal(tooExpensive, run, 'trunk swing costs 2 with 1 energy left');
  assert.deepEqual(run.combat.discard.map(c => c.id), ['punch', 'coat']);
});

test('targeted cards need a living target when several enemies are present', () => {
  const run = fight([{ defId: 'moth', hp: 10, intent: 'flutter' }, { defId: 'moth', hp: 10, intent: 'flutter' }], { hand: ['punch', 'whistle'] });
  assert.equal(act(run, { t: 'play', uid: 1000 }), run);
  const hit = act(run, { t: 'play', uid: 1000, target: 1 });
  assert.equal(hit.combat.enemies[1].hp, 4);
  const aoe = act(run, { t: 'play', uid: 1001 });
  assert.deepEqual(aoe.combat.enemies.map(e => e.hp), [5, 5]);
  assert.equal(needsTarget({ id: 'whistle', up: false }), false);
});

test('exhaust and power cards leave the cycle; draw reshuffles the discard pile', () => {
  let run = fight([{ defId: 'rust-doll', hp: 40, intent: 'punch' }], { hand: ['coffee', 'iron-coat', 'timetable'] });
  run.combat.draw = [];
  run.combat.discard = [{ uid: 2000, id: 'punch', up: false }, { uid: 2001, id: 'coat', up: false }, { uid: 2002, id: 'spark', up: false }];
  run = act(run, { t: 'play', uid: 1000 });
  assert.equal(run.combat.player.energy, 4);
  assert.deepEqual(run.combat.exhausted.map(c => c.id), ['coffee']);
  run = act(run, { t: 'play', uid: 1001 });
  assert.equal(run.combat.player.statuses.plating, 3);
  assert.deepEqual(run.combat.exhausted.map(c => c.id), ['coffee', 'iron-coat']);
  const handBefore = run.combat.hand.length;
  run = act(run, { t: 'play', uid: 1002 });
  assert.equal(run.combat.hand.length, handBefore - 1 + 2);
  assert.ok(run.combat.discard.some(c => c.id === 'timetable'));
});

test('enemy turn: block protects, thorns strike back, plating builds and burn ignores block', () => {
  let run = fight([{ defId: 'inspector', hp: 40, intent: 'fine' }], { hand: [] });
  run.combat.player.block = 6;
  run.combat.player.statuses = { thorns: 2, plating: 3 };
  run.combat.enemies[0].statuses = { burn: 3 };
  const hp = run.hp;
  const cardsLeft = run.combat.draw.length + run.combat.discard.length;
  run = act(run, { t: 'endTurn' });
  // Plating adds 3 block before the enemy acts: 9 block absorbs 5 + 4 of the second 5-damage hit.
  assert.equal(run.hp, hp - 1);
  assert.equal(run.combat.enemies[0].hp, 40 - 3 - 2 - 2);
  assert.equal(run.combat.enemies[0].statuses.burn, 2);
  assert.equal(run.combat.player.block, 0, 'block resets at the start of the next turn');
  assert.equal(run.combat.turn, 2);
  assert.equal(run.combat.hand.length, Math.min(5, cardsLeft));
});

test('debuffs from enemies last for the number of enemy turns shown', () => {
  let run = fight([{ defId: 'ticketless', hp: 99, intent: 'spook' }], { hand: [] });
  run = act(run, { t: 'endTurn' });
  assert.equal(run.combat.player.statuses.vulnerable, 2);
  run = act(run, { t: 'endTurn' });
  assert.equal(run.combat.player.statuses.vulnerable, 1);
  run = act(run, { t: 'endTurn' });
  assert.equal(run.combat.player.statuses.vulnerable, undefined);
});

test('the boss enrages at half health and immediately telegraphs it', () => {
  let run = fight([{ defId: 'black-engine', hp: 80, maxHp: 150, intent: 'charge' }], { hand: ['trunk-swing'] });
  run = act(run, { t: 'play', uid: 1000 });
  assert.equal(run.combat.enemies[0].hp, 67);
  assert.equal(run.combat.enemies[0].enraged, true);
  assert.equal(run.combat.enemies[0].intent, 'rampage');
  run.combat.hand = [];
  run = act(run, { t: 'endTurn' });
  assert.equal(run.combat.enemies[0].statuses.strength, 3);
  assert.notEqual(run.combat.enemies[0].intent, 'rampage');
});

test('winning a fight offers gold, three distinct cards and a relic only for elites', () => {
  let run = fight([{ defId: 'soot-rat', hp: 5, intent: 'bite' }], { hand: ['punch'] });
  run = act(run, { t: 'play', uid: 1000 });
  assert.equal(run.phase, 'reward');
  assert.ok(run.combat.enemies.every(e => e.hp === 0), 'the final beat of the fight is kept for the screen');
  assert.ok(run.reward.gold >= 12 && run.reward.gold <= 20);
  assert.equal(new Set(run.reward.cards.map(c => c.id)).size, 3);
  assert.ok(run.reward.cards.every(c => CARDS[c.id].rarity !== 'starter'));
  assert.equal(run.reward.relic, null);
  const gold = run.gold;
  run = act(run, { t: 'takeGold' });
  assert.ok(run.gold > gold);
  const picked = run.reward.cards[1];
  run = act(run, { t: 'pickCard', index: 1 });
  assert.ok(run.deck.some(c => c.uid === picked.uid));
  assert.equal(act(run, { t: 'pickCard', index: 0 }), run, 'only one card per reward');
  run = act(run, { t: 'leave' });
  assert.equal(run.phase, 'map');
  assert.equal(run.combat, null);
  assert.equal(run.stats.battles, 1);
});

test('defeating the boss ends the run in victory and losing all health ends it in defeat', () => {
  let run = fight([{ defId: 'black-engine', hp: 6, maxHp: 150, intent: 'charge' }], { hand: ['punch'] });
  run.combat.kind = 'boss';
  assert.equal(act(run, { t: 'play', uid: 1000 }).phase, 'victory');
  let doomed = fight([{ defId: 'black-engine', hp: 150, intent: 'charge' }], { hand: [] });
  doomed.hp = 5;
  doomed = act(doomed, { t: 'endTurn' });
  assert.equal(doomed.phase, 'defeat');
  assert.equal(doomed.hp, 0);
});

test('rest, treasure, shop and events change the run as their labels promise', () => {
  const base = createRun(9);
  const rest = structuredClone(base);
  rest.phase = 'rest'; rest.rest = { done: false }; rest.hp = 20;
  const rested = act(rest, { t: 'rest' });
  assert.equal(rested.hp, 20 + restHeal(rest));
  assert.equal(act(rested, { t: 'upgrade', uid: rest.deck[0].uid }), rested, 'one choice per rest stop');
  const upgraded = act(rest, { t: 'upgrade', uid: rest.deck[0].uid });
  assert.equal(upgraded.deck[0].up, true);
  assert.match(describeCard(upgraded.deck[0]).join(' '), /피해 9/);

  const shop = structuredClone(base);
  shop.phase = 'shop'; shop.gold = 200;
  shop.shop = { cards: [{ card: { uid: 900, id: 'umbrella', up: false }, price: 50, sold: false }], relics: [{ id: 'gloves', price: 150, sold: false }], removePrice: 75, removed: false };
  let bought = act(shop, { t: 'buyCard', index: 0 });
  assert.equal(bought.gold, 150);
  assert.ok(bought.deck.some(c => c.uid === 900));
  assert.equal(act(bought, { t: 'buyCard', index: 0 }), bought);
  assert.equal(act(bought, { t: 'buyRelic', index: 0 }).relics.includes('gloves'), true);
  bought = act(bought, { t: 'removeCard', uid: bought.deck[0].uid });
  assert.equal(bought.gold, 75);
  assert.equal(bought.deck.length, 10);
  assert.equal(act(bought, { t: 'removeCard', uid: bought.deck[0].uid }), bought, 'one removal per shop');

  const event = structuredClone(base);
  event.phase = 'event'; event.event = { id: 'window', result: null };
  assert.equal(act(event, { t: 'leave' }), event, 'an event must be answered first');
  assert.equal(act(event, { t: 'eventChoice', index: 1 }), event, 'upgrade choice needs a card');
  const wished = act(event, { t: 'eventChoice', index: 1, uid: event.deck[3].uid });
  assert.equal(wished.deck[3].up, true);
  assert.ok(wished.event.result.length > 0);
  assert.equal(act(wished, { t: 'leave' }).phase, 'map');

  const vend = structuredClone(base);
  vend.phase = 'event'; vend.event = { id: 'vending', result: null }; vend.gold = 10;
  assert.equal(act(vend, { t: 'eventChoice', index: 0 }), vend, 'cannot pay without gold');

  const chest = structuredClone(base);
  chest.phase = 'treasure'; chest.treasure = { relic: 'cap', gold: 30, opened: false };
  const opened = act(chest, { t: 'openTreasure' });
  assert.equal(opened.maxHp, 80);
  assert.equal(opened.gold, base.gold + 30);
});

test('saves survive a round trip mid-combat and broken or finished saves are rejected', () => {
  const run = fight([{ defId: 'moth', hp: 9, intent: 'dust' }], { hand: ['punch'] });
  const loaded = loadRun(JSON.stringify(run));
  assert.ok(loaded);
  assert.deepEqual(act(loaded, { t: 'endTurn' }).combat.enemies, act(run, { t: 'endTurn' }).combat.enemies);
  assert.equal(loadRun(null), null);
  assert.equal(loadRun('{broken'), null);
  assert.equal(loadRun(JSON.stringify({ ...run, deck: [{ uid: 1, id: 'not-a-card', up: false }] })), null);
  assert.equal(loadRun(JSON.stringify({ ...run, hp: run.maxHp + 1 })), null);
  assert.equal(loadRun(JSON.stringify({ ...run, phase: 'defeat' })), null);
  assert.deepEqual(loadRecords('nope'), { runs: 0, wins: 0, bestFloor: 0, bestScore: 0 });
  assert.deepEqual(recordRun({ runs: 2, wins: 1, bestFloor: 9, bestScore: 150 }, { won: true, floor: 13, score: 400 }), { runs: 3, wins: 2, bestFloor: 13, bestScore: 400 });
});

test('every card, enemy move and event is well formed', () => {
  for (const card of Object.values(CARDS)) {
    assert.ok(card.name && card.flavor, card.id);
    assert.ok(Object.keys(card.up).length > 0, `${card.id} has an upgrade`);
    assert.ok(describeCard({ id: card.id, up: true }).length > 0);
    assert.ok(cardStats({ id: card.id, up: true }).cost <= card.cost);
  }
  for (const enemy of Object.values(ENEMIES)) {
    const self = { uid: 0, defId: enemy.id, hp: 10, maxHp: 10, block: 0, statuses: {}, intent: '', history: [] };
    for (let turn = 0; turn < 12; turn++) {
      const move = enemy.next(self, (turn * 0.37) % 1);
      assert.ok(enemy.moves[move], `${enemy.id} -> ${move}`);
      self.history.push(move);
    }
  }
  for (const event of Object.values(EVENTS)) assert.ok(event.choices.length >= 2, event.id);
});

test('a simple autopilot can finish runs without breaking invariants', () => {
  let finished = 0;
  for (let seed = 1; seed <= 25; seed++) {
    let run = createRun(seed * 977, seed % 2 ? 'normal' : 'easy');
    for (let step = 0; step < 4000 && !['victory', 'defeat'].includes(run.phase); step++) {
      assert.ok(run.hp <= run.maxHp && run.hp >= 0);
      if (run.combat) assert.ok(run.combat.hand.length <= 10);
      assert.equal(new Set(run.deck.map(c => c.uid)).size, run.deck.length);
      switch (run.phase) {
        case 'map': run = act(run, { t: 'travel', nodeId: availableNodes(run.map, run.path)[0].id }); break;
        case 'combat': {
          const card = run.combat.hand.find(c => cardStats(c).cost <= run.combat.player.energy);
          const next = card ? act(run, { t: 'play', uid: card.uid, target: aliveEnemies(run.combat)[0]?.uid }) : run;
          run = next === run ? act(run, { t: 'endTurn' }) : next;
          break;
        }
        case 'reward':
          if (run.reward.gold != null) run = act(run, { t: 'takeGold' });
          if (run.reward.relic) run = act(run, { t: 'takeRelic' });
          if (run.reward.cards) run = act(run, { t: 'pickCard', index: 0 });
          run = act(run, { t: 'leave' });
          break;
        case 'rest': run = act(act(run, { t: 'rest' }), { t: 'leave' }); break;
        case 'shop': run = act(run, { t: 'leave' }); break;
        case 'treasure': run = act(act(run, { t: 'openTreasure' }), { t: 'leave' }); break;
        case 'event': {
          const choices = EVENTS[run.event.id].choices;
          const index = choices.findIndex(c => !c.pick && (!c.available || c.available(run)));
          run = act(act(run, { t: 'eventChoice', index }), { t: 'leave' });
          break;
        }
      }
    }
    assert.ok(['victory', 'defeat'].includes(run.phase), `seed ${seed} finished`);
    assert.ok(runScore(run) >= 0);
    finished++;
  }
  assert.equal(finished, 25);
});

test('snacks cost no energy, respect targets and the three-slot bag', () => {
  let run = fight([{ defId: 'moth', hp: 20, intent: 'flutter' }, { defId: 'moth', hp: 20, intent: 'flutter' }], { hand: [] });
  assert.deepEqual(run.snacks, ['star-candy'], 'every run starts with one snack');
  run.snacks = ['star-candy', 'lemon-drop', 'emergency-whistle'];
  const energy = run.combat.player.energy;
  run = act(run, { t: 'useSnack', index: 0 });
  assert.equal(run.combat.player.block, 10);
  assert.equal(run.combat.player.energy, energy);
  assert.deepEqual(run.snacks, ['lemon-drop', 'emergency-whistle']);
  assert.equal(act(run, { t: 'useSnack', index: 0 }), run, 'a targeted snack needs a target when several enemies stand');
  run = act(run, { t: 'useSnack', index: 0, target: 1 });
  assert.equal(run.combat.enemies[1].statuses.vulnerable, 3);
  run.combat.player.statuses.strength = 5;
  run = act(run, { t: 'useSnack', index: 0 });
  assert.deepEqual(run.combat.enemies.map(e => e.hp), [10, 10], 'whistle damage ignores strength and vulnerable');
  assert.equal(act(run, { t: 'useSnack', index: 0 }), run, 'empty bag');

  const outside = createRun(4);
  outside.snacks = ['cocoa', 'gimbap'];
  outside.hp = 40;
  assert.equal(act(outside, { t: 'useSnack', index: 1 }), outside, 'combat snacks stay in the bag on the map');
  assert.equal(act(outside, { t: 'useSnack', index: 0 }).hp, 52);
  const full = structuredClone(outside);
  full.snacks = ['cocoa', 'mint', 'mint'];
  full.phase = 'reward'; full.reward = { gold: null, cards: null, relic: null, snack: 'gimbap' };
  assert.equal(act(full, { t: 'takeSnack' }), full, 'a full bag cannot take more');
  assert.deepEqual(act(act(full, { t: 'dropSnack', index: 1 }), { t: 'takeSnack' }).snacks, ['cocoa', 'mint', 'gimbap']);
});

test('the enemy turn is recorded beat by beat for the screen to replay', () => {
  let run = fight([{ defId: 'soot-rat', hp: 30, intent: 'bite' }, { defId: 'ticketless', hp: 30, intent: 'spook' }], { hand: [] });
  run.combat.player.statuses = { plating: 2 };
  run = act(run, { t: 'endTurn' });
  const actors = run.combat.frames.map(f => f.actor);
  assert.deepEqual(actors.slice(0, 3), ['player', 0, 1]);
  assert.equal(run.combat.frames[1].label, '앞니 물기');
  assert.ok(run.combat.frames[1].fx.some(f => f.target === 'player'));
  assert.equal(run.combat.frames[2].playerStatuses.vulnerable, 2);
  const after = act(run, { t: 'play', uid: run.combat.hand[0].uid, target: 0 });
  if (after !== run) assert.deepEqual(after.combat.frames, [], 'playing a card clears the replay');
  assert.equal(loadRun(JSON.stringify(run)).combat.frames.length, 0, 'replays are not saved');
});

test('later stations can offer pre-upgraded cards and rewards may include a snack', () => {
  let upgraded = 0, snacks = 0;
  for (let seed = 1; seed <= 80; seed++) {
    let run = fight([{ defId: 'soot-rat', hp: 1, intent: 'bite' }], { seed, hand: ['punch'] });
    run.path = run.map.filter(n => n.floor <= 8).sort((a, b) => a.floor - b.floor).filter((n, i, list) => list.findIndex(m => m.floor === n.floor) === i).map(n => n.id);
    run = act(run, { t: 'play', uid: 1000 });
    upgraded += run.reward.cards.filter(c => c.up).length;
    if (run.reward.snack) snacks++;
  }
  assert.ok(upgraded > 0);
  assert.ok(snacks > 8 && snacks < 40, `snack drops ${snacks}/80`);
});
