import test from 'node:test';
import assert from 'node:assert/strict';
import { loadBundle } from './bundle.mjs';

const { scheduleRecipe, shouldPauseForKey, createGameSound, haptic, settingsStore, audienceOf, kitOutput, isGameMuted } = await loadBundle(`
  export {audienceOf} from './src/platform/types.ts';
  export {scheduleRecipe, createGameSound, kitOutput, isGameMuted} from './src/shared/kit/sound.ts';
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
  const key = (k, extra = {}) => ({ key: k, code: k === 'p' ? 'KeyP' : undefined, target: { tagName: 'CANVAS' }, ...extra });
  assert.equal(shouldPauseForKey(key('Escape'), undefined, false), true);
  assert.equal(shouldPauseForKey(key('p'), undefined, false), true);
  assert.equal(shouldPauseForKey(key('x'), undefined, false), false);
  assert.equal(shouldPauseForKey({ key: 'ㅔ', code: 'KeyP' }, undefined, false), true, 'P with a Korean keyboard layout');
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

test('a game with its own audio follows the arcade mute and volume, live', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const store = new Map();
  globalThis.localStorage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  settingsStore.resetForTests();
  try {
    const gain = { value: 1, setTargetAtTime(v) { this.value = v; } };
    const node = { gain, connect() {} };
    const ctx = { currentTime: 0, destination: {}, createGain: () => node };
    assert.equal(kitOutput(ctx, 'balloon'), node);
    assert.equal(gain.value, 0.8, 'starts at the master volume');
    settingsStore.setGame('balloon', { volume: 0.5 });
    assert.equal(gain.value, 0.4, 'master times game volume');
    settingsStore.set({ muted: true });
    assert.equal(gain.value, 0);
    assert.equal(isGameMuted('balloon'), true);
    assert.equal(kitOutput(ctx, 'balloon'), node, 'one output per audio context');
    ctx.state = 'closed';
    const next = { currentTime: 0, destination: {}, createGain: () => ( { gain: { value: 1, setTargetAtTime() {} }, connect() {} }) };
    kitOutput(next, 'balloon');
    gain.value = 'untouched';
    settingsStore.set({ muted: false });
    assert.equal(gain.value, 'untouched', 'a closed context is forgotten, not updated forever');
  } finally { delete globalThis.localStorage; settingsStore.resetForTests(); }
  // Every game's sound goes through the arcade output, so the hub's sound switch reaches it.
  const walk = dir => readdirSync(dir).flatMap(f => statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]);
  const direct = walk('src/games').filter(f => /\.tsx?$/.test(f) && /\.destination\b/.test(readFileSync(f, 'utf8').replace(/kitOutput\([^)]*\)/g, '')));
  assert.deepEqual(direct, [], 'no game connects straight to the speakers');
});

/**
 * 모달은 네이티브 <dialog>를 쓰는 키트의 GameDialog로 연다. 손으로 짠 포커스 덫은 Tab만 막고
 * 화면 낭독기·브라우저 UI·중첩 대화상자를 놓치며, isKitDialogOpen()에 등록되지 않아 자동 일시정지가
 * 대화상자 위에서 또 울린다. 남은 두 곳은 이유가 있어 남겨 둔 것이고, 새로 늘지 않게 막는다.
 */
const HAND_ROLLED = [
  // 두 대화상자의 CSS가 겉-상자 두 겹 구조에 깊이 묶여 있다(.tk-overview>div 등 두 파일 15규칙).
  // 자체 useDialogFocus는 Escape·포커스 복귀·중첩 native dialog까지 이미 다루고, 이 게임은
  // useAutoPause를 쓰지 않아 isKitDialogOpen()이 필요 없다. 옮길 값이 아직 비용보다 작다.
  'src/games/three-kingdoms/components/DispatchDialog.tsx',
  'src/games/three-kingdoms/components/OverviewSheet.tsx',
  // 간식 설명은 모달이 아니라 인라인 말풍선이다(aria-modal 없음). 모달로 만들면 더 나빠진다.
  'src/games/night-train/NightTrainApp.tsx',
];

test('a game opens modals through the kit, not a hand-written focus trap', async () => {
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join, sep } = await import('node:path');
  const walk = dir => readdirSync(dir).flatMap(f => statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]);
  const allowed = HAND_ROLLED.map(f => f.split('/').join(sep));
  const own = walk('src/games')
    .filter(f => /\.tsx$/.test(f) && /role="dialog"/.test(readFileSync(f, 'utf8')))
    .filter(f => !allowed.includes(f));
  assert.deepEqual(own, [], 'every other modal goes through the kit GameDialog');
});

test('letter keys work with a Korean keyboard layout', async () => {
  const { keyOf } = await loadBundle(`export {keyOf} from './src/shared/kit/keys.ts';`);
  assert.equal(keyOf({ key: 'ㅈ', code: 'KeyW' }), 'w');
  assert.equal(keyOf({ key: 'W', code: 'KeyW' }), 'w');
  assert.equal(keyOf({ key: '!', code: 'Digit1' }), '!', 'Shift+1 is not 1');
  assert.equal(keyOf({ key: 'r', code: 'KeyO' }), 'r', 'Dvorak: the printed letter, not the QWERTY position');
  assert.equal(keyOf({ key: 'Process', code: 'KeyQ' }), 'q', 'IME composing');
  assert.equal(keyOf({ key: 'ArrowUp', code: 'ArrowUp' }), 'ArrowUp');
  assert.equal(keyOf({ key: 'Escape', code: 'Escape' }), 'Escape');
  assert.equal(keyOf({ key: 'a' }), 'a', 'synthetic events without a code still work');
  const { readFileSync } = await import('node:fs');
  for (const file of ['src/games/hachuping-whack-a-mole/hooks/useWhackAMoleEngine.ts', 'src/games/hachuping-dodge/survivor/SurvivorApp.tsx', 'src/games/echo-maze/EchoMazeApp.tsx', 'src/games/ghost-movers/GhostMoversApp.tsx', 'src/games/ten-seconds/TenSecondsApp.tsx', 'src/games/night-train/NightTrainApp.tsx', 'src/games/night-train/ui/CombatView.tsx']) {
    assert.ok(!/\bkey\.toLowerCase\(\)|\be\.key\.length/.test(readFileSync(file, 'utf8')), `${file} reads letters by physical key`);
  }
});
