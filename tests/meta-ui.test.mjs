import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const M = await loadBundle(`
  export {createElement} from 'react';
  export {renderToStaticMarkup} from 'react-dom/server';
  export {RewardStrip} from './src/platform/meta/RewardStrip.tsx';
`);
const h = M.createElement, render = M.renderToStaticMarkup;
const rewards = {
  newBest: true, previousBest: 10, best: 20,
  unlocked: [{ gameId: 'mole', id: 'first', title: '첫 두더지', description: '한 판을 끝까지 해요', tier: 1, kids: { title: '뿅망치 스티커', sticker: '🔨' } }],
  daily: { id: 'd', label: '200점 넘기', completed: true, justCompleted: true },
  streak: { days: 3, extendedToday: true },
};

test('kids see stickers and stamps, everyone else sees badges, from the same rewards', () => {
  const kids = render(h(M.RewardStrip, { rewards, audience: 'kids' }));
  assert.match(kids, /🔨/);
  assert.match(kids, /새 스티커를 받았어요!.*뿅망치 스티커/);
  const many = render(h(M.RewardStrip, { rewards: { ...rewards, unlocked: [rewards.unlocked[0], { ...rewards.unlocked[0], id: 'b' }] }, audience: 'kids' }));
  assert.match(many, /새 스티커 2개를 받았어요!/);
  assert.equal((many.match(/새 스티커/g) ?? []).length, 1, 'one heading for several stickers');
  assert.match(kids, /오늘의 도전 성공!/);
  assert.match(kids, /도장 3개째/);
  assert.ok(!/업적|브론즈/.test(kids), 'no tiers or jargon for kids');
  const general = render(h(M.RewardStrip, { rewards, audience: 'general' }));
  assert.match(general, /업적 달성 · 첫 두더지/);
  assert.match(general, /data-tier="1"/);
  assert.match(general, /3일 연속 플레이/);
});

test('nothing earned shows nothing, and a first day is not called a streak', () => {
  const none = { ...rewards, unlocked: [], daily: { ...rewards.daily, justCompleted: false }, streak: { days: 1, extendedToday: true } };
  assert.equal(render(h(M.RewardStrip, { rewards: none, audience: 'kids' })), '');
  assert.equal(render(h(M.RewardStrip, { rewards: null, audience: 'general' })), '');
});

test('the hub only offers challenges a game can actually complete, plus this week of stamps', async () => {
  const T = await loadBundle(`
    export {createElement} from 'react';
    export {renderToStaticMarkup} from 'react-dom/server';
    export {TodayCard, weekOf} from './src/platform/meta/TodayCard.tsx';
  `);
  assert.deepEqual(T.weekOf('2026-11-17'), ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
  assert.equal(T.weekOf('2026-11-22')[0], '2026-11-16', 'Sunday ends the week');
  const daily = [{ id: 's', label: '{n}점 넘기', stat: 'score', range: [10, 10], step: 1 }];
  const game = (id, extra) => ({ id, title: id, description: '', thumbnail: '', accentColor: '', genres: ['키즈'], tags: [], Component: () => null, meta: { achievements: [], daily, ...extra } });
  const games = [game('hachuping-balloon', {}), game('hachuping-memory', { reportsRuns: true })];
  const html = T.renderToStaticMarkup(T.createElement(T.TodayCard, { games, onSelect() {}, today: '2026-11-17' }));
  assert.match(html, /hachuping-memory: 10점 넘기/);
  assert.ok(!html.includes('hachuping-balloon'), 'a game that does not report yet is not offered');
  assert.equal((html.match(/<li data-on/g) ?? []).length, 7);
  assert.equal(T.renderToStaticMarkup(T.createElement(T.TodayCard, { games: [game('x', {})], onSelect() {}, today: '2026-11-17' })), '');
});

test('a game card shows the best and earned count only after the game was played', async () => {
  const P = await loadBundle(`export {cardProgress} from './src/platform/meta/ProfileSheet.tsx';`);
  const meta = (games, achievements = {}) => ({ v: 1, importedLegacy: {}, days: {}, games, achievements, daily: {} });
  const rec = o => ({ runs: 1, wins: 0, playMs: 0, lastPlayed: 0, best: {}, totals: {}, peaks: {}, progress: {}, dailyDone: 0, ...o });
  const defs = [{ id: 'a', tier: 1 }, { id: 'b', tier: 1 }];
  const kids = { id: 'mole', genres: ['키즈'], meta: { scoreUnit: '점', achievements: defs } };
  const maze = { id: 'maze', genres: ['캐주얼'], meta: { scoreOrder: 'low', scoreUnit: '초', achievements: defs } };
  assert.equal(P.cardProgress(kids, meta({})), null);
  assert.deepEqual(P.cardProgress(kids, meta({ mole: rec({ best: { 'default|easy': 300, 'default|hard': 1200 } }) }, { 'mole/a': 1 })), { best: '최고 1,200점', earned: '스티커 1/2' });
  assert.deepEqual(P.cardProgress(maze, meta({ maze: rec({ best: { 'default|easy': 80, 'default|hard': 65 } }) })), { best: '최고 65초', earned: '업적 0/2' }, 'fastest time for lower-is-better games');
});
