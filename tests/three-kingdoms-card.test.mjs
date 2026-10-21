import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { build } from 'esbuild';
import postcss from 'postcss';

const compiled = await build({ stdin: { contents: `
  export * from './src/games/three-kingdoms-card/lib/heroCatalog';
  export * from './src/games/three-kingdoms-card/lib/demoGame';
  export * from './src/games/three-kingdoms-card/lib/heroPortrait';
  export * from './src/games/three-kingdoms-card/lib/heroSkills';
  export * from './src/games/three-kingdoms-card/lib/skills';
  export * from './src/games/three-kingdoms-card/lib/battleEngine';
  export * from './src/games/three-kingdoms-card/lib/synergy';
  export * from './src/games/three-kingdoms-card/lib/tactics';
  export * from './src/games/three-kingdoms-card/lib/campaign';
  export * from './src/games/three-kingdoms-card/lib/practice';
  export * from './src/games/three-kingdoms-card/lib/challenges';
export * from './src/games/three-kingdoms-card/lib/equipment';
`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const mod = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const { HERO_CATALOG, createDemo, createCollectedHero, demoSchema, portraitStyle, actDemo, HERO_SKILLS, heroSkills, skillTier, simulateBattle } =
  mod;

test('equipment crafting, upgrade and salvage pay exact costs without recycling profit', () => {
  let state = started(); state.castle.gold = 100000;
  const run = (action, id = 'gear') => { state = actDemo(state, action, 0, () => 0, id).state; };
  run({ type: 'craftEquipment', key: 'sageFan' });
  assert.equal(state.forge.materials, 15);
  assert.equal(state.forge.items[0].level, 1);
  run({ type: 'upgradeEquipment', itemId: 'gear:equipment' });
  assert.equal(state.forge.materials, 10);
  assert.equal(state.forge.items[0].level, 2);
  const before = JSON.stringify(state);
  state.forge.materials = 0;
  assert.throws(() => actDemo(state, { type: 'upgradeEquipment', itemId: 'gear:equipment' }, 0, () => 0, 'bad'));
  assert.equal(state.forge.items[0].level, 2);
  state = JSON.parse(before);
  run({ type: 'salvageEquipment', itemId: 'gear:equipment' });
  assert.equal(state.forge.materials, 20);
  assert.equal(state.forge.items.length, 0);
});

test('gear slots replace safely, sets affect combat and removing command gear refunds troops', () => {
  let state = started(); const h = createCollectedHero('zhaoyun', 3, 'equipped');
  state.heroes = [h]; state.troops[0].heroIds = [h.id, null, null];
  state.forge.items = ['guardianSpear', 'guardianArmor', 'guardianSeal'].map((key, i) => ({ id: `g${i}`, key, level: 2, heroId: h.id }));
  assert.equal(mod.effectiveHero(state.forge.items, h).leadership, h.leadership + 10);
  assert.ok(mod.equipmentEffects(state.forge.items, h.id).some(e => e.kind === 'recover' && e.value === 0.01));
  assert.ok(mod.playerTroop(state).commander.skills.some(e => e.kind === 'recover'));
  state.troops[0].currentTroops = mod.troopCapacity(state);
  const reserves = state.castle.reserves;
  state = actDemo(state, { type: 'equip', itemId: 'g0', heroId: null }, 0, () => 0, 'unequip').state;
  assert.equal(state.castle.reserves, reserves + 60);
  assert.equal(state.troops[0].currentTroops, mod.troopCapacity(state));
  assert.throws(() => actDemo(state, { type: 'salvageEquipment', itemId: 'g1' }, 0, () => 0, 'bad'));
  state.forge.items.push({ id: 'replacement', key: 'sageRobe', level: 1, heroId: null });
  state = actDemo(state, { type: 'equip', itemId: 'replacement', heroId: h.id }, 0, () => 0, 'replace').state;
  assert.equal(state.forge.items.find(i => i.id === 'g1').heroId, null);
  assert.ok(demoSchema.safeParse(state).success);
});

test('locked and favorite officers are protected and dismissed gear returns to inventory', () => {
  let state = started(); state.heroes = [createCollectedHero('zhaoyun', 1, 'protected')];
  state.heroes[0].locked = true;
  assert.throws(() => actDemo(state, { type: 'dismiss', heroId: 'protected' }, 0, () => 0, 'bad'));
  state.heroes[0].locked = false; state.heroes[0].favorite = true;
  assert.throws(() => actDemo(state, { type: 'dismissMany', heroIds: ['protected'] }, 0, () => 0, 'bad'));
  state.forge.items = [{ id: 'return', key: 'sageFan', level: 1, heroId: 'protected' }];
  state = actDemo(state, { type: 'dismiss', heroId: 'protected' }, 0, () => 0, 'dismiss').state;
  assert.equal(state.forge.items[0].heroId, null);
  assert.ok(demoSchema.safeParse(state).success);
});

test('legacy saves receive independent forge and officer protection defaults', () => {
  const old = started(); old.heroes = [createCollectedHero('zhaoyun', 1, 'legacy')];
  delete old.forge; delete old.heroes[0].locked; delete old.heroes[0].favorite;
  const loaded = demoSchema.parse(old);
  assert.equal(loaded.forge.materials, 30);
  assert.equal(loaded.heroes[0].locked, false);
  loaded.forge.items.push({ id: 'extra', key: 'sageFan', level: 1, heroId: null });
  assert.equal(demoSchema.parse(old).forge.items.length, 0);
});

test('promotion protects favorite material and preserves its equipment on consumption', () => {
  let state = started(); state.castle.gold = 10000;
  state.heroes = [createCollectedHero('zhaoyun', 1, 'main'), createCollectedHero('zhaoyun', 1, 'material')];
  state.heroes[1].favorite = true;
  const action = { type: 'promote', heroId: 'main', materialId: 'material' };
  assert.throws(() => actDemo(state, action, 0, () => 0, 'protected'));
  state.heroes[1].favorite = false;
  state.forge.items = [{ id: 'g', key: 'sageFan', level: 4, heroId: 'material' }];
  state = actDemo(state, action, 0, () => 0, 'promote').state;
  assert.equal(state.heroes[0].stars, 2);
  assert.equal(state.forge.items[0].heroId, null);
  assert.equal(state.forge.items[0].level, 4);
  assert.ok(demoSchema.safeParse(state).success);
});

test('tower iron is awarded once while daily victory and sweep remain renewable', () => {
  let state = trainingReady();
  state = actDemo(state, { type: 'challenge', mode: 'tower', level: 1 }, 0, () => 0, 'first').state;
  assert.equal(state.forge.materials, 33);
  state = actDemo(state, { type: 'challenge', mode: 'tower', level: 1 }, 0, () => 0, 'repeat').state;
  assert.equal(state.forge.materials, 33);
  state = actDemo(state, { type: 'challenge', mode: 'daily', level: 1 }, 0, () => 0, 'daily').state;
  assert.equal(state.forge.materials, 37);
  assert.equal(state.warRoom.lastReport.materialReward, 4);
  state.stage = 2;
  state = actDemo(state, { type: 'sweep' }, 0, () => 0, 'sweep').state;
  assert.equal(state.forge.materials, 40);
  assert.equal(demoSchema.parse(JSON.parse(JSON.stringify(state))).forge.materials, 40);
});

test('card layout retains body class rules inside the shadow root', () => {
  const css = postcss.parse(readFileSync('src/games/three-kingdoms-card/three-kingdoms-card.css', 'utf8'));
  const rules = [];
  css.walkRules(rule => { rules.push(rule); assert.ok(!rule.selector.includes('-.tkw-root')); });
  for (const selector of ['.game-body', '.hero-detail-body', '.building-body', '.target-body']) {
    assert.ok(rules.some(rule => rule.selector === selector), selector);
  }
  assert.ok(rules.find(rule => rule.selector === '.game-body').nodes.some(n => n.prop === 'flex' && n.value === '1'));
  assert.ok(rules.find(rule => rule.selector === '.hero-detail-body').nodes.some(n => n.prop === 'padding'));
});

test('all 88 heroes have distinct keys, valid portraits and serializable cards at every grade', () => {
  assert.equal(HERO_CATALOG.length, 88);
  assert.equal(new Set(HERO_CATALOG.map(h => h.key)).size, 88);
  assert.equal(new Set(HERO_CATALOG.map(h => h.name)).size, 88);
  const portraits = new Set();
  for (const hero of HERO_CATALOG) {
    const style = portraitStyle(hero.key);
    portraits.add(JSON.stringify(style));
    assert.ok(!JSON.stringify(style).match(/NaN|undefined/));
    const asset = style.backgroundImage.match(/url\('([^']+)'\)/)[1];
    assert.ok(existsSync(`public${asset}`));
    for (let stars = 1; stars <= 5; stars++) {
      const state = createDemo(0);
      state.heroes = [createCollectedHero(hero.key, stars, `${hero.key}-${stars}`)];
      assert.ok(demoSchema.safeParse(JSON.parse(JSON.stringify(state))).success, `${hero.key}/${stars}`);
    }
  }
  assert.equal(portraits.size, 88);
});

test('replacement and new officers use complete raster atlases with unique in-bounds crops', () => {
  for (const [atlas, rows, expected] of [['expansion3', 4, 16], ['expansion4', 2, 8]]) {
    const heroes = HERO_CATALOG.filter(h => h.atlas === atlas);
    assert.equal(heroes.length, expected);
    assert.deepEqual(heroes.map(h => h.tile), Array.from({ length: expected }, (_, i) => i));
    const asset = portraitStyle(heroes[0].key).backgroundImage.match(/url\('([^']+)'\)/)[1];
    const bytes = readFileSync(`public${asset}`);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    assert.ok(Math.abs(width / 4 - height / rows) < 1, `${atlas}: square portrait cells`);
    assert.ok(width / 4 >= 256, `${atlas}: usable portrait resolution`);
  }
});

test('each new officer can be recruited and restored in an existing formation', () => {
  for (let index = 48; index < HERO_CATALOG.length; index++) {
    const state = createDemo(0);
    state.lordName = '군주';
    state.castleName = '영지';
    state.heroes = [createCollectedHero('guanyu', 3, 'existing-officer')];
    state.troops[0].heroIds = ['existing-officer', null, null];
    const rolls = [0.99, (index + 0.5) / HERO_CATALOG.length];
    const recruited = actDemo(state, { type: 'draw' }, 0, () => rolls.shift(), `new-${index}`).state;
    assert.equal(recruited.heroes[1].templateKey, HERO_CATALOG[index].key);
    assert.equal(recruited.heroes[1].stars, 5);
    recruited.troops[0].heroIds[1] = recruited.heroes[1].id;
    assert.deepEqual(demoSchema.parse(JSON.parse(JSON.stringify(recruited))), recruited);
    assert.deepEqual(recruited.heroes[0], state.heroes[0]);
  }
});

test('pre-expansion v2 saves retain owned officers and formation', () => {
  const state = createDemo(0);
  state.lordName = '기존군주';
  state.heroes = [createCollectedHero('guanyu', 3, 'existing-officer')];
  state.troops[0].heroIds = ['existing-officer', null, null];
  state.troops[0].currentTroops = 300;
  assert.deepEqual(demoSchema.parse(JSON.parse(JSON.stringify(state))), state);
});

test('special abilities are limited by grade: none at 1-2 stars, + at 3, ++ at 4, +++ at 5', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(skillTier), [0, 0, 1, 2, 3]);
  for (const hero of HERO_CATALOG) {
    const [name, unique, common] = HERO_SKILLS[hero.key];
    assert.ok(name && unique !== common, hero.key);
    assert.equal(heroSkills(hero.key, 1).length, 0);
    assert.equal(heroSkills(hero.key, 2).length, 0);
    assert.deepEqual([3, 4, 5].map(stars => heroSkills(hero.key, stars).map(s => s.label).join()), ['+,+', '++,++', '+++,+++']);
    const [a, b, c] = [3, 4, 5].map(stars => heroSkills(hero.key, stars)[0].effect.value);
    assert.ok(a < b && b < c, hero.key);
  }
  assert.equal(Object.keys(HERO_SKILLS).length, HERO_CATALOG.length);
});

test('stat points: level-ups grant points, allocation is capped and reset refunds', () => {
  let state = createDemo(0);
  state = actDemo(state, { type: 'start', lordName: 'a', castleName: 'b' }, 0, () => 0, 'x').state;
  const h = createCollectedHero('guanyu', 5, 'h1'); h.statPoints = 7; state.heroes = [h];
  const before = h.strength;
  state = actDemo(state, { type: 'allocate', heroId: 'h1', stat: 'strength', amount: 5 }, 0, () => 0, 'x').state;
  assert.equal(state.heroes[0].strength, before + 5); assert.equal(state.heroes[0].statPoints, 2);
  assert.throws(() => actDemo(state, { type: 'allocate', heroId: 'h1', stat: 'charm', amount: 3 }, 0, () => 0, 'x'));
  assert.throws(() => actDemo(state, { type: 'allocate', heroId: 'h1', stat: 'charm', amount: 0 }, 0, () => 0, 'x'));
  state.castle.gold = 1000;
  state = actDemo(state, { type: 'resetStats', heroId: 'h1' }, 0, () => 0, 'x').state;
  assert.equal(state.heroes[0].strength, before); assert.equal(state.heroes[0].statPoints, 7);
  assert.ok(demoSchema.safeParse(JSON.parse(JSON.stringify(state))).success);
  state.heroes[0].statPoints = 500; state.heroes[0].strength = 199;
  assert.throws(() => actDemo(state, { type: 'allocate', heroId: 'h1', stat: 'strength', amount: 2 }, 0, () => 0, 'x'));
});

test('saves without statPoints/spent load with defaults', () => {
  const state = createDemo(0); state.heroes = [createCollectedHero('zhaoyun', 3, 'h1')];
  const raw = JSON.parse(JSON.stringify(state)); delete raw.heroes[0].statPoints; delete raw.heroes[0].spent;
  const parsed = demoSchema.safeParse(raw);
  assert.ok(parsed.success); assert.equal(parsed.data.heroes[0].statPoints, 0); assert.deepEqual(parsed.data.heroes[0].spent, [0, 0, 0, 0, 0]);
});

test('attack skill raises damage in battle', () => {
  const troop = (id, skills) => ({ id, name: id, currentTroops: 1000, commander: { name: id, leadership: 50, strength: 60, intelligence: 0, skills }, deputies: [] });
  const plain = simulateBattle(troop('a', []), troop('d', []), () => 0.99);
  const boosted = simulateBattle(troop('a', [{ kind: 'attack', value: 0.15 }]), troop('d', []), () => 0.99);
  assert.ok(boosted.defenderRemaining < plain.defenderRemaining);
  const guarded = simulateBattle(troop('a', []), troop('d', [{ kind: 'guard', value: 0.12 }]), () => 0.99);
  assert.ok(guarded.defenderRemaining > plain.defenderRemaining);
});

test('new skills: ambush, counter and fire change battle results', () => {
  const troop = (id, skills, int = 0) => ({ id, name: id, currentTroops: 1000, commander: { name: id, leadership: 50, strength: 60, intelligence: int, skills }, deputies: [] });
  const plain = simulateBattle(troop('a', []), troop('d', []), () => 0.99);
  const ambush = simulateBattle(troop('a', [{ kind: 'ambush', value: 0.5 }]), troop('d', []), () => 0.99);
  assert.ok(ambush.defenderRemaining < plain.defenderRemaining);
  const counter = simulateBattle(troop('a', []), troop('d', [{ kind: 'counter', value: 0.12 }]), () => 0.99);
  assert.ok(counter.defenderRemaining > plain.defenderRemaining);
  assert.ok(counter.logs.some(l => l.includes('반격')));
  const lowRoll = () => 0;
  const fire = simulateBattle(troop('a', [{ kind: 'fire', value: 0.5 }], 100), troop('d', []), lowRoll);
  const noFire = simulateBattle(troop('a', [], 100), troop('d', []), lowRoll);
  assert.ok(fire.defenderRemaining <= noFire.defenderRemaining);
});

const started = () => { const s = createDemo(0); s.lordName = 'a'; s.castleName = 'b'; return s; };

test('buildings go to level 30 with tiered costs and one-time milestone tickets', () => {
  const { upgradeCost, MAX_BUILDING_LEVEL } = mod;
  assert.equal(MAX_BUILDING_LEVEL, 30);
  assert.deepEqual(upgradeCost(9), { gold: 1800, food: 900 });
  assert.deepEqual(upgradeCost(10), { gold: 4000, food: 2000 });
  assert.deepEqual(upgradeCost(20), { gold: 16000, food: 8000 });
  let state = started(); state.castle.gold = 1e9; state.castle.food = 1e9; state.buildings[0].level = 9; state.recruitmentTickets = 0;
  state = actDemo(state, { type: 'upgrade', building: 'ADMINISTRATION' }, 0, () => 0, 'x').state;
  assert.equal(state.recruitmentTickets, 2);
  state = actDemo(state, { type: 'upgrade', building: 'ADMINISTRATION' }, 0, () => 0, 'x').state;
  assert.equal(state.recruitmentTickets, 2);
  state.buildings[0].level = 30;
  assert.ok(demoSchema.safeParse(JSON.parse(JSON.stringify(state))).success);
  assert.throws(() => actDemo(state, { type: 'upgrade', building: 'ADMINISTRATION' }, 0, () => 0, 'x'));
});

test('clearing all targets opens the next stage with skilled, stronger enemies', () => {
  const { generateTarget } = mod;
  let state = started();
  state.heroes = [createCollectedHero('lubu', 5, 'h1')]; state.troops[0].heroIds = ['h1', null, null];
  state.heroes[0].maxTroops = 100000; state.troops[0].currentTroops = 50000;
  const tickets = state.recruitmentTickets;
  for (const t of createDemo(0).targets) state = actDemo(state, { type: 'battle', targetId: t.id }, 0, () => 0.5, t.id).state;
  assert.equal(state.stage, 2);
  assert.equal(state.recruitmentTickets, tickets + 3 + 2);
  assert.ok(state.targets.every(t => t.currentTroops > 0 && t.id.startsWith('stage-2')));
  assert.ok(generateTarget(5, 0).currentTroops > generateTarget(2, 0).currentTroops);
  assert.ok(heroSkills(generateTarget(4, 0).commander.templateKey, generateTarget(4, 0).commander.stars).length > 0);
  assert.ok(demoSchema.safeParse(JSON.parse(JSON.stringify(state))).success);
  // 기존 세이브: stage 없음 + 대상 전부 토벌 → 로드 후 동기화하면 다음 단계
  const raw = JSON.parse(JSON.stringify(started())); delete raw.stage; raw.targets.forEach(t => { t.currentTroops = 0; });
  const parsed = demoSchema.parse(raw);
  assert.equal(parsed.stage, 1);
  assert.equal(mod.syncDemo(parsed, 0).stage, 2);
});

test('promote consumes a same-grade duplicate and keeps allocated stats; dismiss refunds gold', () => {
  const { baseStats } = mod;
  let state = started(); state.castle.gold = 10000;
  const a = createCollectedHero('guanyu', 3, 'a'); a.strength += 4; a.spent[1] = 4; a.statPoints = 2; a.level = 7;
  state.heroes = [a, createCollectedHero('guanyu', 3, 'b'), createCollectedHero('guanyu', 2, 'c'), createCollectedHero('zhaoyun', 3, 'd')];
  state.troops[0].heroIds = ['d', null, null];
  assert.throws(() => actDemo(state, { type: 'promote', heroId: 'a', materialId: 'c' }, 0, () => 0, 'x'));
  assert.throws(() => actDemo(state, { type: 'promote', heroId: 'a', materialId: 'd' }, 0, () => 0, 'x'));
  state = actDemo(state, { type: 'promote', heroId: 'a', materialId: 'b' }, 0, () => 0, 'x').state;
  const p = state.heroes.find(h => h.id === 'a');
  assert.equal(p.stars, 4); assert.equal(p.level, 7); assert.equal(p.statPoints, 2);
  assert.equal(p.strength, baseStats('guanyu', 4).strength + 4);
  assert.equal(state.heroes.length, 3); assert.equal(state.castle.gold, 10000 - 1500);
  assert.throws(() => actDemo(state, { type: 'dismiss', heroId: 'd' }, 0, () => 0, 'x'));
  state = actDemo(state, { type: 'dismiss', heroId: 'c' }, 0, () => 0, 'x').state;
  assert.equal(state.castle.gold, 10000 - 1500 + 60); assert.equal(state.heroes.length, 2);
});

test('single-troop saves migrate to three troops with ticket clock and daily quests', () => {
  const state = started();
  state.heroes = [createCollectedHero('guanyu', 3, 'old')];
  const raw = JSON.parse(JSON.stringify(state));
  raw.troop = { ...raw.troops[0], heroIds: ['old', null, null], currentTroops: 300 };
  delete raw.troops; delete raw.activeTroop; delete raw.ticketClock; delete raw.daily;
  raw.targets.forEach(t => delete t.deputies);
  const parsed = demoSchema.parse(raw);
  assert.equal(parsed.troops.length, 3);
  assert.deepEqual(parsed.troops[0].heroIds, ['old', null, null]);
  assert.equal(parsed.troops[0].currentTroops, 300);
  assert.equal(parsed.activeTroop, 0);
  assert.equal(parsed.ticketClock, raw.castle.lastUpdatedAt);
  assert.ok(parsed.targets.every(t => Array.isArray(t.deputies)));
});

test('second and third troops unlock with the administration level; heroes serve in one troop only', () => {
  const { troopSlots } = mod;
  let state = started();
  state.heroes = [createCollectedHero('guanyu', 3, 'a'), createCollectedHero('zhaoyun', 3, 'b')];
  state = actDemo(state, { type: 'assign', slot: 0, heroId: 'a' }, 0, () => 0, 'x').state;
  assert.equal(troopSlots(state), 1);
  assert.throws(() => actDemo(state, { type: 'selectTroop', index: 1 }, 0, () => 0, 'x'));
  state.buildings[0].level = 10;
  state = actDemo(state, { type: 'selectTroop', index: 1 }, 0, () => 0, 'x').state;
  assert.equal(state.activeTroop, 1);
  assert.throws(() => actDemo(state, { type: 'assign', slot: 0, heroId: 'a' }, 0, () => 0, 'x'));
  state = actDemo(state, { type: 'assign', slot: 0, heroId: 'b' }, 0, () => 0, 'x').state;
  state = actDemo(state, { type: 'reinforce', count: 100 }, 0, () => 0, 'x').state;
  assert.equal(state.troops[1].currentTroops, 100); assert.equal(state.troops[0].currentTroops, 0);
  assert.throws(() => actDemo(state, { type: 'selectTroop', index: 2 }, 0, () => 0, 'x'));
  assert.ok(demoSchema.safeParse(JSON.parse(JSON.stringify(state))).success);
});

test('tickets recharge every 30 minutes up to 10', () => {
  const { syncDemo, TICKET_INTERVAL, nextTicketIn } = mod;
  const state = started(); state.recruitmentTickets = 0;
  assert.equal(syncDemo(state, TICKET_INTERVAL - 1).recruitmentTickets, 0);
  const later = syncDemo(state, TICKET_INTERVAL * 2 + 5);
  assert.equal(later.recruitmentTickets, 2);
  assert.equal(nextTicketIn(later, TICKET_INTERVAL * 2 + 5), TICKET_INTERVAL - 5);
  const full = syncDemo(state, TICKET_INTERVAL * 50);
  assert.equal(full.recruitmentTickets, 10); assert.equal(nextTicketIn(full, TICKET_INTERVAL * 50), null);
});

test('daily quests track progress, pay once and reset on a new day', () => {
  const { syncDemo, dayKey } = mod;
  let state = started(); state.castle.gold = 1e6; state.castle.food = 1e6;
  state.daily = { date: dayKey(0), progress: [0, 0, 0], claimed: [false, false, false] };
  state = actDemo(state, { type: 'upgrade', building: 'FARM' }, 0, () => 0, 'x').state;
  assert.throws(() => actDemo(state, { type: 'claimDaily', index: 2 }, 0, () => 0, 'x'));
  state = actDemo(state, { type: 'upgrade', building: 'FARM' }, 0, () => 0, 'x').state;
  const food = state.castle.food;
  state = actDemo(state, { type: 'claimDaily', index: 2 }, 0, () => 0, 'x').state;
  assert.equal(state.castle.food, food + 1000);
  assert.throws(() => actDemo(state, { type: 'claimDaily', index: 2 }, 0, () => 0, 'x'));
  const tomorrow = syncDemo(state, 86_400_000 * 2);
  assert.deepEqual(tomorrow.daily.progress, [0, 0, 0]); assert.deepEqual(tomorrow.daily.claimed, [false, false, false]);
});

test('enemy deputies appear from stage 3 and fight alongside the commander', () => {
  const { generateTarget } = mod;
  assert.equal(generateTarget(2, 0).deputies.length, 0);
  assert.ok(generateTarget(3, 1).deputies.length >= 1);
  assert.ok(generateTarget(6, 2).deputies.length >= 1);
  for (let stage = 3; stage < 20; stage++) for (let slot = 0; slot < 3; slot++) {
    const t = generateTarget(stage, slot);
    assert.ok(t.deputies.every(d => d.templateKey !== t.commander.templateKey && d.stars <= t.commander.stars));
  }
});

test('faction synergy: 2 same-faction officers give +, 3 give ++, and it strengthens the troop', () => {
  const { troopSynergy, playerTroop, aggregateSkills } = mod;
  assert.equal(troopSynergy(['guanyu', 'caocao']), null);
  assert.equal(troopSynergy(['guanyu', 'zhaoyun']).label, '+');
  const full = troopSynergy(['guanyu', 'zhaoyun', 'zhangfei']);
  assert.equal(full.label, '++'); assert.equal(full.faction, '촉'); assert.equal(full.effect.kind, 'attack');
  assert.equal(troopSynergy(['npc', 'npc']), null);
  const state = started();
  state.heroes = ['guanyu', 'zhaoyun', 'zhangfei'].map(k => createCollectedHero(k, 1, k));
  state.troops[0].heroIds = ['guanyu', 'zhaoyun', 'zhangfei']; state.troops[0].unit = 'cavalry';
  assert.equal(aggregateSkills(playerTroop(state)).attack, full.effect.value);
});

test('recruitment pity guarantees a 5-star by the 80th draw and 3-star+ in every 5-pull', () => {
  const { PITY_LIMIT } = mod;
  let state = started(); state.castle.gold = 1e9; state.recruitmentTickets = 0;
  for (let i = 0; i < PITY_LIMIT - 1; i++) state = actDemo(state, { type: 'draw' }, 0, () => 0, `d${i}`).state;
  assert.ok(state.heroes.every(h => h.stars === 1)); assert.equal(state.pity, PITY_LIMIT - 1);
  state = actDemo(state, { type: 'draw' }, 0, () => 0, 'last').state;
  assert.equal(state.heroes.at(-1).stars, 5); assert.equal(state.pity, 0);
  state.heroes = [];
  state = actDemo(state, { type: 'draw', amount: 5 }, 0, () => 0, 'five').state;
  assert.deepEqual(state.heroes.map(h => h.stars), [1, 1, 1, 1, 3]);
  const raw = JSON.parse(JSON.stringify(started())); delete raw.pity;
  assert.equal(demoSchema.parse(raw).pity, 0);
});

test('unit matchups: spear > cavalry > archer > spear, applied in battle', () => {
  const { unitMultiplier } = mod;
  assert.equal(unitMultiplier('spear', 'cavalry'), 1.25);
  assert.equal(unitMultiplier('cavalry', 'spear'), 0.8);
  assert.equal(unitMultiplier('archer', 'archer'), 1);
  const troop = (id, unit) => ({ id, name: id, currentTroops: 1000, unit, commander: { name: id, leadership: 50, strength: 60, intelligence: 0, skills: [] }, deputies: [] });
  const even = simulateBattle(troop('a', 'spear'), troop('d', 'spear'), () => 0.99);
  const good = simulateBattle(troop('a', 'spear'), troop('d', 'cavalry'), () => 0.99);
  assert.ok(good.defenderRemaining < even.defenderRemaining);
});

test('formation and aptitude effects are added to the commander', () => {
  const { playerTroop, aggregateSkills } = mod;
  const state = started();
  state.heroes = [createCollectedHero('machao', 1, 'm')]; state.troops[0].heroIds = ['m', null, null];
  state.troops[0].unit = 'cavalry';
  assert.equal(aggregateSkills(playerTroop(state)).attack, 0.1);
  state.troops[0].unit = 'spear'; state.troops[0].formation = 'circle';
  const s = aggregateSkills(playerTroop(state));
  assert.equal(s.guard, 0.15); assert.ok(Math.abs(s.attack + 0.1) < 1e-9);
  const next = actDemo(state, { type: 'setFormation', formation: 'wedge' }, 0, () => 0, 'x').state;
  assert.equal(next.troops[0].formation, 'wedge');
  assert.ok(demoSchema.safeParse(JSON.parse(JSON.stringify(next))).success);
});

test('battleAll sends every ready troop in order until the target falls', () => {
  let state = started();
  state.buildings[0].level = 20;
  state.heroes = ['a', 'b', 'c'].map(id => createCollectedHero('guanyu', 1, id));
  state.troops.forEach((t, i) => { t.heroIds = [['a', 'b', 'c'][i], null, null]; t.currentTroops = 10; });
  state.heroes.forEach(h => { h.maxTroops = 1e5; });
  const target = state.targets[2];
  state = actDemo(state, { type: 'battleAll', targetId: target.id }, 0, () => 0.5, 'all').state;
  assert.equal(state.battles.length, 3);
  assert.ok(state.battles.every(b => b.id.startsWith('all:')));
});

test('sweep is limited per day and requires stage 2', () => {
  let state = started();
  state.heroes = [createCollectedHero('guanyu', 1, 'g')]; state.troops[0].heroIds = ['g', null, null];
  assert.throws(() => actDemo(state, { type: 'sweep' }, 0, () => 0, 'x'));
  state.stage = 3;
  const gold = state.castle.gold;
  for (let i = 0; i < 3; i++) state = actDemo(state, { type: 'sweep' }, 0, () => 0, 'x').state;
  assert.ok(state.castle.gold > gold); assert.ok(state.heroes[0].experience > 0 || state.heroes[0].level > 1);
  assert.throws(() => actDemo(state, { type: 'sweep' }, 0, () => 0, 'x'));
});

test('dismissMany refunds each grade and refuses assigned officers', () => {
  let state = started();
  state.heroes = [createCollectedHero('guanyu', 1, 'a'), createCollectedHero('guanyu', 2, 'b'), createCollectedHero('guanyu', 1, 'c')];
  state.troops[0].heroIds = ['c', null, null];
  assert.throws(() => actDemo(state, { type: 'dismissMany', heroIds: ['a', 'c'] }, 0, () => 0, 'x'));
  const gold = state.castle.gold;
  state = actDemo(state, { type: 'dismissMany', heroIds: ['a', 'b'] }, 0, () => 0, 'x').state;
  assert.equal(state.castle.gold, gold + 30 + 60); assert.deepEqual(state.heroes.map(h => h.id), ['c']);
});

test('collection rewards count officers ever met, including dismissed ones', () => {
  let state = started(); state.castle.gold = 1e6; state.recruitmentTickets = 0;
  for (let i = 0; i < 10; i++) {
    const rolls = [0, (i + 0.5) / HERO_CATALOG.length];
    state = actDemo(state, { type: 'draw' }, 0, () => rolls.shift(), `c${i}`).state;
  }
  assert.equal(state.collected.length, 10);
  state = actDemo(state, { type: 'dismissMany', heroIds: state.heroes.map(h => h.id) }, 0, () => 0, 'x').state;
  const tickets = state.recruitmentTickets;
  state = actDemo(state, { type: 'claimCollection' }, 0, () => 0, 'x').state;
  assert.equal(state.recruitmentTickets, tickets + 2); assert.equal(state.collectionClaimed, 1);
  assert.throws(() => actDemo(state, { type: 'claimCollection' }, 0, () => 0, 'x'));
  const raw = JSON.parse(JSON.stringify(started())); raw.heroes = [createCollectedHero('lubu', 1, 'l')]; delete raw.collected;
  assert.deepEqual(demoSchema.parse(raw).collected, ['lubu']);
});

test('offline production is capped at 12 hours and summarised', () => {
  const { syncDemo, offlineSummary, OFFLINE_CAP_SECONDS } = mod;
  const state = started();
  const day = syncDemo(state, 24 * 3600 * 1000);
  const half = syncDemo(state, OFFLINE_CAP_SECONDS * 1000);
  assert.equal(Math.floor(day.castle.gold), Math.floor(half.castle.gold));
  const away = offlineSummary(state, day);
  assert.equal(away.seconds, 24 * 3600); assert.ok(away.gold > 0 && away.tickets > 0);
});

test('replay snapshots preserve actual casualties without mutating combatants or consuming extra RNG', () => {
  const attacker = { id: 'a', name: '아군', currentTroops: 800, commander: { name: '관우', leadership: 90, strength: 95, intelligence: 60, skills: [{ kind: 'recover', value: 0.1 }] }, deputies: [] };
  const defender = { id: 'd', name: '적군', currentTroops: 900, commander: { name: '장각', leadership: 80, strength: 70, intelligence: 90, skills: [{ kind: 'counter', value: 0.2 }] }, deputies: [] };
  const before = JSON.stringify([attacker, defender]);
  const result = simulateBattle(attacker, defender, () => 0.4);
  const frames = result.replay.frames;
  assert.equal(JSON.stringify([attacker, defender]), before);
  assert.deepEqual(frames[0], { turn: 0, attacker: 800, defender: 900, message: '양군이 전장에 도착했습니다.' });
  assert.equal(frames.at(-1).attacker, result.attackerRemaining);
  assert.equal(frames.at(-1).defender, result.defenderRemaining);
  assert.equal(frames.at(-1).turn, result.turns);
  assert.ok(frames.length <= 21);
  assert.ok(frames.every(f => Number.isInteger(f.attacker) && f.attacker >= 0 && Number.isInteger(f.defender) && f.defender >= 0));
  assert.deepEqual(simulateBattle(attacker, defender, () => 0.4), result);
});

test('new battle replays survive save restoration and legacy reports remain readable', () => {
  let state = started();
  state.heroes = [createCollectedHero('guanyu', 5, 'commander')];
  state.troops[0].heroIds[0] = 'commander';
  state.troops[0].currentTroops = 500;
  state = actDemo(state, { type: 'battle', targetId: state.targets[0].id }, 0, () => 0.4, 'replay-battle').state;
  const restored = demoSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored.battles[0].replay, state.battles[0].replay);
  assert.equal(restored.battles[0].replay.frames.at(-1).attacker, restored.battles[0].attackerRemaining);
  delete restored.battles[0].replay;
  assert.equal(demoSchema.parse(restored).battles[0].replay, undefined);
});

