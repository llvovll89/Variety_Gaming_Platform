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
  export {PauseDialog} from './src/shared/kit/PauseDialog.tsx';
  export {ResultPanel} from './src/shared/kit/ResultPanel.tsx';
  export {HelpDialog} from './src/shared/kit/HelpDialog.tsx';
  export {Stars} from './src/shared/kit/Stars.tsx';
  export {LevelGrid} from './src/shared/kit/LevelGrid.tsx';
  export {DifficultyPicker} from './src/shared/kit/DifficultyPicker.tsx';
  export {NextGameActions} from './src/shared/kit/nextGame.tsx';
  export {PlaySession} from './src/platform/PlaySession.tsx';
  export {SettingsPanel} from './src/shared/kit/SettingsPanel.tsx';
  export {KitGameContext} from './src/shared/kit/context.ts';
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

test('pause offers resume first and only the optional rows a game asks for', () => {
  const html = render(h(kit.PauseDialog, { onResume() {}, onQuit() {}, onHelp() {}, summary: '남은 시간 12초', buttons: { primary: 'mole-primary' } }));
  const labels = [...html.matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map(m => m[1]);
  assert.deepEqual(labels, ['계속하기', '게임 방법', '메뉴로']);
  assert.match(html, /class="kit-btn kit-btn-primary mole-primary"/);
  assert.match(html, /남은 시간 12초/);
});

test('a result panel shows score, stats, records and the next-game choice in a fixed order', () => {
  const session = { games: [], gameId: 'x', selectGame() {}, exit() {} };
  const panel = h(kit.ResultPanel, { titleId: 't', eyebrow: '보통', headline: '멋져요', score: { value: 1200, unit: '점', previousBest: 1000 }, stats: [{ label: '최고 연속', value: '7번' }], records: h('ol', null, h('li', null, '1위')), primary: { label: '한 번 더', onClick() {} }, secondary: [{ label: '메뉴로', onClick() {} }] });
  const html = render(h(kit.PlaySession.Provider, { value: session }, panel));
  const order = ['보통', '멋져요', '1,200', '최고 연속', '1위', '한 번 더', '메뉴로', '게임 목록으로'].map(text => html.indexOf(text));
  assert.ok(order.every(i => i >= 0), 'every part is shown');
  assert.deepEqual(order, [...order].sort((a, b) => a - b), 'in this order');
  assert.match(html, /<h2 id="t" class="kit-title">/);
  assert.match(html, /class="kit-next arcade-next"/);
});

test('help pages, stars, level grid and difficulty picker read well to screen readers', () => {
  const help = render(h(kit.HelpDialog, { pages: [{ title: '움직이기', body: '화살표' }, { title: '모으기', body: '별' }], onClose() {} }));
  assert.match(help, /게임 방법 · 1\/2/);
  assert.match(help, />다음</);
  assert.match(render(h(kit.Stars, { value: 2.7 })), /aria-label="별 3개 중 2개"/);
  const grid = render(h(kit.LevelGrid, { onSelect() {}, levels: [{ id: '1', title: '1단계', stars: 3, current: true }, { id: '2', title: '2단계', locked: true }] }));
  assert.match(grid, /aria-current="true"/);
  assert.match(grid, /<button type="button" disabled="">.*잠겨 있어요/);
  const picker = render(h(kit.DifficultyPicker, { value: 'hard', onChange() {}, options: [{ id: 'easy', label: '쉬움' }, { id: 'hard', label: '어려움', note: '5통' }] }));
  assert.match(picker, /aria-pressed="false">쉬움/);
  assert.match(picker, /aria-pressed="true">어려움<small>5통<\/small>/);
});

test('platform files never style a game by its class names', () => {
  // The kit dialog scrolls by itself; the only game names left are the legacy scroll list, which
  // shrinks as each game moves to GameDialog.
  for (const file of ['src/shared/kit/GameDialog.tsx', 'src/shared/kit/ResultPanel.tsx', 'src/shared/kit/PauseDialog.tsx', 'src/platform/PlaySession.tsx']) {
    const source = readFileSync(file, 'utf8');
    for (const prefix of GAME_PREFIXES) assert.ok(!source.includes(`.${prefix}`), `${file} mentions .${prefix}`);
  }
});

test('settings show sound everywhere, the running game only in a game, and the rest outside a pause', () => {
  const full = render(h(kit.SettingsPanel));
  for (const label of ['소리', '전체 음량', '움직임 줄이기', '진동', '힌트']) assert.ok(full.includes(label), label);
  assert.ok(!full.includes('이 게임 소리'));
  const compact = render(h(kit.SettingsPanel, { compact: true, gameId: 'mole', gameTitle: '두더지 잡기' }));
  assert.ok(compact.includes('두더지 잡기 소리') && compact.includes('두더지 잡기 음량'));
  assert.ok(!compact.includes('움직임 줄이기'));
  const pause = render(h(kit.KitGameContext.Provider, { value: { gameId: 'mole', audience: 'kids' } }, h(kit.PauseDialog, { onResume() {}, onQuit() {} })));
  assert.ok(pause.includes('이 게임 소리'), 'a pause screen inside a game offers its sound settings');
  assert.ok(!render(h(kit.PauseDialog, { onResume() {}, onQuit() {} })).includes('설정'), 'outside a game there is nothing to set');
});

test('dialogs focus their main action once open, and the kit layer sits below Tailwind and game styles', () => {
  // React focuses autoFocus before the dialog is shown, so kit dialogs mark the control instead.
  const pause = render(h(kit.PauseDialog, { onResume() {}, onQuit() {} }));
  assert.match(pause, /<button type="button" data-kit-autofocus="" class="kit-btn kit-btn-primary">계속하기/);
  assert.ok(!/autofocus=""/i.test(pause.replace(/data-kit-autofocus/g, '')), 'no React autoFocus inside kit dialogs');
  const css = readFileSync('src/index.css', 'utf8');
  const order = css.indexOf('@layer theme, base, kit, components, utilities;');
  assert.ok(order >= 0 && order < css.indexOf('@import "tailwindcss"'), 'kit is declared between Tailwind base and utilities');
});
