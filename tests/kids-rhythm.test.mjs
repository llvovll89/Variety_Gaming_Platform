import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['src/games/kids-rhythm/engine.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const E = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const { LANES, PERFECT_MS, GOOD_MS, LEVELS, LEVEL_IDS, isLevel, createSong, startPlay, tap, settle, gradeFor, maxScore, praise, isOver } = E;

/** A plain repeatable source of numbers, so a chart is the same every run. */
const seeded = (seed = 1) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const songOf = (level = 'easy', seed = 1) => createSong(seeded(seed), LEVELS[level]);

test('a chart stays inside its lanes, moves forward in time and never sits on one animal', () => {
  for (const id of LEVEL_IDS) {
    const song = songOf(id, 9);
    assert.ok(song.notes.length > 10, `${id}: ${song.notes.length} notes`);
    let run = 1;
    for (const [i, note] of song.notes.entries()) {
      assert.ok(note.lane >= 0 && note.lane < LANES, `${id}: lane ${note.lane}`);
      assert.ok(note.time > 0 && note.time < song.durationMs, `${id}: ${note.time} inside the song`);
      if (i === 0) continue;
      assert.ok(note.time >= song.notes[i - 1].time, `${id}: notes are in time order`);
      run = note.lane === song.notes[i - 1].lane ? run + 1 : 1;
      assert.ok(run <= 3, `${id}: at most three in a row on one animal`);
    }
    // Every lane is used, so a child cannot win by holding one button.
    assert.equal(new Set(song.notes.map(n => n.lane)).size, LANES, `${id}: all three animals play`);
  }
});

test('the same seed writes the same song, a different one writes another', () => {
  assert.deepEqual(songOf('easy', 42).notes, songOf('easy', 42).notes);
  assert.notDeepEqual(songOf('easy', 42).notes, songOf('easy', 43).notes);
});

test('the judging windows are generous and symmetric', () => {
  assert.equal(gradeFor(0), 'perfect');
  assert.equal(gradeFor(PERFECT_MS), 'perfect');
  assert.equal(gradeFor(-PERFECT_MS), 'perfect');
  assert.equal(gradeFor(PERFECT_MS + 1), 'good');
  assert.equal(gradeFor(-GOOD_MS), 'good');
  assert.equal(gradeFor(GOOD_MS + 1), 'miss');
});

test('a tap takes the nearest note in that lane, and only once', () => {
  const song = songOf('easy', 5);
  const note = song.notes[0];
  let state = startPlay(song);

  const early = tap(state, note.lane, note.time - PERFECT_MS + 10);
  assert.equal(early.grade, 'perfect');
  assert.equal(early.note.id, note.id);
  state = early.state;
  assert.equal(state.score, 2);
  assert.equal(state.combo, 1);

  // The same note cannot be scored twice; a second tap finds nothing there.
  const again = tap(state, note.lane, note.time);
  assert.equal(again.grade, null);
  assert.equal(again.state, state, 'nothing changes at all');
});

test('tapping nothing costs nothing, because a child will drum on the buttons', () => {
  const song = songOf('easy', 5);
  let state = tap(startPlay(song), 0, 0).state;
  for (let i = 0; i < 20; i++) state = tap(state, i % LANES, 999999).state;
  assert.equal(state.score, 0);
  assert.equal(state.missed, 0);
  assert.equal(state.combo, 0);
});

test('a note that goes by is missed once, and the run of hits starts over', () => {
  const song = songOf('easy', 3);
  const [first, second] = song.notes;
  let state = tap(startPlay(song), first.lane, first.time).state;
  assert.equal(state.combo, 1);

  state = settle(state, second.time + GOOD_MS + 1);
  assert.equal(state.missed, 1, 'only the second note is gone');
  assert.equal(state.combo, 0, 'the run of hits is broken');
  assert.equal(state.bestCombo, 1, 'but the best run is remembered');

  // Settling again over the same stretch must not count that note a second time.
  const twice = settle(state, second.time + GOOD_MS + 1);
  assert.equal(twice.missed, 1);
  assert.equal(settle(twice, second.time + GOOD_MS + 2).missed, 1);
});

test('a note already hit is never turned into a miss by settling', () => {
  const song = songOf('easy', 7);
  const note = song.notes[0];
  let state = tap(startPlay(song), note.lane, note.time).state;
  state = settle(state, note.time + GOOD_MS + 50);
  assert.equal(state.missed, 0);
  assert.equal(state.perfect, 1);
});

test('a perfect run scores two a note, and the song is as long as the chart', () => {
  for (const id of LEVEL_IDS) {
    const song = songOf(id, 11);
    let state = startPlay(song);
    for (const note of song.notes) state = tap(state, note.lane, note.time).state;
    assert.equal(state.score, maxScore(song));
    assert.equal(state.perfect, song.notes.length);
    assert.equal(state.bestCombo, song.notes.length);
    assert.equal(state.missed, 0);
    assert.equal(isOver(state, song.durationMs), true);
    assert.equal(isOver(state, song.durationMs - 1), false);
  }
});

test('the closing line counts what the child did, never what they missed', () => {
  const song = songOf('easy', 2);
  const none = startPlay(song);
  const all = song.notes.reduce((s, n) => tap(s, n.lane, n.time).state, startPlay(song));
  for (const line of [praise(none), praise(all)]) {
    assert.ok(line.length > 0);
    assert.doesNotMatch(line, /놓|틀|실패|아쉽/, `"${line}" says nothing about missing`);
  }
  assert.notEqual(praise(none), praise(all));
});

test('only the two speeds are real speeds', () => {
  for (const id of LEVEL_IDS) assert.equal(isLevel(id), true);
  for (const value of ['hard', '', null, undefined, 3, 'Easy']) assert.equal(isLevel(value), false, String(value));
  // 보통 asks for more taps than 천천히, which is what makes it the harder one.
  assert.ok(songOf('normal', 4).notes.length > songOf('easy', 4).notes.length);
});