test('pre-campaign saves migrate without losing owned heroes or formation', () => {
  const old = started();
  old.heroes = [createCollectedHero('guanyu', 3, 'veteran')];
  old.troops[0].heroIds[0] = 'veteran'; old.troops[0].currentTroops = 400;
  delete old.campaign;
  const restored = demoSchema.parse(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored.heroes, old.heroes);
  assert.deepEqual(restored.troops, old.troops);
  assert.equal(restored.campaign.research.economy, 0);
  assert.deepEqual(restored.campaign.expeditions, []);
  restored.campaign.research.economy = 1;
  assert.equal(demoSchema.parse(old).campaign.research.economy, 0, 'defaults are not shared between saves');
});

test('research pays once, waits across reloads, and changes production only when completed', () => {
  let state = started(); state.castle.gold = 100000; state.castle.food = 100000;
  const baseline = mod.production(state).gold, original = JSON.stringify(state);
  state = actDemo(state, { type: 'startResearch', key: 'economy' }, 0, () => 0, 'r').state;
  assert.equal(JSON.parse(original).castle.gold - state.castle.gold, 600);
  assert.equal(mod.production(state).gold, baseline);
  const saved = JSON.stringify(state), finish = state.campaign.researchJob.finishesAt;
  assert.throws(() => actDemo(state, { type: 'completeResearch' }, finish - 1, () => 0, 'r'));
  assert.throws(() => actDemo(state, { type: 'startResearch', key: 'training' }, 0, () => 0, 'r'));
  assert.equal(JSON.stringify(state), saved, 'rejected actions are atomic');
  state = actDemo(demoSchema.parse(JSON.parse(saved)), { type: 'completeResearch' }, finish, () => 0, 'r').state;
  assert.equal(state.campaign.research.economy, 1);
  assert.equal(state.campaign.researchJob, null);
  assert.equal(mod.production(state).gold, baseline * 1.05);
  assert.throws(() => actDemo(state, { type: 'completeResearch' }, finish, () => 0, 'r'));
  state.campaign.research.economy = 10;
  assert.throws(() => actDemo(state, { type: 'startResearch', key: 'economy' }, finish, () => 0, 'r'));
});

