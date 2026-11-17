import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadBundle } from './bundle.mjs';

const kit = await loadBundle(`
  export {createElement} from 'react';
  export {renderToStaticMarkup} from 'react-dom/server';
  export {GameDialog} from './src/shared/kit/GameDialog.tsx';
  export {KitStyles} from './src/shared/kit/KitStyles.tsx';
  export {kitCss} from './src/shared/kit/kitCss.ts';
  export {createSnapshotStore} from './src/shared/kit/snapshotStore.ts';
`);
const { createElement: h, renderToStaticMarkup: render } = kit;

// Short class prefixes the games use for their own styles. The kit must stay game-agnostic.
const GAME_PREFIXES = ['mole-', 'jump-', 'balloon-', 'survivor-', 'kf-', 'maze-', 'tk-', 'tkw-', 'cm-', 'ft-', 'gm-', 'ts-', 'nt-', 'slither-'];

test('a dialog renders as a labelled native dialog that keeps the game classes', () => {
  const html = render(h(kit.GameDialog, { label: '일시정지', onClose() {}, className: 'mole-dialog' }, h('p', null, '잠깐')));
  assert.match(html, /^<dialog class="kit-dialog mole-dialog" aria-label="일시정지">/);
  assert.equal(render(h(kit.GameDialog, { open: false, label: 'x', onClose() {} }, 'hidden')), '');
});

test('the kit stylesheet never names a game and stays overridable', () => {
  for (const prefix of GAME_PREFIXES) assert.ok(!kit.kitCss.includes(`.${prefix}`), `kitCss mentions .${prefix}`);
  assert.match(kit.kitCss, /^@layer kit\{/);
  assert.match(render(h(kit.KitStyles)), /^<style data-kit="">@layer kit/);
});

test('the snapshot store only notifies on a real change', () => {
  const store = kit.createSnapshotStore({ score: 0 });
  let calls = 0;
  const off = store.subscribe(() => calls++);
  const same = store.getSnapshot();
  store.publish(same);
  store.publish({ score: 1 });
  off();
  store.publish({ score: 2 });
  assert.equal(calls, 1);
  assert.equal(store.getSnapshot().score, 2);
});

test('platform files never style a game by its class names', () => {
  // NextGameActions used to scroll specific game panels by naming them; the kit dialog does that now.
  const source = readFileSync('src/shared/kit/GameDialog.tsx', 'utf8');
  for (const prefix of GAME_PREFIXES) assert.ok(!source.includes(`.${prefix}`));
});
