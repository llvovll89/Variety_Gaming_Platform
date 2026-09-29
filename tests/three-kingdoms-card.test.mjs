import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { build } from 'esbuild';
import postcss from 'postcss';

const compiled = await build({ stdin: { contents: `
  export * from './src/games/three-kingdoms-card/lib/heroCatalog';
  export * from './src/games/three-kingdoms-card/lib/demoGame';
  export * from './src/games/three-kingdoms-card/lib/heroPortrait';
`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { HERO_CATALOG, createDemo, createCollectedHero, demoSchema, portraitStyle } =
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

test('all 48 heroes have distinct keys, valid portraits and serializable cards at every grade', () => {
  assert.equal(HERO_CATALOG.length, 48);
  assert.equal(new Set(HERO_CATALOG.map(h => h.key)).size, 48);
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
  assert.equal(portraits.size, 48);
});

test('pre-expansion v2 saves retain owned officers and formation', () => {
  const state = createDemo(0);
  state.lordName = '기존군주';
  state.heroes = [createCollectedHero('guanyu', 3, 'existing-officer')];
  state.troop.heroIds = ['existing-officer', null, null];
  state.troop.currentTroops = 300;
  assert.deepEqual(demoSchema.parse(JSON.parse(JSON.stringify(state))), state);
});