test('logistics and training research apply to capacity and combat and round-trip safely', () => {
  const state = started(); state.heroes = [createCollectedHero('guanyu', 5, 'a')]; state.troops[0].heroIds[0] = 'a';
  const capacity = mod.troopCapacity(state);
  const before = mod.aggregateSkills(mod.playerTroop(state)).guard;
  state.campaign.research.logistics = 10; state.campaign.research.training = 10;
  assert.equal(mod.troopCapacity(state), Math.floor(capacity * 1.3));
  assert.equal(mod.aggregateSkills(mod.playerTroop(state)).guard, before + 0.15);
  state.troops[0].currentTroops = mod.troopCapacity(state);
  assert.deepEqual(demoSchema.parse(JSON.parse(JSON.stringify(state))), state);
});

test('idle officers dispatch with persistent fixed rewards and cannot be consumed while away', () => {
  let state = started(); state.heroes = ['guanyu', 'zhaoyun', 'lubu'].map((key, i) => createCollectedHero(key, 1, `h${i}`));
  state = actDemo(state, { type: 'sendExpedition', heroId: 'h0', route: 'scout' }, 0, () => 0, 'mission').state;
  const saved = JSON.stringify(state), finish = state.campaign.expeditions[0].finishesAt;
  for (const action of [{ type: 'dismiss', heroId: 'h0' }, { type: 'dismissMany', heroIds: ['h0'] }, { type: 'assign', slot: 0, heroId: 'h0' }, { type: 'sendExpedition', heroId: 'h0', route: 'trade' }]) assert.throws(() => actDemo(state, action, 0, () => 0, 'bad'));
  assert.throws(() => actDemo(state, { type: 'claimExpedition', expeditionId: 'mission' }, finish - 1, () => 0, 'bad'));
  assert.equal(JSON.stringify(state), saved);
  state = demoSchema.parse(JSON.parse(saved));
  const reward = state.campaign.expeditions[0], before = mod.syncDemo(state, finish);
  state = actDemo(state, { type: 'claimExpedition', expeditionId: 'mission' }, finish, () => 0, 'claim').state;
  assert.equal(state.castle.gold, before.castle.gold + reward.gold);
  assert.equal(state.castle.food, before.castle.food + reward.food);
  assert.equal(state.heroes[0].experience, reward.experience);
  assert.equal(state.campaign.completedExpeditions, 1);
  assert.deepEqual(state.campaign.expeditions, []);
  assert.throws(() => actDemo(state, { type: 'claimExpedition', expeditionId: 'mission' }, finish, () => 0, 'claim'));
});

