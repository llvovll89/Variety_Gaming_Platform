import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const M = await loadBundle(`
  export * from './src/platform/meta/records.ts';
  export * from './src/platform/meta/daily.ts';
`);

const templates = [
  { id: 'score', label: '{difficulty}에서 {n}점 넘기', stat: 'score', range: [100, 300], step: 50, difficulty: [{ id: 'easy', label: '쉬움' }, { id: 'hard', label: '어려움' }] },
  { id: 'combo', label: '{n}콤보 만들기', stat: 'combo', range: [5, 15], step: 5 },
];

test('dates are local days, so the day does not change at 9am in Korea', () => {
  assert.equal(M.localDateKey(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
  assert.equal(M.localDateKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  assert.equal(M.daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.equal(M.daysBetween('2028-02-28', '2028-03-01'), 2, 'leap year');
});

test('the same day always gives the same challenge, with a goal on the step grid', () => {
  const a = M.dailyChallenge('2026-11-17', 'mole', templates);
  assert.deepEqual(M.dailyChallenge('2026-11-17', 'mole', templates), a);
  const seen = new Set();
  for (let day = 1; day <= 28; day++) {
    const c = M.dailyChallenge(`2026-02-${String(day).padStart(2, '0')}`, 'mole', templates);
    seen.add(c.id.split(':')[2]);
    const t = templates.find(x => x.id === c.id.split(':')[2]);
    assert.ok(c.goal >= t.range[0] && c.goal <= t.range[1] && (c.goal - t.range[0]) % t.step === 0, c.label);
    assert.ok(!c.label.includes('{'), 'every placeholder is filled');
  }
  assert.equal(seen.size, 2, 'over a month both templates come up');
  assert.equal(M.dailyChallenge('2026-11-17', 'none', undefined), null);
});

test('the hub picks one kids, one short and one long game, spread over the year', () => {
  const candidates = [
    { id: 'k1', audience: 'kids', minutes: 1 }, { id: 'k2', audience: 'kids', minutes: 1 },
    { id: 's1', audience: 'general', minutes: 3 }, { id: 's2', audience: 'general', minutes: 5 },
    { id: 'l1', audience: 'general', minutes: 20 }, { id: 'l2', audience: 'general', minutes: 30 },
  ];
  const counts = {};
  for (let d = 0; d < 365; d++) {
    const date = M.localDateKey(new Date(2026, 0, 1 + d));
    const picks = M.featuredDailies(date, candidates);
    assert.equal(picks.length, 3);
    assert.ok(picks[0].startsWith('k') && picks[1].startsWith('s') && picks[2].startsWith('l'));
    for (const id of picks) counts[id] = (counts[id] ?? 0) + 1;
  }
  for (const id of ['k1', 'k2', 's1', 's2', 'l1', 'l2']) assert.ok(counts[id] > 120, `${id} picked ${counts[id]} times`);
});

test('a challenge that asks for a win is not met by a fast loss', () => {
  // "N턴 안에 승리" reads the same number from a quick defeat, so the outcome has to be checked too.
  const c = { id: 'd:card:tower', date: '2026-11-17', gameId: 'card', label: '', stat: 'turns', goal: 8, compare: 'atMost', mode: 'tower', outcome: 'win', seed: 1, seeded: false };
  const run = extra => ({ mode: 'tower', stats: { turns: 5 }, durationMs: 1, ...extra });
  assert.equal(M.meetsChallenge(c, run({ outcome: 'lose' })).matches, false);
  assert.equal(M.meetsChallenge(c, run({ outcome: 'complete' })).matches, false);
  assert.deepEqual(M.meetsChallenge(c, run({ outcome: 'win' })), { matches: true, value: 5, done: true });
  // Without the field, any ending still counts, as it did before.
  assert.equal(M.meetsChallenge({ ...c, outcome: undefined }, run({ outcome: 'lose' })).done, true);
});

test('the outcome a template asks for reaches the day challenge', () => {
  const win = M.dailyChallenge('2026-11-17', 'card', [{ id: 'w', label: '{n}턴 안에 승리', stat: 'turns', range: [6, 10], step: 1, compare: 'atMost', outcome: 'win' }]);
  assert.equal(win.outcome, 'win');
  assert.equal(M.dailyChallenge('2026-11-17', 'mole', templates).outcome, undefined);
});

test('a run completes the daily challenge only on the right difficulty, and counts once', () => {
  const c = { id: 'd:mole:score', date: '2026-11-17', gameId: 'mole', label: '', stat: 'score', goal: 200, compare: 'atLeast', difficulty: 'hard', seed: 1, seeded: false };
  let s = M.emptyMeta();
  assert.equal(M.addDailyRun(s, c, { difficulty: 'easy', score: 999, durationMs: 1, outcome: 'complete' }).result, undefined);
  let r = M.addDailyRun(s, c, { difficulty: 'hard', score: 150, durationMs: 1, outcome: 'complete' });
  assert.deepEqual([r.result.completed, r.result.justCompleted], [false, false]);
  s = r.state;
  r = M.addDailyRun(s, c, { difficulty: 'hard', score: 230, durationMs: 1, outcome: 'complete' });
  assert.deepEqual([r.result.completed, r.result.justCompleted], [true, true]);
  s = r.state;
  r = M.addDailyRun(s, c, { difficulty: 'hard', score: 100, durationMs: 1, outcome: 'complete' });
  assert.deepEqual([r.result.completed, r.result.justCompleted, r.state.daily['2026-11-17'].mole.best], [true, false, 230]);
  assert.equal(r.state.games.mole.dailyDone, 1);
  const times = { ...c, stat: 'time', goal: 60, compare: 'atMost', difficulty: undefined };
  assert.equal(M.addDailyRun(M.emptyMeta(), times, { score: 1, stats: { time: 55 }, durationMs: 1, outcome: 'win' }).result.completed, true);
});

test('only the last two weeks of daily results are kept', () => {
  let s = M.emptyMeta();
  for (let d = 1; d <= 20; d++) {
    const date = `2026-03-${String(d).padStart(2, '0')}`;
    s = M.addDailyRun(s, { id: date, date, gameId: 'g', label: '', stat: 'score', goal: 1, compare: 'atLeast', seed: 1, seeded: false }, { score: 5, durationMs: 1, outcome: 'complete' }).state;
  }
  assert.equal(Object.keys(s.daily).length, 14);
  assert.ok(s.daily['2026-03-20'] && !s.daily['2026-03-06']);
  assert.equal(s.games.g.dailyDone, 20, 'completions are still counted');
});

test('the streak grows day by day, resets after a gap, and ignores runs that end at once', () => {
  const real = { durationMs: 30000, outcome: 'lose' };
  let s = M.emptyMeta();
  assert.equal(M.addStreakDay(s, '2026-12-30', { durationMs: 3000, outcome: 'quit' }).streak.days, 0, 'a three-second quit does not count');
  let r = M.addStreakDay(s, '2026-12-30', real); s = r.state;
  assert.deepEqual(r.streak, { days: 1, extendedToday: true });
  r = M.addStreakDay(s, '2026-12-30', real); s = r.state;
  assert.deepEqual(r.streak, { days: 1, extendedToday: false }, 'once a day');
  r = M.addStreakDay(s, '2026-12-31', real); s = r.state;
  r = M.addStreakDay(s, '2027-01-01', real); s = r.state;
  assert.equal(r.streak.days, 3, 'across the new year');
  r = M.addStreakDay(s, '2027-01-04', { durationMs: 1000, outcome: 'complete' }); s = r.state;
  assert.equal(r.streak.days, 1, 'a gap starts over (a finished short run still counts)');
  assert.equal(s.days.bestStreak, 3);
  assert.deepEqual(s.days.recent, ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-04']);
});

test('a run without the stat never becomes a perfect best, and days after today are dropped', () => {
  const times = { id: 't', date: '2026-11-17', gameId: 'maze', label: '', stat: 'time', goal: 60, compare: 'atMost', seed: 1, seeded: false };
  let s = { ...M.emptyMeta(), daily: { '2027-05-01': { maze: { done: true, best: 1 } } } };
  s = M.addDailyRun(s, times, { durationMs: 1, outcome: 'lose' }).state;
  assert.equal(s.daily['2026-11-17'].maze.best, null);
  s = M.addDailyRun(s, times, { stats: { time: 45 }, durationMs: 1, outcome: 'win' }).state;
  assert.equal(s.daily['2026-11-17'].maze.best, 45);
  assert.equal(s.daily['2027-05-01'], undefined, 'a day from a clock that was ahead is not kept forever');
  for (let d = 1; d <= 20; d++) {
    const date = `2026-03-${String(d).padStart(2, '0')}`;
    const c = { ...times, id: date, date };
    s = M.addDailyRun(s, c, { stats: { time: 1 }, durationMs: 1, outcome: 'win' }).state;
    s = M.addDailyRun(s, c, { stats: { time: 2 }, durationMs: 1, outcome: 'win' }).state;
  }
  assert.equal(Object.keys(s.daily).length, 14, 'a second run on the same day still keeps 14 days');
});

test('a clock that goes back a day keeps the streak instead of resetting it', () => {
  const real = { durationMs: 30000, outcome: 'lose' };
  let s = M.emptyMeta();
  for (const day of ['2026-11-16', '2026-11-17', '2026-11-18']) s = M.addStreakDay(s, day, real).state;
  const back = M.addStreakDay(s, '2026-11-17', real);
  assert.deepEqual(back.streak, { days: 3, extendedToday: false });
  assert.equal(back.state.days.last, '2026-11-18');
});

test('a challenge run that ends after midnight keeps today\'s results', () => {
  const day = (date, gameId) => ({ id: `${date}:${gameId}:s`, date, gameId, label: '', stat: 'score', goal: 1, compare: 'atLeast', seed: 1, seeded: false });
  let s = M.addDailyRun(M.emptyMeta(), day('2026-11-18', 'memory'), { score: 5, durationMs: 1, outcome: 'complete' }, '2026-11-18').state;
  s = M.addDailyRun(s, day('2026-11-17', 'mole'), { score: 5, durationMs: 1, outcome: 'complete' }, '2026-11-18').state;
  assert.equal(s.daily['2026-11-18'].memory.done, true, 'today stays');
  assert.equal(s.daily['2026-11-17'].mole.done, true, 'yesterday is recorded');
});

test('an old challenge day is kept with its completion, so it is never counted twice', () => {
  let s = M.emptyMeta();
  for (let d = 1; d <= 20; d++) {
    const date = `2026-04-${String(d).padStart(2, '0')}`;
    s.daily = { ...s.daily, [date]: { other: { done: false, best: null } } };
  }
  const old = { id: 'o', date: '2026-04-02', gameId: 'mole', label: '', stat: 'score', goal: 1, compare: 'atLeast', seed: 1, seeded: false };
  s = M.addDailyRun(s, old, { score: 5, durationMs: 1, outcome: 'complete' }, '2026-04-20').state;
  s = M.addDailyRun(s, old, { score: 5, durationMs: 1, outcome: 'complete' }, '2026-04-20').state;
  assert.equal(s.games.mole.dailyDone, 1);
  assert.equal(Object.keys(s.daily).length, 14);
});

test('pickDaily replays one of the player\'s own levels: same all day, nothing from an empty list', () => {
  assert.equal(M.pickDaily(12345, []), undefined);
  assert.equal(M.pickDaily(7, [0, 3, 5]), M.pickDaily(7, [0, 3, 5]));
  assert.ok([0, 3, 5].includes(M.pickDaily(4294967295, [0, 3, 5])));
});
