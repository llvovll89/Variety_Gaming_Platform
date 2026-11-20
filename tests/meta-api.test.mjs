import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const M = await loadBundle(`
  export {createElement} from 'react';
  export {renderToStaticMarkup} from 'react-dom/server';
  export * from './src/platform/meta/api.ts';
  export {metaStore} from './src/platform/meta/store.ts';
  export {PlaySession} from './src/platform/playSessionContext.ts';
`);

const meta = {
  achievements: [
    { id: 'first', title: '첫 판', description: '한 판 하기', tier: 1, kids: { title: '첫 스티커', sticker: '🌟' }, rule: { kind: 'runs', atLeast: 1 } },
    { id: 'world3', title: '세 번째 세계', description: '', tier: 2, rule: { kind: 'progress', key: 'world', atLeast: 3 } },
    { id: 'secret', title: '비밀', description: '', tier: 3, rule: { kind: 'manual' } },
  ],
  daily: [{ id: 'score', label: '{n}점 넘기', stat: 'score', range: [100, 100], step: 10 }],
};

function withStorage(run) {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  M.metaStore.resetForTests();
  try { return run(store); } finally { delete globalThis.localStorage; M.metaStore.resetForTests(); }
}

test('one report gives the result screen everything a run earned', () => {
  withStorage(store => {
    let day = new Date(2026, 10, 17, 20, 0);
    const api = M.createRecordsApi('jump', meta, () => day);
    assert.equal(api.daily().label, '100점 넘기');
    const first = api.reportRun({ score: 120, durationMs: 45000, outcome: 'lose' });
    assert.deepEqual([first.newBest, first.previousBest, first.best], [false, null, 120], 'a first record, not a new best');
    assert.deepEqual(first.unlocked.map(a => [a.id, a.kids?.sticker]), [['first', '🌟']]);
    assert.deepEqual(first.daily, { id: '2026-11-17:jump:score', label: '100점 넘기', completed: true, justCompleted: true });
    assert.deepEqual(first.streak, { days: 1, extendedToday: true });
    const second = api.reportRun({ score: 80, durationMs: 45000, outcome: 'lose' });
    assert.deepEqual([second.newBest, second.previousBest, second.best, second.unlocked.length, second.daily.justCompleted], [false, 120, 120, 0, false]);
    day = new Date(2026, 10, 18, 9, 30);
    assert.equal(api.reportRun({ score: 10, durationMs: 45000, outcome: 'lose' }).streak.days, 2, 'next day extends the streak');
    assert.deepEqual(api.reportProgress('world', 3).map(a => a.id), ['world3']);
    assert.deepEqual(api.unlock('secret').map(a => a.id), ['secret']);
    assert.deepEqual(api.unlock('secret'), [], 'once');
    assert.equal(api.best(), 120);
    assert.deepEqual([api.record().runs, api.record().progress.world], [3, 3], 'the whole record, for games that unlock things');
    assert.equal(M.createRecordsApi('nobody', undefined).record(), null);
    assert.equal(JSON.parse(store.get('arcade:meta:v1')).games.jump.runs, 3, 'saved');
  });
});

test('outside the arcade shell a game can still call the API safely', () => {
  let seen;
  function Probe() { seen = M.useRecords(); return null; }
  M.renderToStaticMarkup(M.createElement(Probe));
  assert.equal(seen, M.offlineRecords);
  assert.deepEqual(seen.reportRun({ score: 1, durationMs: 1, outcome: 'win' }).unlocked, []);
  const records = M.createRecordsApi('x', undefined);
  M.renderToStaticMarkup(M.createElement(M.PlaySession.Provider, { value: { games: [], gameId: 'x', selectGame() {}, exit() {}, records } }, M.createElement(Probe)));
  assert.equal(seen, records);
});

test('a daily run that ends after midnight counts for the day it began', () => {
  withStorage(() => {
    let now = new Date(2026, 10, 17, 23, 59);
    const api = M.createRecordsApi('jump', meta, () => now);
    const started = api.daily();
    now = new Date(2026, 10, 18, 0, 1);
    const rewards = api.reportRun({ score: 150, durationMs: 120000, outcome: 'lose', dailyId: started.id });
    assert.equal(rewards.daily.id, started.id);
    assert.equal(M.metaStore.get().daily['2026-11-17'].jump.done, true);
  });
});

test('reportPlay counts play time and the streak, never a run', () => {
  withStorage(() => {
    const day = new Date(2026, 10, 17, 20, 0);
    const api = M.createRecordsApi('jump', meta, () => day);
    assert.deepEqual(api.reportPlay(5000), { days: 0, extendedToday: false }, 'a few seconds do not stamp the day');
    assert.deepEqual(api.reportPlay(30000), { days: 1, extendedToday: true });
    const record = api.record();
    assert.deepEqual([record.runs, record.playMs, Object.keys(M.metaStore.get().achievements).length], [0, 35000, 0]);
    // 나중에 그 run이 끝나면 이미 보고한 35초는 다시 더하지 않는다.
    api.reportRun({ score: 10, durationMs: 50000, reportedMs: 35000, outcome: 'lose' });
    assert.deepEqual([api.record().runs, api.record().playMs], [1, 50000]);
  });
});