test('dispatch respects two slots and prevents assigned heroes, invalid routes and promotion materials', () => {
  let state = started(); state.heroes = [createCollectedHero('guanyu', 1, 'a'), createCollectedHero('guanyu', 1, 'b'), createCollectedHero('lubu', 1, 'c')];
  state = actDemo(state, { type: 'sendExpedition', heroId: 'b', route: 'trade' }, 0, () => 0, 'b').state;
  assert.throws(() => actDemo(state, { type: 'promote', heroId: 'a', materialId: 'b' }, 0, () => 0, 'bad'));
  assert.throws(() => actDemo(state, { type: 'sendExpedition', heroId: 'a', route: 'unknown' }, 0, () => 0, 'bad'));
  state = actDemo(state, { type: 'assign', slot: 0, heroId: 'a' }, 0, () => 0, 'a').state;
  assert.throws(() => actDemo(state, { type: 'sendExpedition', heroId: 'a', route: 'scout' }, 0, () => 0, 'bad'));
  state = actDemo(state, { type: 'sendExpedition', heroId: 'c', route: 'frontier' }, 0, () => 0, 'c').state;
  state = actDemo(state, { type: 'assign', slot: 0, heroId: null }, 0, () => 0, 'a').state;
  assert.throws(() => actDemo(state, { type: 'sendExpedition', heroId: 'a', route: 'scout' }, 0, () => 0, 'full'));
  assert.equal(demoSchema.safeParse(state).success, true);
  const bad = structuredClone(state); bad.campaign.expeditions[1].heroId = 'b';
  assert.equal(demoSchema.safeParse(bad).success, false);
});

