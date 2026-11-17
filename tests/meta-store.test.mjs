import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const M = await loadBundle(`
  export * from './src/platform/meta/records.ts';
  export * from './src/platform/meta/store.ts';
`);

function withStorage(initial, run, { blocked = false } = {}) {
  const store = new Map(Object.entries(initial));
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => { if (blocked) throw new Error('blocked'); store.set(k, String(v)); }, removeItem: k => store.delete(k) };
  M.metaStore.resetForTests();
  try { return run(store); } finally { delete globalThis.localStorage; M.metaStore.resetForTests(); }
}

test('a run counts toward runs, wins, play time, best per mode, totals and peaks', () => {
  let s = M.emptyMeta();
  ({ state: s } = M.addRun(s, 'mole', { difficulty: 'hard', score: 120, durationMs: 30000, outcome: 'complete', stats: { combo: 7, hits: 12 } }, 1000));
  const second = M.addRun(s, 'mole', { difficulty: 'hard', score: 90, durationMs: 30000, outcome: 'complete', stats: { combo: 9, hits: 10 } }, 2000);
  s = second.state;
  const r = s.games.mole;
  assert.deepEqual([r.runs, r.wins, r.playMs, r.lastPlayed], [2, 2, 60000, 2000]);
  assert.deepEqual(r.best, { 'default|hard': 120 });
  assert.equal(second.newBest, false);
  assert.equal(M.addRun(M.emptyMeta(), 'mole', { score: 0, durationMs: 1, outcome: 'lose' }, 1).newBest, false, 'a first score of 0 is no new best to celebrate');
  assert.equal(second.previousBest, 120);
  assert.deepEqual(r.totals, { combo: 16, hits: 22 });
  assert.deepEqual(r.peaks, { combo: 9, hits: 12 });
  assert.equal(M.bestOf(r, 'high'), 120);
  assert.equal(M.bestOf(r, 'high', undefined, 'easy'), null);
});

test('lower is better for times, quit runs never set a record, and progress only moves forward', () => {
  let s = M.emptyMeta();
  s = M.addRun(s, 'maze', { score: 80, durationMs: 1, outcome: 'win' }, 1, 'low').state;
  const faster = M.addRun(s, 'maze', { score: 60, durationMs: 1, outcome: 'win' }, 2, 'low');
  assert.equal(faster.newBest, true);
  s = faster.state;
  assert.equal(M.addRun(s, 'maze', { score: 10, durationMs: 1, outcome: 'quit' }, 3, 'low').newBest, false);
  s = M.addProgress(s, 'jump', 'world', 3);
  assert.equal(M.addProgress(s, 'jump', 'world', 2), s, 'going back changes nothing');
  assert.equal(M.addProgress(s, 'jump', 'world', 4).games.jump.progress.world, 4);
});

test('stored records are validated, a broken value is set aside once, and play continues', () => {
  withStorage({ 'arcade:meta:v1': '{"v":1,"games":"oops"}' }, store => {
    assert.deepEqual(M.metaStore.get().games, {});
    assert.equal(store.get('arcade:meta:v1:corrupt'), '{"v":1,"games":"oops"}');
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 5, durationMs: 1, outcome: 'complete' }, 1).state);
    assert.equal(JSON.parse(store.get('arcade:meta:v1')).games.mole.runs, 1);
  });
});

test('a change made in another tab is built upon, not overwritten', () => {
  withStorage({}, store => {
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 5, durationMs: 1, outcome: 'complete' }, 1).state);
    const other = M.addRun(JSON.parse(store.get('arcade:meta:v1')), 'balloon', { score: 3, durationMs: 1, outcome: 'complete' }, 2).state;
    store.set('arcade:meta:v1', JSON.stringify(other));
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 9, durationMs: 1, outcome: 'complete' }, 3).state);
    const saved = JSON.parse(store.get('arcade:meta:v1'));
    assert.equal(saved.games.balloon.runs, 1);
    assert.equal(saved.games.mole.runs, 2);
  });
});

test('with storage blocked, records still hold for this visit and the failure is visible', () => {
  withStorage({}, () => {
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 5, durationMs: 1, outcome: 'complete' }, 1).state);
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 7, durationMs: 1, outcome: 'complete' }, 2).state);
    assert.equal(M.metaStore.get().games.mole.runs, 2);
    assert.equal(M.metaStore.writeFailed(), true);
  }, { blocked: true });
});

test('when storage is full, this visit keeps every run instead of falling back to the stored value', () => {
  const store = new Map();
  let full = false;
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => { if (full) throw new Error('quota'); store.set(k, String(v)); }, removeItem: k => store.delete(k) };
  M.metaStore.resetForTests();
  try {
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 5, durationMs: 1, outcome: 'complete' }, 1).state);
    full = true;
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 6, durationMs: 1, outcome: 'complete' }, 2).state);
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 7, durationMs: 1, outcome: 'complete' }, 3).state);
    assert.equal(M.metaStore.get().games.mole.runs, 3);
    full = false;
    M.metaStore.update(s => M.addRun(s, 'mole', { score: 8, durationMs: 1, outcome: 'complete' }, 4).state);
    assert.equal(JSON.parse(store.get('arcade:meta:v1')).games.mole.runs, 4, 'saved in full once storage has room');
  } finally { delete globalThis.localStorage; M.metaStore.resetForTests(); }
});

test('an unchanged update notifies nobody, and an invalid record is never written', () => {
  withStorage({}, store => {
    M.metaStore.update(s => M.addProgress(s, 'jump', 'world', 3));
    let calls = 0;
    const off = M.metaStore.subscribe(() => calls++);
    M.metaStore.update(s => M.addProgress(s, 'jump', 'world', 3));
    off();
    assert.equal(calls, 0);
    const before = store.get('arcade:meta:v1');
    M.metaStore.update(s => ({ ...s, games: { ...s.games, ['x'.repeat(81)]: M.emptyRecord() } }));
    assert.equal(store.get('arcade:meta:v1'), before);
    assert.equal(M.metaStore.writeFailed(), true);
  });
});
