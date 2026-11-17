import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const { parseSettings, settingsStore, effectiveAudio, DEFAULT_SETTINGS, SETTINGS_KEY } = await loadBundle(`export * from './src/shared/kit/settings.ts';`);

function withStorage(initial, run) {
  const store = new Map(Object.entries(initial));
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  settingsStore.resetForTests();
  const done = () => { delete globalThis.localStorage; settingsStore.resetForTests(); };
  let result;
  try { result = run(store); } catch (error) { done(); throw error; }
  if (result && typeof result.then === 'function') return result.finally(done);
  done();
  return result;
}

test('broken or partly wrong settings never throw and keep every valid choice', () => {
  assert.deepEqual(parseSettings('{not json'), { ...DEFAULT_SETTINGS, games: {}, seenHelp: {} });
  const parsed = parseSettings(JSON.stringify({ v: 1, muted: true, volume: 7, motion: 'wild', hints: 'full', games: { a: { volume: -2, muted: 'yes' } } }));
  assert.equal(parsed.muted, true, 'a valid choice survives its neighbours being wrong');
  assert.equal(parsed.volume, 1, 'volume is clamped');
  assert.equal(parsed.motion, 'system');
  assert.equal(parsed.hints, 'full');
  assert.equal(parsed.games.a.volume, 0);
  assert.equal(parsed.games.a.muted, undefined);
});

test('first launch carries over the mute choices games stored on their own, without touching them', () => {
  withStorage({
    'arcade:hachuping-color-match:prefs': JSON.stringify({ difficulty: 'easy', patterns: false, muted: true }),
    'arcade:night-train:sound': JSON.stringify({ sfx: false, ambient: true }),
  }, store => {
    const settings = settingsStore.get();
    assert.equal(settings.games['hachuping-color-match'].muted, true);
    assert.deepEqual(settings.games['night-train'].extra, { sfx: false, ambient: true });
    assert.equal(store.get('arcade:night-train:sound'), JSON.stringify({ sfx: false, ambient: true }));
  });
});

test('changes are saved, merged per game and announced to subscribers', () => {
  withStorage({}, store => {
    let calls = 0;
    const off = settingsStore.subscribe(() => calls++);
    settingsStore.set({ muted: true });
    settingsStore.setGame('mole', { volume: 0.5, extra: { difficulty: 'hard' } });
    settingsStore.setGame('mole', { extra: { muted: true } });
    off();
    settingsStore.set({ volume: 0.2 });
    assert.equal(calls, 3);
    settingsStore.flush();
    const saved = JSON.parse(store.get(SETTINGS_KEY));
    assert.equal(saved.muted, true);
    assert.deepEqual(saved.games.mole, { volume: 0.5, extra: { difficulty: 'hard', muted: true } });
    settingsStore.markHelpSeen('mole-help');
    const seenAt = settingsStore.get().seenHelp['mole-help'];
    settingsStore.markHelpSeen('mole-help');
    assert.equal(settingsStore.get().seenHelp['mole-help'], seenAt, 'help is marked only once');
  });
});

test('a game plays at master volume times its own, and either switch mutes it', () => {
  const base = { ...DEFAULT_SETTINGS, volume: 0.8, games: { a: { volume: 0.5 }, b: { muted: true } } };
  assert.deepEqual(effectiveAudio(base, 'a'), { muted: false, volume: 0.4 });
  assert.deepEqual(effectiveAudio(base, 'b'), { muted: true, volume: 0 });
  assert.deepEqual(effectiveAudio({ ...base, muted: true }, 'a'), { muted: true, volume: 0 });
});

test('one bad game or help entry is dropped on its own, and over-long keys are never stored', () => {
  const long = 'x'.repeat(81);
  const parsed = parseSettings(JSON.stringify({ v: 1, games: { a: { volume: 0.5 }, [long]: { muted: true }, b: 'broken' }, seenHelp: { ok: 1, [long]: 2, bad: 'no' } }));
  assert.deepEqual(Object.keys(parsed.games), ['a']);
  assert.deepEqual(parsed.seenHelp, { ok: 1 });
  withStorage({}, () => {
    settingsStore.setGame('mole', { muted: true });
    settingsStore.setGame(long, { muted: true });
    settingsStore.markHelpSeen(long);
    assert.deepEqual(Object.keys(settingsStore.get().games), ['mole']);
    assert.deepEqual(settingsStore.get().seenHelp, {});
  });
});

test('dragging a slider writes storage once, after the changes settle', async () => {
  await withStorage({}, async store => {
    let writes = 0;
    const setItem = globalThis.localStorage.setItem;
    globalThis.localStorage.setItem = (k, v) => { writes++; setItem(k, v); };
    for (let i = 0; i <= 10; i++) settingsStore.set({ volume: i / 10 });
    assert.equal(settingsStore.get().volume, 1, 'the new value applies at once');
    assert.equal(writes, 0);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(writes, 1);
    assert.equal(JSON.parse(store.get(SETTINGS_KEY)).volume, 1);
  });
});
