import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { loadBundle } from './bundle.mjs';

const ids = readdirSync('src/games').filter(id => existsSync(`src/games/${id}/meta.ts`));
const M = await loadBundle(ids.map((id, i) => `export {meta as m${i}} from './src/games/${id}/meta.ts';`).join('\n') + `
  export * from './src/platform/meta/api.ts';
  export {metaStore} from './src/platform/meta/store.ts';`);
const games = ids.map((id, i) => ({ id, meta: M[`m${i}`] }));

// Exactly the shapes the games write today.
const OLD = {
  'arcade:hachuping-whack-a-mole:normal:highScore': '320',
  'arcade:hachuping-whack-a-mole:hard:highScore': '410',
  'arcade:hachuping-whack-a-mole:highScore': '500',
  'arcade:hachuping-color-match:easy:highScore': '0',
  'arcade:hachuping-balloon:highScore': '42',
  'arcade:hachuping-jump:highScore': '777',
  'arcade:hachuping-slither:highScore': 'not a number',
  'hachuping-memory-highscore': '9',
  'arcade:hachuping-memory:highScore': '6',
  'rune-ranger-best-nightmare': '612',
  'arcade:night-train:records': JSON.stringify({ runs: 12, wins: 2, bestFloor: 13, bestScore: 4321 }),
  'gh-ghost-movers-v1': JSON.stringify({ unlocked: 9, best: { 0: { stars: 3, steps: 10 }, 1: { stars: 2, steps: 20 }, 99: { stars: 3, steps: 1 } } }),
  'ten-seconds-progress-v1': JSON.stringify({ unlocked: 2, best: { 0: { stars: 3, loops: 1, deaths: 0 }, 1: { stars: 1, loops: 4, deaths: 2 } } }),
  'gh-arcade:fantasy-tactics:v1': '{broken',
};

test('old records come in once, read-only, and unlock what they already earned', () => {
  const store = new Map(Object.entries(OLD));
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  M.metaStore.resetForTests();
  try {
    M.importLegacyRecords(games, k => store.get(k) ?? null, 5);
    const s = M.metaStore.get();
    assert.deepEqual(s.games['hachuping-whack-a-mole'].best, { 'default|normal': 320, 'default|hard': 410, 'legacy|-': 500 });
    assert.deepEqual(s.games['hachuping-color-match'].best, {}, 'a 0 high score means never played');
    assert.equal(s.games['hachuping-memory'].best['default|-'], 9, 'the older memory key wins when higher');
    assert.equal(s.games['hachuping-slither'].best['default|-'], undefined, 'garbage is skipped');
    assert.equal(s.games['hachuping-dodge'].best['default|nightmare'], 612);
    assert.deepEqual([s.games['night-train'].runs, s.games['night-train'].wins, s.games['night-train'].progress.station], [12, 2, 13]);
    assert.deepEqual(s.games['ghost-movers'].progress, { cleared: 2, stars: 5 }, 'out-of-range levels ignored');
    assert.deepEqual(s.games['ten-seconds'].progress, { cleared: 2, stars: 4 });
    assert.equal(s.games['fantasy-tactics']?.progress.chapter, undefined, 'a broken save is skipped, not fatal');
    assert.ok(s.achievements['hachuping-whack-a-mole/hard400'] && s.achievements['hachuping-dodge/nightmare'] && s.achievements['night-train/win1']);
    assert.ok(s.achievements['hachuping-jump/best500']);
    for (const [key, value] of Object.entries(OLD)) assert.equal(store.get(key), value, `${key} untouched`);
    const runsBefore = s.games['night-train'].runs;
    M.importLegacyRecords(games, k => store.get(k) ?? null, 6);
    assert.equal(M.metaStore.get().games['night-train'].runs, runsBefore, 'a second start does not count twice');
    assert.equal(M.metaStore.get().importedLegacy['night-train'], 1);
  } finally { delete globalThis.localStorage; M.metaStore.resetForTests(); }
});
