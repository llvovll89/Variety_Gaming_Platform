import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const { scheduleRecipe, shouldPauseForKey, createGameSound, haptic, settingsStore, audienceOf } = await loadBundle(`
  export {audienceOf} from './src/platform/types.ts';
  export {scheduleRecipe, createGameSound} from './src/shared/kit/sound.ts';
  export {shouldPauseForKey} from './src/shared/kit/useAutoPause.ts';
  export {haptic} from './src/shared/kit/haptics.ts';
  export {settingsStore} from './src/shared/kit/settings.ts';
`);

test('a recipe becomes voices at the right times, pitch and level', () => {
  const voices = scheduleRecipe([{ f: 400, to: 800, dur: 0.1, gain: 2 }, { kind: 'noise', dur: 0.2, at: 0.05, filter: 'bandpass', freq: 1000 }], 10, 1.5);
  assert.deepEqual(voices[0], { kind: 'tone', start: 10, end: 10.1, peak: 1, attack: 0.005, type: 'sine', from: 600, to: 1200 });
  assert.equal(voices[1].kind, 'noise');
  assert.equal(voices[1].start, 10.05);
  assert.equal(voices[1].from, 1500);
  assert.ok(voices[1].end > voices[1].start);
});

test('Escape and P pause, but not while typing, holding a key, using shortcuts or inside a dialog', () => {
  const key = (k, extra = {}) => ({ key: k, target: { tagName: 'CANVAS' }, ...extra });
  assert.equal(shouldPauseForKey(key('Escape'), undefined, false), true);
  assert.equal(shouldPauseForKey(key('p'), undefined, false), true);
  assert.equal(shouldPauseForKey(key('x'), undefined, false), false);
  assert.equal(shouldPauseForKey(key('p', { target: { tagName: 'INPUT' } }), undefined, false), false);
  assert.equal(shouldPauseForKey(key('p', { composedPath: () => [{ tagName: 'TEXTAREA' }] }), undefined, false), false, 'a field inside a shadow root');
  assert.equal(shouldPauseForKey(key('Escape', { repeat: true }), undefined, false), false);
  assert.equal(shouldPauseForKey(key('p', { ctrlKey: true }), undefined, false), false);
  assert.equal(shouldPauseForKey(key('Escape'), undefined, true), false);
  assert.equal(shouldPauseForKey(key('Escape'), [], false), false);
});

test('sound and vibration are silent where the browser cannot play them, and follow the settings', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  settingsStore.resetForTests();
  try {
    const sound = createGameSound('test', { pop: [{ f: 500, dur: 0.1 }] });
    assert.doesNotThrow(() => { sound.unlock(); sound.play('pop'); });
    assert.equal(sound.bus(), null);
    const calls = [];
    Object.defineProperty(globalThis, 'navigator', { value: { vibrate: p => calls.push(p) }, configurable: true });
    haptic(20);
    settingsStore.set({ haptics: false });
    haptic(40);
    assert.deepEqual(calls, [20]);
  } finally { delete globalThis.localStorage; settingsStore.resetForTests(); }
});

test('kids games are found from their genre unless a game says otherwise', () => {
  assert.equal(audienceOf({ genres: ['키즈', '캐주얼'] }), 'kids');
  assert.equal(audienceOf({ genres: ['액션'] }), 'general');
  assert.equal(audienceOf({ genres: ['액션'], audience: 'kids' }), 'kids');
});
