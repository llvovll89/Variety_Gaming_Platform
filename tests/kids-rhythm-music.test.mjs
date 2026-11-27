import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['src/games/kids-rhythm/music.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const M = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const engine = await build({ entryPoints: ['src/games/kids-rhythm/engine.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const E = await import('data:text/javascript;base64,' + Buffer.from(engine.outputFiles[0].text).toString('base64'));
const { cuesBetween, chordAt, beatMs, COUNT_IN } = M;
const { LEVELS, LEVEL_IDS, LEAD_IN_MS, createSong } = E;

const seeded = (seed = 1) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

test('every note lands on a beat or half beat the backing track plays', () => {
  for (const id of LEVEL_IDS) {
    const song = createSong(seeded(4), LEVELS[id]);
    const cues = cuesBetween(id, LEVELS[id].beats, 0, song.durationMs);
    const grid = new Set(cues.filter(c => c.id !== 'count').map(c => Math.round(c.at)));
    for (const note of song.notes) assert.ok(grid.has(note.time), `${id}: note at ${note.time} has a beat under it`);
  }
});

test('the count-in is three clicks that start at or after zero and end before the first beat', () => {
  for (const id of LEVEL_IDS) {
    const counts = cuesBetween(id, LEVELS[id].beats, 0, LEAD_IN_MS).filter(c => c.id === 'count');
    assert.equal(counts.length, COUNT_IN, `${id}: ${counts.length} clicks`);
    assert.ok(counts.every(c => c.at >= 0 && c.at < LEAD_IN_MS));
  }
});

test('scheduling in slices plays each cue exactly once', () => {
  const id = 'normal';
  const whole = cuesBetween(id, LEVELS[id].beats, 0, 60000);
  const sliced = [];
  for (let t = 0; t < 60000; t += 137) sliced.push(...cuesBetween(id, LEVELS[id].beats, t, t + 137));
  assert.deepEqual(sliced, whole);
});

test('the backing stops with the song and walks the four-chord loop bar by bar', () => {
  const id = 'easy';
  const beat = beatMs(id);
  const cues = cuesBetween(id, LEVELS[id].beats, 0, 1e9);
  assert.ok(cues.every(c => c.at < LEAD_IN_MS + LEVELS[id].beats * beat));
  assert.deepEqual([0, 4, 8, 12, 16].map(b => chordAt(id, LEAD_IN_MS + b * beat + 1)), [0, 1, 2, 3, 0]);
  assert.equal(chordAt(id, 0), 0, 'before the first beat it is the first chord');
});