test('milestones recognise existing progress, pay once, and cannot be claimed early', () => {
  let state = started(); state.stage = 5;
  assert.throws(() => actDemo(state, { type: 'claimMilestone', milestoneId: 'stage10' }, 0, () => 0, 'a'));
  const gold = state.castle.gold, tickets = state.recruitmentTickets;
  state = actDemo(state, { type: 'claimMilestone', milestoneId: 'stage5' }, 0, () => 0, 'a').state;
  assert.equal(state.castle.gold, gold + 3000);
  assert.equal(state.recruitmentTickets, tickets + 3);
  assert.throws(() => actDemo(state, { type: 'claimMilestone', milestoneId: 'stage5' }, 0, () => 0, 'b'));
  const restored = demoSchema.parse(JSON.parse(JSON.stringify(state)));
  assert.throws(() => actDemo(restored, { type: 'claimMilestone', milestoneId: 'stage5' }, 0, () => 0, 'c'));
});

test('maxed buildings still allow completion of daily territory activity via dispatch', () => {
  let state = started(); state.buildings.forEach(b => b.level = 30);
  state.heroes = [createCollectedHero('guanyu', 1, 'a'), createCollectedHero('lubu', 1, 'b')];
  for (const heroId of ['a', 'b']) state = actDemo(state, { type: 'sendExpedition', heroId, route: 'scout' }, 0, () => 0, heroId).state;
  assert.equal(state.daily.progress[2], 2);
  const food = state.castle.food;
  state = actDemo(state, { type: 'claimDaily', index: 2 }, 0, () => 0, 'daily').state;
  assert.equal(state.castle.food, food + 1000);
});

