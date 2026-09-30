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
`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const mod = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const { HERO_CATALOG, createDemo, createCollectedHero, demoSchema, portraitStyle, actDemo, HERO_SKILLS, heroSkills, skillTier, simulateBattle } =
  mod;

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

test('all 72 heroes have distinct keys, valid portraits and serializable cards at every grade', () => {
  assert.equal(HERO_CATALOG.length, 72);
  assert.equal(new Set(HERO_CATALOG.map(h => h.key)).size, 72);
  assert.equal(new Set(HERO_CATALOG.map(h => h.name)).size, 72);
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
  assert.equal(portraits.size, 72);
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
