import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const result = await build({ stdin: { contents: `
  export {createElement} from 'react';
  export {renderToStaticMarkup} from 'react-dom/server';
  export * from './src/games/three-kingdoms-card/lib/demoGame';
  export {default as ForgeTab} from './src/games/three-kingdoms-card/components/tabs/ForgeTab';
  export {default as CampaignTab} from './src/games/three-kingdoms-card/components/tabs/CampaignTab';
  export {default as FormationTab} from './src/games/three-kingdoms-card/components/tabs/FormationTab';
  export {default as SortieTab} from './src/games/three-kingdoms-card/components/tabs/SortieTab';
  export {default as CommandOverview} from './src/games/three-kingdoms-card/components/CommandOverview';
  export {default as HeroRoster} from './src/games/three-kingdoms-card/components/HeroRoster';
  export {resourceNumber} from './src/games/three-kingdoms-card/components/tabs/shared';
  export {HeroCard} from './src/games/three-kingdoms-card/components/HeroVisual';
  export {default as HeroDetails} from './src/games/three-kingdoms-card/components/HeroDetails';
  export {default as ChallengesTab} from './src/games/three-kingdoms-card/components/tabs/ChallengesTab';
  export {default as FormationPresets} from './src/games/three-kingdoms-card/components/FormationPresets';
`, resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic' });
const compiled = new Module(fileURLToPath(import.meta.url));
compiled.filename = fileURLToPath(import.meta.url);
compiled.paths = Module._nodeModulePaths(process.cwd());
compiled._compile(result.outputFiles[0].text, compiled.filename);
const { createElement, renderToStaticMarkup, createDemo, createCollectedHero, actDemo, CampaignTab, FormationTab, SortieTab, CommandOverview, HeroRoster, resourceNumber } = compiled.exports;
const noop = () => {};
const render = (component, props) => renderToStaticMarkup(createElement(component, props));
const { HeroCard, HeroDetails } = compiled.exports;

test('forge empty state guides crafting and inventory shows exact upgrade costs', () => {
  const state = createDemo(0);
  const empty = render(compiled.exports.ForgeTab, { state, act: noop });
  assert.match(empty, /시작 철재 30/);
  state.forge.items = [{ id: 'gear', key: 'sageFan', level: 3, heroId: null }];
  const html = render(compiled.exports.ForgeTab, { state, act: noop });
  assert.match(html, /책략 우선 \+3/);
  assert.match(html, /지력 \+15/);
  assert.match(html, /금 1,350 \/ 철재 15/);
  assert.match(html, /철재 \+15/);
});

test('officer detail renders protection and gear bonuses without changing allocated stats', () => {
  const hero = createCollectedHero('zhaoyun', 3, 'h'); hero.locked = true;
  const html = render(HeroDetails, { hero, owned: true, gold: 10000, heroes: [hero], equipment: [{ id: 'g', key: 'sageFan', level: 2, heroId: 'h' }], onAct: noop, onClose: noop, onFormation: noop });
  assert.match(html, /잠금 해제/);
  assert.match(html, /지력 \+10/);
  assert.match(html, /책략 우선 \+2/);
  assert.match(html, /disabled=""[^>]*title="잠금을 해제한 뒤 방출하세요/);
});

test('empty roster, formation, campaign and first-stage targets render without missing data or false NPC portraits', () => {
  const state = createDemo(Date.now()); state.lordName = '군주'; state.castleName = '영지';
  const shared = { state, act: noop, onNavigate: noop, onInspect: noop };
  for (const html of [render(CampaignTab, shared), render(FormationTab, shared), render(SortieTab, { ...shared, selectedBattle: null, onSelectBattle: noop }), render(CommandOverview, shared), render(HeroRoster, { heroes: [], assignedIds: [], busyIds: [], showCatalog: false, onShowCatalog: noop, onRecruit: noop, onInspect: noop, onPreview: noop, onDismissMany: noop })]) {
    assert.doesNotMatch(html, /NaN|undefined|Infinity/);
  }
  const sortie = render(SortieTab, { ...shared, selectedBattle: null, onSelectBattle: noop });
  assert.equal((sortie.match(/aria-label="적군 지휘관"/g) || []).length, 3);
  assert.doesNotMatch(sortie, /관우 초상/);
});

test('returned dispatches expose claim actions while the assigned officer is unavailable to send again', () => {
  const now = Date.now();
  let state = createDemo(now - 3600000); state.lordName = '군주'; state.castleName = '영지';
  state.heroes = [createCollectedHero('guanyu', 1, 'a')];
  state = actDemo(state, { type: 'sendExpedition', heroId: 'a', route: 'scout' }, now - 3600000, () => 0, 'mission').state;
  const html = render(CampaignTab, { state, act: noop });
  assert.match(html, /귀환 보상 받기/);
  assert.match(html, /대기 장수가 없습니다/);
  assert.doesNotMatch(html, /<option value="a"/);
});

test('research progress and completed milestones render distinct usable states after reload', () => {
  const now = Date.now();
  let state = createDemo(now); state.lordName = '군주'; state.castleName = '영지';
  state.castle.gold = 1e6; state.castle.food = 1e6;
  state = actDemo(state, { type: 'startResearch', key: 'economy' }, now, () => 0, 'r').state;
  state.campaign.researchJob.finishesAt = now - 1; state.stage = 5;
  const html = render(CampaignTab, { state, act: noop });
  assert.match(html, /연구 완료 적용/);
  assert.match(html, /보상 받기/);
  assert.match(html, /다른 연구 진행 중/);
});

test('header resource abbreviations bound large numbers while preserving normal small values', () => {
  assert.equal(resourceNumber(1200), '1,200');
  assert.equal(resourceNumber(1e9), '10억');
  assert.equal(resourceNumber(123400), '12.3만');
  const state = createDemo(Date.now()); state.lordName = '열두글자군주이름테스트'; state.castleName = '열두글자영지이름테스트';
  const html = render(CommandOverview, { state, onNavigate: noop });
  assert.ok(html.includes(state.castleName));
  assert.match(html, /군정 관리/);
});

test('hero cards always reserve two ability rows at every grade, with locked abilities explained', () => {
  for (const key of ['pangtong', 'zhangliao', 'chenqun', 'gaoshun']) for (let stars = 1; stars <= 5; stars++) {
    const html = render(HeroCard, { hero: createCollectedHero(key, stars, 'card'), onClick: noop });
    assert.equal((html.match(/class="skill-chip /g) || []).length, 2);
    assert.equal((html.match(/is-locked/g) || []).length, stars < 3 ? 2 : 0);
    if (stars < 3) assert.match(html, /3성 해금/);
    assert.doesNotMatch(html, /NaN|undefined/);
  }
});

test('detail layout anchors the portrait at the top and scrolls the description independently', () => {
  const css = postcss.parse(readFileSync('src/games/three-kingdoms-card/three-kingdoms-card.css', 'utf8'));
  const base = [];
  css.walkRules(rule => { if (rule.parent.type === 'root') base.push(rule); });
  const values = (selector, prop) => base.filter(r => r.selector === selector).flatMap(r => r.nodes.filter(d => d.prop === prop).map(d => d.value));
  assert.ok(!values('.hero-detail-visual', 'justify-content').includes('center'));
  assert.ok(values('.hero-detail-visual', 'min-height').every(v => v === '0'));
  assert.ok(values('.hero-detail-body', 'overflow-y').includes('auto'));
  assert.ok(values('.hero-dialog[open]', 'height').some(v => v.includes('svh')));
  assert.ok(values('.hero-card .card-skills', 'grid-template-rows').includes('repeat(2, 24px)'));
  const hero = createCollectedHero('pangtong', 1, 'pangtong');
  const html = render(HeroDetails, { hero, owned: true, gold: 1200, heroes: [hero], troopIds: [], onAct: noop, onClose: noop, onFormation: noop });
  assert.match(html, /class="hero-detail-visual"><div class="hero-portrait /);
  assert.match(html, /class="hero-identity"/);
});

test('formation screen shows six units, eight diagrams, mastery conditions and named hero bonds', () => {
  const state = createDemo(Date.now()); state.lordName = '군주'; state.castleName = '영지';
  state.heroes = ['zhugeliang', 'pangtong', 'lidian'].map((key, i) => createCollectedHero(key, 5, `h${i}`));
  state.troops[0].heroIds = ['h0', 'h1', 'h2']; state.troops[0].formation = 'eight';
  const html = render(FormationTab, { state, act: noop, onNavigate: noop, onInspect: noop });
  assert.equal((html.match(/class="formation-diagram"/g) || []).length, 8);
  assert.match(html, /도순병/); assert.match(html, /노병/); assert.match(html, /궁기병/);
  assert.match(html, /진형 숙련 발동/); assert.match(html, /와룡과 봉추/);
  assert.match(html, /6개 병종 상성표/);
});

test('all challenge views render in an empty early save with no invalid opponent data', () => {
  const state = createDemo(Date.now()); state.lordName = '군주'; state.castleName = '영지';
  for (const mode of ['연무탑', '요일 전장', '교환소']) {
    const html = render(compiled.exports.ChallengesTab, { state, act: noop, mode, onNavigate: noop });
    assert.doesNotMatch(html, /NaN|undefined|Infinity/);
    assert.match(html, /전공/);
    if (mode === '연무탑') { assert.match(html, /30층/); assert.match(html, /주장을 먼저 배치/); }
    if (mode === '요일 전장') assert.match(html, /승패에 관계없이 1회 차감/);
    if (mode === '교환소') { assert.match(html, /초빙장 2장/); assert.match(html, /3성 장수 초빙/); }
  }
});

test('presets identify missing officers before applying a stale saved formation', () => {
  const state = createDemo(Date.now()); state.lordName = '군주'; state.castleName = '영지';
  state.presets[0] = { name: '과거 편성', heroIds: ['missing', null, null], unit: 'crossbow', formation: 'eight' };
  const html = render(compiled.exports.FormationPresets, { state, act: noop });
  assert.match(html, /미보유 장수 포함/); assert.match(html, /과거 편성/);
  assert.doesNotMatch(html, /NaN|undefined/);
});