test('all research levels complete across many days without corrupting the save', () => {
  let state = started(), now = 0; state.castle.gold = 1e9; state.castle.food = 1e9;
  for (const key of mod.RESEARCH_KEYS) for (let level = 0; level < 10; level++) {
    state = actDemo(state, { type: 'startResearch', key }, now, () => 0, 'research').state;
    now = state.campaign.researchJob.finishesAt;
    state = actDemo(demoSchema.parse(JSON.parse(JSON.stringify(state))), { type: 'completeResearch' }, now, () => 0, 'complete').state;
    assert.equal(demoSchema.safeParse(state).success, true);
  }
  assert.deepEqual(state.campaign.research, { economy: 10, logistics: 10, training: 10 });
  assert.ok(now > 7 * 24 * 3600000, 'research supports a multi-day progression horizon');
});

test('all six units have two advantages, two weaknesses and symmetric matchup rules', () => {
  assert.equal(mod.UNIT_KEYS.length, 6);
  for (const a of mod.UNIT_KEYS) {
    assert.equal(mod.UNIT_KEYS.filter(d => mod.unitMultiplier(a, d) > 1).length, 2, a);
    assert.equal(mod.UNIT_KEYS.filter(d => mod.unitMultiplier(a, d) < 1).length, 2, a);
    assert.equal(mod.unitMultiplier(a, a), 1);
    for (const d of mod.UNIT_KEYS) assert.ok(Math.abs(mod.unitMultiplier(a, d) * mod.unitMultiplier(d, a) - 1) < 1e-9);
  }
});

