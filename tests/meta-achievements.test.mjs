import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const M = await loadBundle(`
  export * from './src/platform/meta/records.ts';
  export * from './src/platform/meta/achievements.ts';
`);

const record = { runs: 4, wins: 2, playMs: 0, lastPlayed: 0, best: { 'default|hard': 150, 'default|easy': 300 }, totals: { hits: 90, daily: 99 }, peaks: { combo: 12 }, progress: { world: 3 }, dailyDone: 3 };

test('every rule kind measures the right number', () => {
  const cases = [
    [{ kind: 'runs', atLeast: 5 }, 4, false],
    [{ kind: 'wins', atLeast: 2 }, 2, true],
    [{ kind: 'best', atLeast: 200 }, 300, true],
    [{ kind: 'best', atLeast: 200, difficulty: 'hard' }, 150, false],
    [{ kind: 'peak', stat: 'combo', atLeast: 10 }, 12, true],
    [{ kind: 'total', stat: 'hits', atLeast: 100 }, 90, false],
    [{ kind: 'progress', key: 'world', atLeast: 3 }, 3, true],
    [{ kind: 'daily', atLeast: 3 }, 3, true], // completed challenges, not a game stat that happens to be named 'daily'
  ];
  for (const [rule, current, met] of cases) {
    const p = M.ruleProgress(rule, record, 'high');
    assert.deepEqual([p.current, p.met], [current, met], JSON.stringify(rule));
  }
  assert.equal(M.ruleProgress({ kind: 'manual' }, record), null);
  assert.equal(M.ruleProgress({ kind: 'runs', atLeast: 1 }, undefined).met, false, 'a game never played meets nothing');
});

test('for lower-is-better scores, a best rule means this fast or faster', () => {
  const times = { ...record, best: { 'default|-': 55 } };
  assert.equal(M.ruleProgress({ kind: 'best', atLeast: 60 }, times, 'low').met, true);
  assert.equal(M.ruleProgress({ kind: 'best', atLeast: 50 }, times, 'low').met, false);
  assert.equal(M.ruleProgress({ kind: 'best', atLeast: 60 }, { ...times, best: {} }, 'low').met, false, 'no time yet is not a fast time');
});

test('achievements unlock once, keep their first time, and manual ones only on request', () => {
  const defs = [
    { id: 'first', title: '첫 판', description: '', tier: 1, rule: { kind: 'runs', atLeast: 1 } },
    { id: 'pro', title: '고수', description: '', tier: 3, rule: { kind: 'best', atLeast: 1000 } },
    { id: 'secret', title: '비밀', description: '', tier: 2, rule: { kind: 'manual' } },
  ];
  let s = M.addRun(M.emptyMeta(), 'mole', { score: 10, durationMs: 1, outcome: 'complete' }, 1).state;
  const first = M.evaluate(s, 'mole', defs, 'high', 100);
  assert.deepEqual(first.unlocked.map(a => a.id), ['first']);
  s = first.state;
  const again = M.evaluate(s, 'mole', defs, 'high', 200);
  assert.equal(again.unlocked.length, 0);
  assert.equal(again.state, s, 'nothing new leaves the state untouched');
  assert.equal(s.achievements['mole/first'], 100);
  assert.deepEqual(M.unlockManual(s, 'mole', defs, 'secret', 300).unlocked.map(a => a.id), ['secret']);
  assert.equal(M.unlockManual(s, 'mole', defs, 'nope', 300).state, s);
});
