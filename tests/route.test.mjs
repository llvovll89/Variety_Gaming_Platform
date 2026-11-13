import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['src/platform/route.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { gameIdFromPath, gamePath, documentTitle, isPlayable } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].text).toString('base64'));

const GAMES = [
  { id: 'night-train', title: '별빛 야간열차' },
  { id: 'hachuping-memory', title: '동물 친구 기억력', releaseStatus: 'coming-soon' },
  { id: 'old-game', title: '옛 게임', disabled: true },
];

test('game links round-trip through /play/<id>', () => {
  assert.equal(gamePath('night-train'), '/play/night-train');
  assert.equal(gameIdFromPath(gamePath('night-train'), GAMES), 'night-train');
  assert.equal(gameIdFromPath('/play/night-train/', GAMES), 'night-train');
});

test('hub, unknown, unreleased and malformed links all fall back to the hub', () => {
  for (const path of ['/', '/play/', '/play/nope', '/play/hachuping-memory', '/play/old-game', '/play/%E0%A4%A', '/night-train', '/playnight-train']) {
    assert.equal(gameIdFromPath(path, GAMES), null, path);
  }
  assert.equal(isPlayable(GAMES[0]), true);
  assert.equal(isPlayable(GAMES[1]), false);
});

test('tab titles name the game', () => {
  assert.equal(documentTitle(GAMES[0]), '별빛 야간열차 · GH ARCADE');
  assert.equal(documentTitle(undefined), 'GH ARCADE');
});

test('Vercel serves the app shell for every game link', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'));
  assert.ok(config.rewrites.some(r => r.source === '/play/:path*' && r.destination === '/index.html'));
});
