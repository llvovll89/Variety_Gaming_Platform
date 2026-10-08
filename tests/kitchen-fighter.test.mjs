import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({ stdin: { contents: 'export * from "./src/games/kitchen-fighter/engine.ts"; export * from "./src/games/kitchen-fighter/controls.ts"; export * from "./src/games/kitchen-fighter/pose.ts";', resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node' });
const { Fight, movementInput, photoSize, fighterPose, WEAPON_LENGTH, WEAPONS, MOVES } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
function battle(weapon = 'spatula') { const f = new Fight('local', [weapon, 'spatula']); f.phase = 'fight'; f.fighters[0].x = 450; f.fighters[1].x = 575; return f; }
function advance(f, seconds) { for (let t = 0; t < seconds; t += .01) f.step(.01); }
test('startup, recovery and one hit per attack prevent instant or repeated damage', () => {
  const f = battle(); assert.ok(f.attack(0, 'jab')); assert.equal(f.attack(0, 'heavy'), false);
  advance(f, .08); assert.equal(f.fighters[1].hp, 100); advance(f, .2); assert.equal(f.fighters[1].hp, 94);
  advance(f, .35); assert.equal(f.fighters[1].hp, 94); assert.ok(f.attack(0, 'jab'));
});
test('standing guard blocks high attacks but low attacks require crouching guard', () => {
  const high = battle(); high.fighters[1].input.guard = true; high.attack(0, 'jab'); advance(high, .2); assert.equal(high.fighters[1].hp, 99);
  const low = battle(); low.fighters[1].input.guard = true; low.attack(0, 'low'); advance(low, .3); assert.equal(low.fighters[1].hp, 91);
  const block = battle(); block.fighters[1].input.guard = true; block.fighters[1].input.crouch = true; block.attack(0, 'low'); advance(block, .3); assert.equal(block.fighters[1].hp, 99);
});
test('sidestep and crouch dodge attacks while golf has a longer reach', () => {
  const f = battle(); f.fighters[1].z = 50; f.attack(0, 'heavy'); advance(f, .4); assert.equal(f.fighters[1].hp, 100);
  const crouch = battle(); crouch.fighters[1].input.crouch = true; crouch.attack(0, 'jab'); advance(crouch, .3); assert.equal(crouch.fighters[1].hp, 100);
  for (const weapon of ['spatula', 'golf']) { const range = battle(weapon); range.fighters[1].x = 640; range.attack(0, 'heavy'); advance(range, .5); assert.equal(range.fighters[1].hp < 100, weapon === 'golf'); }
});
test('launcher permits follow-up air hits and combo scaling', () => {
  const f = battle('swatter'); f.attack(0, 'skill'); advance(f, .7); assert.ok(f.fighters[1].air > 0);
  assert.ok(f.attack(0, 'jab')); advance(f, .2); assert.equal(f.fighters[0].combo, 2); assert.ok(f.fighters[1].hp < 87);
});
test('ultimate requires full gauge, spends it, and deals one strong hit', () => {
  const f = battle(); assert.equal(f.attack(0, 'ultimate'), false); f.fighters[0].gauge = 100;
  assert.ok(f.attack(0, 'ultimate')); assert.equal(f.fighters[0].gauge, 0); advance(f, .65); assert.equal(f.fighters[1].hp, 68);
  advance(f, .5); assert.equal(f.fighters[1].hp, 68);
});
test('two round wins finish the match and freeze attacks and time', () => {
  const f = battle(); f.fighters[1].hp = 1; f.attack(0, 'jab'); advance(f, .3);
  assert.equal(f.phase, 'roundover'); assert.equal(f.fighters[0].wins, 1); assert.equal(f.attack(0, 'jab'), false);
  advance(f, 4.5); assert.equal(f.phase, 'fight'); assert.equal(f.round, 2); assert.equal(f.fighters[1].hp, 100);
  f.fighters[1].hp = 0; f.step(.01); assert.equal(f.phase, 'matchover'); const time = f.time; advance(f, 5); assert.equal(f.time, time); assert.equal(f.fighters[0].wins, 2);
});
test('timeout ties replay the round without granting a win, and movement stays in bounds', () => {
  const f = battle(); f.time = .01; f.step(.02); assert.equal(f.winner, null); assert.equal(f.fighters[0].wins, 0);
  advance(f, 4.5); f.fighters[0].input.x = -1; f.fighters[0].input.z = 1; advance(f, 8); assert.equal(f.fighters[0].x, 90); assert.equal(f.fighters[0].z, 65);
});
test('CPU closes distance and attacks using the same combat rules', () => {
  const f = new Fight('cpu', ['spatula', 'golf'], 'normal', () => .7); f.phase = 'fight'; advance(f, 8);
  assert.ok(f.fighters[0].hp < 100); assert.ok(f.fighters[1].x < 735);
});
test('solo arrows and Q/E move player one and work while attack keys are held', () => {
  const pressed = new Set(['ArrowLeft', 'KeyQ', 'KeyJ']);
  const f = new Fight('cpu', ['spatula', 'spatula'], 'easy', () => 0); f.phase = 'fight';
  f.fighters[0].input = movementInput(code => pressed.has(code), 'cpu', 0); advance(f, .5);
  assert.ok(f.fighters[0].x < 300); assert.ok(f.fighters[0].z < -30);
  pressed.clear(); f.fighters[0].input = movementInput(code => pressed.has(code), 'cpu', 0);
  const x = f.fighters[0].x; advance(f, .2); assert.equal(f.fighters[0].x, x);
});
test('local arrows affect player two only, and alternate solo mappings cannot double movement speed', () => {
  const pressed = new Set(['ArrowRight', 'ArrowDown']); const held = code => pressed.has(code);
  assert.deepEqual(movementInput(held, 'local', 0), { x: 0, z: 0, guard: false, crouch: false, jump: false });
  assert.deepEqual(movementInput(held, 'local', 1), { x: 1, z: 0, guard: false, crouch: true, jump: false });
  pressed.add('KeyD'); pressed.add('KeyE'); assert.equal(movementInput(held, 'cpu', 0).x, 1); assert.equal(movementInput(held, 'cpu', 0).z, 1);
});
test('portrait and landscape photos preserve their full aspect ratio', () => {
  for (const [w, h] of [[300, 900], [1200, 800], [100, 100]]) {
    const fitted = photoSize(w, h); assert.ok(fitted.width <= 180); assert.ok(fitted.height <= 280);
    assert.ok(Math.abs(fitted.width / fitted.height - w / h) < 1e-9);
  }
});
test('Shift/Space guard and S crouch work together without moving in depth', () => {
  for (const guard of ['ShiftLeft', 'ShiftRight', 'Space']) {
    const pressed = new Set([guard, 'KeyS']); const input = movementInput(code => pressed.has(code), 'cpu', 0);
    assert.equal(input.guard, true); assert.equal(input.crouch, true); assert.equal(input.z, 0);
    const f = battle(); f.fighters[1].input = input; f.attack(0, 'low'); advance(f, .3); assert.equal(f.fighters[1].hp, 99);
  }
});
test('double taps dash farther than walking; recovery buffers only late attacks', () => {
  const dash = battle(), walk = battle(); for (const f of [dash, walk]) f.fighters[0].input.x = -1;
  dash.tapDirection(0, -1); advance(dash, .08); dash.tapDirection(0, -1); advance(dash, .16); advance(walk, .24);
  assert.ok(dash.fighters[0].x < walk.fighters[0].x - 25);
  const f = battle(); f.attack(0, 'jab'); f.attack(0, 'heavy', true); assert.equal(f.fighters[0].buffer, null);
  advance(f, .3); f.attack(0, 'heavy', true); assert.ok(f.fighters[0].buffer); advance(f, .16); assert.equal(f.fighters[0].action.move, 'heavy');
});
test('W jumps once per press and jumping avoids a grounded low attack', () => {
  const f = battle(); f.fighters[1].input.jump = true; advance(f, .22); assert.ok(f.fighters[1].air > 40);
  f.attack(0, 'low'); advance(f, .25); assert.equal(f.fighters[1].hp, 100);
  advance(f, 1); assert.equal(f.fighters[1].air, 0); advance(f, .3); assert.equal(f.fighters[1].air, 0);
});
test('weapon is attached to the hand and its contact pose matches combat range', () => {
  for (const weapon of ['spatula', 'swatter', 'golf']) for (const move of ['jab', 'heavy', 'low', 'skill', 'ultimate']) {
    const f = battle(weapon).fighters[0]; f.action = { move, elapsed: MOVES[move].startup * WEAPONS[weapon].speed, hit: true };
    const p = fighterPose(f); assert.equal(p.strike, 1);
    const tipX = p.hand[0] - Math.sin(p.weaponAngle) * WEAPON_LENGTH[weapon];
    assert.ok(Math.abs(tipX - (WEAPONS[weapon].range + MOVES[move].reach - 24)) < 1e-7);
  }
});
test('hitstop freezes both the attacker pose and the simulation clock', () => {
  const f = battle(); f.attack(0, 'jab'); advance(f, .11); assert.ok(f.hitstop > 0);
  const elapsed = f.elapsed, pose = fighterPose(f.fighters[0]); f.step(.01);
  assert.equal(f.elapsed, elapsed); assert.deepEqual(fighterPose(f.fighters[0]), pose);
});
test('footwork is driven by movement distance, and retreat provides standing guard', () => {
  const f = battle(); f.fighters[1].input.x = 1; const gait = f.fighters[1].gait;
  advance(f, .1); assert.ok(f.fighters[1].gait > gait);
  // Back-walking would leave jab range before startup, so retreat guard is checked from close range.
  f.fighters[1].x = 540; f.attack(0, 'jab'); advance(f, .15); assert.equal(f.fighters[1].hp, 99);
});
test('tapped sidestep bursts sideways faster than walking and dodges a straight attack', () => {
  const step = battle(), walk = battle(); assert.ok(step.sidestep(1, 1)); walk.fighters[1].input.z = 1;
  advance(step, .2); advance(walk, .2); assert.ok(step.fighters[1].z > walk.fighters[1].z + 30);
  assert.equal(step.sidestep(1, 1), true); step.attack(0, 'jab'); advance(step, .2); assert.equal(step.fighters[1].hp, 100);
});
test('knockback slides the target over several frames instead of teleporting', () => {
  const f = battle(); f.attack(0, 'jab'); advance(f, .11); const x = f.fighters[1].x; advance(f, .1);
  assert.ok(f.fighters[1].x > x); assert.ok(f.fighters[1].x - x < 25);
});
