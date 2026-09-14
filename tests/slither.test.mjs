import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Bundle the browser's extensionless TS imports into one in-memory Node module.
const compiled = await build({ stdin: { contents: `
  export * from './src/games/hachuping-slither/game/progression';
  export * from './src/games/hachuping-slither/game/snake';
  export * from './src/games/hachuping-slither/game/collision';
  export * from './src/games/hachuping-slither/game/spatialGrid';
  export * from './src/games/hachuping-slither/game/world';
`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { createProgression, awardExperience, chooseUpgrade, pendingUpgrades, statsFor, MAX_LEVEL, xpForLevel,
  createSnake, stepSnake, findStarPickups, SpatialHashGrid, World } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));

test('XP carries across multiple levels and every earned upgrade is spent exactly once', () => {
  const p = createProgression(); awardExperience(p, xpForLevel(1) + xpForLevel(2) + 3);
  assert.equal(p.level, 3); assert.equal(p.xp, 3); assert.equal(pendingUpgrades(p), 2);
  assert.equal(chooseUpgrade(p, 'magnet'), true); assert.equal(chooseUpgrade(p, 'agility'), true);
  assert.equal(chooseUpgrade(p, 'efficiency'), false); assert.equal(chooseUpgrade(p, '__proto__'), false);
  assert.deepEqual(p.upgrades, { agility: 1, magnet: 1, efficiency: 0 });
});
test('level cap stops XP growth and invalid XP cannot corrupt progression', () => {
  const p = createProgression(); for (const amount of [-4, NaN, Infinity]) awardExperience(p, amount);
  assert.deepEqual(p, createProgression()); awardExperience(p, 1e6);
  assert.equal(p.level, MAX_LEVEL); assert.equal(p.xp, 0); assert.equal(pendingUpgrades(p), MAX_LEVEL - 1);
});
test('agility changes actual movement and turn response; efficiency saves length but never drains XP', () => {
  const base = createSnake(true, 'base', 0, 0, 330, 100);
  const upgraded = createSnake(true, 'upgraded', 0, 0, 330, 100);
  for (const s of [base, upgraded]) { s.heading = 0; s.targetAngle = 1; awardExperience(s, xpForLevel(1) + xpForLevel(2)); }
  chooseUpgrade(upgraded, 'agility'); chooseUpgrade(upgraded, 'efficiency');
  const xp = upgraded.xp, level = upgraded.level;
  stepSnake(base, .1, true); stepSnake(upgraded, .1, true);
  assert.ok(upgraded.speed > base.speed); assert.ok(upgraded.heading > base.heading);
  assert.ok(upgraded.score > base.score); assert.equal(upgraded.xp, xp); assert.equal(upgraded.level, level);
  upgraded.score = 22; stepSnake(upgraded, .1, true); assert.equal(upgraded.boosting, false);
  assert.ok(statsFor(upgraded).drainMultiplier > 0);
});
test('magnet collects a formerly out-of-reach star exactly once across competing snakes', () => {
  const s = createSnake(true, 'player', 0, 0, 330, 8);
  const other = createSnake(false, 'rival', 0, 0, 80, 8);
  const grid = new SpatialHashGrid(140);
  const star = { id: 100, pos: { x: s.radius + 10, y: 0 }, radius: 4, value: 3, hue: 45 };
  grid.insert(star.id, star.pos.x, star.pos.y, star);
  assert.equal(findStarPickups([s], grid, 4).length, 0);
  awardExperience(s, xpForLevel(1)); chooseUpgrade(s, 'magnet');
  awardExperience(other, xpForLevel(1)); chooseUpgrade(other, 'magnet');
  assert.deepEqual(findStarPickups([s, other], grid, 4), [{ snakeId: s.id, starId: 100 }]);
});
test('unspent upgrades never stop movement, rival updates, or later XP collection', () => {
  const w = new World('player'); w.snakes = [w.player];
  const p = w.player, score = p.score;
  // Test the real collection path with a known star at the player position.
  w.addStar({ id: -100, pos: { ...p.head }, value: xpForLevel(1), radius: 5, hue: 45 });
  w.update(0, { angle: 0, boosting: false });
  assert.ok(p.score >= score + xpForLevel(1)); assert.ok(p.level >= 2);
  const rival = createSnake(false, 'rival', 1000, 1000, 80, 8);
  w.snakes = [p, rival];
  const time = w.time, head = { ...p.head }, rivalHead = { ...rival.head };
  w.update(.02, { angle: 0, boosting: true });
  assert.ok(w.time > time); assert.notDeepEqual(p.head, head); assert.notDeepEqual(rival.head, rivalHead);
  assert.ok(pendingUpgrades(p) > 0); assert.equal(p.boosting, true);
  const xp = p.xp;
  w.addStar({ id: -101, pos: { ...p.head }, value: 3, radius: 5, hue: 45 });
  w.update(0, { angle: 0, boosting: false }); assert.ok(p.xp >= xp + 3);
  while (pendingUpgrades(p)) chooseUpgrade(p, 'magnet');
  w.update(.01, { angle: 0, boosting: false }); assert.ok(w.time > time);
  w.respawnPlayer('again'); assert.equal(p.level, 1); assert.equal(p.xp, 0); assert.equal(p.score, 8); assert.equal(pendingUpgrades(p), 0);
});
test('early levels need sustained collection and later levels become progressively slower', () => {
  const p = createProgression(); awardExperience(p, 39);
  assert.equal(p.level, 1); awardExperience(p, 1); assert.equal(p.level, 2);
  assert.equal(xpForLevel(2), 64); assert.equal(xpForLevel(3), 96);
  for (let level = 2; level < MAX_LEVEL; level++) assert.ok(xpForLevel(level) > xpForLevel(level - 1));
});
