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
`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { HERO_CATALOG, createDemo, createCollectedHero, demoSchema, portraitStyle, actDemo, HERO_SKILLS, heroSkills, skillTier, simulateBattle } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);

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

test('all 64 heroes have distinct keys, valid portraits and serializable cards at every grade', () => {
  assert.equal(HERO_CATALOG.length, 64);
  assert.equal(new Set(HERO_CATALOG.map(h => h.key)).size, 64);
  assert.equal(new Set(HERO_CATALOG.map(h => h.name)).size, 64);
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
  assert.equal(portraits.size, 64);
});

test('each new officer can be recruited and restored in an existing formation', () => {
  for (let index = 48; index < HERO_CATALOG.length; index++) {
    const state = createDemo(0);
    state.lordName = '군주';
    state.castleName = '영지';
    state.heroes = [createCollectedHero('guanyu', 3, 'existing-officer')];
    state.troop.heroIds = ['existing-officer', null, null];
    const rolls = [0.99, (index + 0.5) / HERO_CATALOG.length];
    const recruited = actDemo(state, { type: 'draw' }, 0, () => rolls.shift(), `new-${index}`).state;
    assert.equal(recruited.heroes[1].templateKey, HERO_CATALOG[index].key);
    assert.equal(recruited.heroes[1].stars, 5);
    recruited.troop.heroIds[1] = recruited.heroes[1].id;
    assert.deepEqual(demoSchema.parse(JSON.parse(JSON.stringify(recruited))), recruited);
    assert.deepEqual(recruited.heroes[0], state.heroes[0]);
  }
});

test('pre-expansion v2 saves retain owned officers and formation', () => {
  const state = createDemo(0);
  state.lordName = '기존군주';
  state.heroes = [createCollectedHero('guanyu', 3, 'existing-officer')];
  state.troop.heroIds = ['existing-officer', null, null];
  state.troop.currentTroops = 300;
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
