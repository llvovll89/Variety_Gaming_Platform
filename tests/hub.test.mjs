import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['src/platform/hubCatalog.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { availableGames, comingSoonGames, filterHubGames, parseRecentGameIds, readRecentGameIds, recordRecentGame } =
  await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

const game = (id, title, genres, tags = [], disabled = false) => ({
  id, title, genres, tags, disabled, description: `${title} 설명`, thumbnail: `/${id}.png`, accentColor: '#fff', Component() {},
});
const games = [
  game('strategy', '삼국 전략', ['전략'], ['카드', '영지']),
  game('action', '별빛 전투', ['액션', '캐주얼'], ['생존']),
  game('kids', '동물 기억력', ['키즈', '캐주얼'], ['패턴'], true),
];

test('hub separates playable and coming-soon games', () => {
  assert.deepEqual(availableGames(games).map(g => g.id), ['strategy', 'action']);
  assert.deepEqual(comingSoonGames(games).map(g => g.id), ['kids']);
});

test('search covers title, description, genre and tags and combines with genre', () => {
  assert.deepEqual(filterHubGames(games, '삼국', '전체').map(g => g.id), ['strategy']);
  assert.deepEqual(filterHubGames(games, '생존', '액션').map(g => g.id), ['action']);
  assert.deepEqual(filterHubGames(games, '카드', '액션'), []);
  assert.deepEqual(filterHubGames(games, '패턴', '전체'), []);
});

test('recent games recover malformed data, remove duplicates and ignore unavailable ids', () => {
  assert.deepEqual(parseRecentGameIds('broken', games), []);
  assert.deepEqual(parseRecentGameIds(JSON.stringify(['action', 'missing', 'action', 'kids', 'strategy']), games), ['action', 'strategy']);
});

test('recording recent games keeps newest first and ignores unavailable games', () => {
  let stored = JSON.stringify(['strategy']);
  globalThis.localStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  assert.deepEqual(recordRecentGame('action', games), ['action', 'strategy']);
  assert.deepEqual(recordRecentGame('strategy', games), ['strategy', 'action']);
  assert.deepEqual(recordRecentGame('kids', games), ['strategy', 'action']);
  assert.deepEqual(readRecentGameIds(games), ['strategy', 'action']);
});

test('cartridge text colour follows shell luminance', async () => {
  const { readableInk } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
  assert.equal(readableInk('#7a2020'), 'light');
  assert.equal(readableInk('#ffc83d'), 'dark');
  assert.equal(readableInk('#a3a3a3'), 'dark');
  assert.equal(readableInk('nope'), 'dark');
});