test('new unit traits and all eight formations participate in real troop calculation and save restoration', () => {
  const state = started();
  state.heroes = ['zhugeliang', 'pangtong', 'lidian'].map((key, i) => createCollectedHero(key, 5, `h${i}`));
  state.troops[0].heroIds = ['h0', 'h1', 'h2']; state.troops[0].currentTroops = 500;
  assert.equal(mod.FORMATION_KEYS.length, 8);
  for (const unit of mod.UNIT_KEYS) for (const formation of mod.FORMATION_KEYS) {
    state.troops[0].unit = unit; state.troops[0].formation = formation;
    const skills = mod.aggregateSkills(mod.playerTroop(state));
    assert.ok(Object.values(skills).every(Number.isFinite));
    assert.equal(demoSchema.safeParse(JSON.parse(JSON.stringify(state))).success, true);
    const result = simulateBattle(mod.playerTroop(state), mod.targetTroop(state.targets[2]), () => 0.6);
    assert.ok(result.attackerRemaining >= 0 && result.defenderRemaining >= 0);
  }
  const plain = started(); plain.heroes = [createCollectedHero('guanyu', 1, 'g')]; plain.troops[0].heroIds[0] = 'g';
  plain.troops[0].unit = 'sword';
  assert.equal(mod.aggregateSkills(mod.playerTroop(plain)).guard, 0.08);
  plain.troops[0].unit = 'crossbow';
  assert.equal(mod.aggregateSkills(mod.playerTroop(plain)).fire, 0.15);
});

test('formation mastery requires the actual party composition and commander intelligence', () => {
  const scholar = { role: '책사', faction: '촉', intelligence: 90 };
  const guard = { role: '무장', faction: '위', intelligence: 50 };
  const rider = { role: '기장', faction: '오', intelligence: 50 };
  assert.equal(mod.formationResonates('eight', [scholar, guard, rider]), true);
  assert.equal(mod.formationResonates('eight', [guard, scholar, rider]), false);
  assert.equal(mod.formationResonates('eight', [scholar]), false);
  assert.equal(mod.formationResonates('crane', [scholar, guard, rider]), true);
  assert.equal(mod.formationResonates('crane', [scholar, scholar, rider]), false);
  assert.equal(mod.formationResonates('fish', [guard, rider]), true);
  assert.equal(mod.formationResonates('fish', [scholar, rider]), false);
});

test('named hero bonds require distinct officers and their bonuses reach the battle engine', () => {
  assert.equal(mod.troopBonds(['zhugeliang', 'zhugeliang', 'zhugeliang']).length, 0);
  assert.ok(mod.troopBonds(['zhugeliang', 'pangtong']).some(b => b.name === '와룡과 봉추'));
  const state = started();
  state.heroes = ['zhugeliang', 'pangtong'].map((key, i) => createCollectedHero(key, 1, `h${i}`));
  state.troops[0].heroIds = ['h0', 'h1', null];
  const skills = mod.aggregateSkills(mod.playerTroop(state));
  assert.ok(skills.tactics >= 0.08);
  for (const bond of mod.HERO_BONDS) assert.ok(bond.keys.every(key => HERO_CATALOG.some(h => h.key === key)));
});

test('practice battles use current troops without mutating resources, target HP, XP, rewards or records', () => {
  const state = started(); state.heroes = [createCollectedHero('guanyu', 5, 'g')];
  state.troops[0].heroIds[0] = 'g'; state.troops[0].currentTroops = 500;
  const before = JSON.stringify(state);
  const report = mod.practiceBattle(state, state.targets[0].id, () => 0.4);
  assert.equal(JSON.stringify(state), before);
  assert.equal(report.goldReward, 0); assert.equal(report.experienceReward, 0);
  assert.ok(report.replay.frames.length > 1);
  assert.deepEqual(mod.practiceBattle(state, state.targets[0].id, () => 0.4), report);
  state.troops[0].currentTroops = 0;
  assert.throws(() => mod.practiceBattle(state, state.targets[0].id, () => 0.4));
});

test('new officers have unique atlas crops and all five recruitable grades preserve old officers', () => {
  const additions = HERO_CATALOG.filter(h => h.atlas === 'expansion5');
  assert.equal(additions.length, 16);
  assert.deepEqual(additions.map(h => h.tile), Array.from({ length: 16 }, (_, i) => i));
  const bytes = readFileSync('public/art/three-kingdoms-card/heroes-expansion-5.png');
  assert.equal(bytes.readUInt32BE(16), bytes.readUInt32BE(20));
  assert.ok(bytes.readUInt32BE(16) / 4 >= 256);
  assert.equal(new Set(additions.map(h => JSON.stringify(portraitStyle(h.key)))).size, 16);
  for (const template of additions) for (let stars = 1; stars <= 5; stars++) {
    const state = started(); state.heroes = [createCollectedHero('guanyu', 3, 'old'), createCollectedHero(template.key, stars, 'new')];
    assert.ok(demoSchema.safeParse(state).success);
    assert.equal(heroSkills(template.key, 5).length, 2);
  }
});

function trainingReady() {
  const state = started();
  state.heroes = ['guanyu', 'zhaoyun', 'zhugeliang'].map((key, i) => ({ ...createCollectedHero(key, 5, `war-${i}`), leadership: 180, strength: 180, intelligence: 180, charm: 150 }));
  state.troops[0].heroIds = ['war-0', 'war-1', 'war-2'];
  return state;
}

test('tower gives first-clear rewards once without spending real troops, food or reserves', () => {
  let state = trainingReady();
  const original = state, before = structuredClone(state), input = JSON.stringify(state);
  state = actDemo(state, { type: 'challenge', mode: 'tower', level: 1 }, 0, () => 0, 'tower1').state;
  assert.equal(JSON.stringify(original), input);
  assert.equal(state.warRoom.towerFloor, 1);
  assert.equal(state.warRoom.medals, mod.towerReward(1).medals);
  assert.equal(state.warRoom.lastReport.rewarded, true);
  assert.equal(state.castle.food, before.castle.food); assert.equal(state.castle.reserves, before.castle.reserves);
  assert.equal(state.troops[0].currentTroops, before.troops[0].currentTroops);
  assert.equal(state.battles.length, 0);
  const gold = state.castle.gold, medals = state.warRoom.medals, xp = state.heroes.map(h => [h.level, h.experience]);
  state = actDemo(state, { type: 'challenge', mode: 'tower', level: 1 }, 0, () => 0, 'tower-repeat').state;
  assert.equal(state.castle.gold, gold); assert.equal(state.warRoom.medals, medals);
  assert.deepEqual(state.heroes.map(h => [h.level, h.experience]), xp);
  assert.equal(state.warRoom.lastReport.rewarded, false);
  assert.deepEqual(demoSchema.parse(JSON.parse(JSON.stringify(state))), state);
});

test('tower prevents skipped, fractional, negative and out-of-range floors atomically', () => {
  const state = trainingReady(), before = JSON.stringify(state);
  for (const level of [-1, 0, 1.5, 2, 31, NaN]) assert.throws(() => actDemo(state, { type: 'challenge', mode: 'tower', level }, 0, () => 0, 'bad'));
  assert.equal(JSON.stringify(state), before);
});

test('challenge results are deterministic for identical builds and survive resource normalisation', () => {
  const state = trainingReady();
  const player = mod.playerTroop(state), before = JSON.stringify(player);
  const first = mod.runChallenge(player, 'tower', 10, 0, '1970-01-01');
  const second = mod.runChallenge(player, 'tower', 10, 3600000, '1970-01-02');
  assert.deepEqual(first.result, second.result);
  assert.equal(JSON.stringify(player), before);
  assert.equal(first.result.replay.frames[0].attacker, 1000);
  assert.equal(first.result.replay.frames[0].defender, 1000);
  assert.equal(player.currentTroops, 0, 'zero real troops still allow training');
  const date = new Date(2026, 9, 21).getTime();
  const daily1 = mod.runChallenge(player, 'daily', 2, date, '2026-10-21');
  assert.deepEqual(daily1, mod.runChallenge(player, 'daily', 2, date, '2026-10-21'));
});

test('daily battles consume three attempts on wins or losses and reset without deleting medals', () => {
  let state = trainingReady();
  for (let i = 0; i < 3; i++) state = actDemo(state, { type: 'challenge', mode: 'daily', level: 1 }, 0, () => 0, `day-${i}`).state;
  assert.equal(state.warRoom.dailyAttempts, 3); assert.ok(state.warRoom.medals > 0);
  assert.throws(() => actDemo(state, { type: 'challenge', mode: 'daily', level: 1 }, 0, () => 0, 'fourth'));
  const medals = state.warRoom.medals;
  const nextDay = mod.syncDemo(state, 24 * 3600000);
  assert.equal(nextDay.warRoom.dailyAttempts, 0); assert.equal(nextDay.warRoom.medals, medals);
  const weak = trainingReady(); weak.heroes.forEach(h => { h.leadership = 1; h.strength = 1; h.intelligence = 1; h.charm = 1; }); weak.heroes = [weak.heroes[0]]; weak.troops[0].heroIds = ['war-0', null, null];
  const loss = actDemo(weak, { type: 'challenge', mode: 'daily', level: 3 }, 0, () => 0, 'loss').state;
  assert.notEqual(loss.warRoom.lastReport.winner, 'ATTACKER');
  assert.equal(loss.warRoom.dailyAttempts, 1); assert.equal(loss.warRoom.medals, 0);
});

test('shop exchanges are atomic, stock-limited, and offer a chosen 3-star officer', () => {
  let state = trainingReady(); state.warRoom.medals = 500;
  const tickets = state.recruitmentTickets;
  for (let i = 0; i < 2; i++) state = actDemo(state, { type: 'warShop', item: 'tickets' }, 0, () => 0, `ticket-${i}`).state;
  assert.equal(state.recruitmentTickets, tickets + 4); assert.equal(state.warRoom.medals, 460);
  assert.throws(() => actDemo(state, { type: 'warShop', item: 'tickets' }, 0, () => 0, 'stock'));
  const before = JSON.stringify(state);
  assert.throws(() => actDemo(state, { type: 'warShop', item: 'officer', officerKey: 'unknown' }, 0, () => 0, 'invalid'));
  assert.throws(() => actDemo(state, { type: 'warShop', item: 'manual', heroId: 'absent' }, 0, () => 0, 'invalid'));
  assert.equal(JSON.stringify(state), before);
  state = actDemo(state, { type: 'warShop', item: 'officer', officerKey: 'gaoshun' }, 0, () => 0, 'officer').state;
  assert.equal(state.heroes.at(-1).templateKey, 'gaoshun'); assert.equal(state.heroes.at(-1).stars, 3);
  assert.ok(state.collected.includes('gaoshun'));
  assert.throws(() => actDemo(state, { type: 'warShop', item: 'officer', officerKey: 'lidian' }, 0, () => 0, 'limit'));
  const gold = state.castle.gold;
  state = actDemo(state, { type: 'warShop', item: 'manual', heroId: 'war-0' }, 0, () => 0, 'xp').state;
  assert.equal(state.castle.gold, gold); assert.ok(state.heroes[0].level > 1);
  const next = mod.syncDemo(state, 24 * 3600000);
  assert.deepEqual(next.warRoom.shopCounts, [0, 0, 0]);
  assert.equal(next.warRoom.medals, state.warRoom.medals);
  const poor = trainingReady();
  assert.throws(() => actDemo(poor, { type: 'warShop', item: 'tickets' }, 0, () => 0, 'poor'));
});

test('presets restore full tactics, return excess troops and refuse unavailable heroes without mutation', () => {
  let state = trainingReady(); state.troops[0].unit = 'crossbow'; state.troops[0].formation = 'eight';
  state = actDemo(state, { type: 'savePreset', slot: 0, name: '계략 부대' }, 0, () => 0, 'save').state;
  state.troops[0].unit = 'spear'; state.troops[0].formation = 'fish';
  state = actDemo(state, { type: 'loadPreset', slot: 0 }, 0, () => 0, 'load').state;
  assert.equal(state.troops[0].unit, 'crossbow'); assert.equal(state.troops[0].formation, 'eight');
  state.troops[0].heroIds = ['war-0', null, null];
  state = actDemo(state, { type: 'savePreset', slot: 1, name: '소수 부대' }, 0, () => 0, 'save').state;
  state = actDemo(state, { type: 'loadPreset', slot: 0 }, 0, () => 0, 'load').state;
  state.troops[0].currentTroops = mod.troopCapacity(state);
  const soldiers = state.troops[0].currentTroops, reserves = state.castle.reserves;
  state = actDemo(state, { type: 'loadPreset', slot: 1 }, 0, () => 0, 'small').state;
  assert.equal(state.castle.reserves, reserves + soldiers - state.troops[0].currentTroops);
  state = actDemo(state, { type: 'sendExpedition', heroId: 'war-1', route: 'scout' }, 0, () => 0, 'busy').state;
  const before = JSON.stringify(state);
  assert.throws(() => actDemo(state, { type: 'loadPreset', slot: 0 }, 0, () => 0, 'fail'));
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(demoSchema.parse(JSON.parse(JSON.stringify(state))).presets, state.presets);
});

test('old saves migrate into empty war room and presets without touching campaign progress', () => {
  const old = trainingReady(); old.campaign.research.economy = 3; delete old.warRoom; delete old.presets;
  const next = demoSchema.parse(JSON.parse(JSON.stringify(old)));
  assert.equal(next.campaign.research.economy, 3); assert.equal(next.warRoom.medals, 0);
  assert.deepEqual(next.presets, [null, null, null]); assert.deepEqual(next.heroes, old.heroes);
});

test('all 30 tower floors remain beatable with a fully developed party and finish cleanly', () => {
  let state = started();
  state.heroes = ['guanyu', 'zhaoyun', 'zhugeliang'].map((key, i) => {
    const h = createCollectedHero(key, 5, `war-${i}`); h.level = 100; h.maxTroops += 99 * 50;
    let points = 99 * mod.STAT_POINTS_PER_LEVEL;
    for (const stat of ['strength', 'intelligence', 'leadership']) {
      const spent = Math.min(200 - h[stat], points); h[stat] += spent; h.spent[mod.STAT_KEYS.indexOf(stat)] = spent; points -= spent;
    }
    h.statPoints = points; return h;
  });
  state.troops[0].heroIds = ['war-0', 'war-1', 'war-2'];
  state.campaign.research.training = 10;
  for (let floor = 1; floor <= 30; floor++) {
    let found = false;
    outer: for (const unit of mod.UNIT_KEYS) for (const formation of mod.FORMATION_KEYS) {
      state.troops[0].unit = unit; state.troops[0].formation = formation;
      if (mod.runChallenge(mod.playerTroop(state), 'tower', floor, 0, '1970-01-01').result.winner === 'ATTACKER') { found = true; break outer; }
    }
    assert.ok(found, `floor ${floor} should have a winning tactical solution`);
    state = actDemo(state, { type: 'challenge', mode: 'tower', level: floor }, 0, () => 0, `floor-${floor}`).state;
    assert.equal(state.warRoom.towerFloor, floor);
    assert.equal(demoSchema.safeParse(state).success, true);
  }
  assert.throws(() => actDemo(state, { type: 'challenge', mode: 'tower', level: 31 }, 0, () => 0, 'beyond'));
});
