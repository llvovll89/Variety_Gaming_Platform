import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({ stdin: { contents: `export * from './src/games/hachuping-jump/game/rewards'; export * from './src/games/hachuping-jump/game/obstacles'; export * from './src/games/hachuping-jump/game/engine'; export * from './src/games/hachuping-jump/game/stages'; export * from './src/games/hachuping-jump/game/collision';`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env.DEV': 'false' } });
const { createRewards, advanceRewards, resolveRewards, createObstacle, advanceObstacles, JumpEngine, createJourney, finishStage, hitsObstacle } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const player = (y = 300) => ({ y, vy: 0, rotation: 0, alive: true });
const obstacle = (x = 85) => ({ id: 1, x, kind: 'candy', age: 0, baseCenterY: 300, baseGapHeight: 210, gapCenterY: 300, gapHeight: 210, passed: false, star: { y: 300, collected: false }, item: null, hue: 30 });
test('stars score once, passing scores only after fully clearing obstacle', () => {
  const r = createRewards(), p = player(), o = obstacle(); resolveRewards(p, [o], r); resolveRewards(p, [o], r);
  assert.equal(r.score, 10); assert.equal(r.stars, 1); assert.equal(o.passed, false);
  o.x = 30; resolveRewards(p, [o], r); resolveRewards(p, [o], r); assert.equal(r.score, 11);
});
test('shield protects on pickup frame, expires, and bounds bounce safely', () => {
  const r = createRewards(), p = player(), pickup = obstacle(215); pickup.item = { kind: 'shield', collected: false };
  const danger = obstacle(); danger.gapCenterY = 100; danger.star = null;
  resolveRewards(p, [danger, pickup], r); assert.equal(r.shieldTime, 6); assert.equal(p.alive, true);
  p.y = 660; resolveRewards(p, [], r); assert.equal(p.y, 626); assert.ok(p.vy < 0);
  p.y = -10; resolveRewards(p, [], r); assert.equal(p.y, 14); assert.ok(p.vy > 0);
  advanceRewards(r, 6); p.y = 300; resolveRewards(p, [danger], r); assert.equal(p.alive, false);
});
test('magnet attracts nearby stars, leaves far stars, and stops after expiry', () => {
  const r = createRewards(), p = player(), pickup = obstacle(215); pickup.item = { kind: 'magnet', collected: false }; pickup.star = null;
  resolveRewards(p, [pickup], r); assert.equal(r.magnetTime, 8);
  const near = obstacle(160), far = obstacle(300); resolveRewards(p, [near, far], r); assert.equal(r.stars, 1); assert.equal(far.star.collected, false);
  advanceRewards(r, 8); resolveRewards(p, [obstacle(160)], r); assert.equal(r.stars, 1);
});
test('every run starts with shield, alternates items, and places stars in safe gaps', () => {
  for (let run = 0; run < 2; run++) for (let i = 1; i <= 10; i++) {
    const o = createObstacle(470, 145, i); assert.equal(o.star.y, o.gapCenterY);
    assert.equal(o.item?.kind ?? null, i % 2 === 1 ? ['shield','double','magnet','slow','heart','gem'][Math.floor((i - 1) / 2) % 6] : null);
  }
});
test('pause freezes actual engine timers and restarting creates clean rewards', () => {
  globalThis.window = { addEventListener() {}, removeEventListener() {} }; globalThis.Image = class {};
  const canvas = { getContext: () => ({}), addEventListener() {}, removeEventListener() {} };
  const engine = new JumpEngine(canvas, '', 0, () => {}); engine.rewards.shieldTime = 4; engine.rewards.magnetTime = 5;
  engine.pause(); engine.tick(1000); engine.tick(6000); assert.equal(engine.rewards.shieldTime, 4); assert.equal(engine.rewards.magnetTime, 5);
  engine.resume(); assert.equal(engine.lastTime, null); advanceRewards(engine.rewards, .5); assert.equal(engine.rewards.shieldTime, 3.5);
  const fresh = new JumpEngine(canvas, '', 0, () => {}); assert.deepEqual(fresh.rewards, createRewards());
  engine.stop(); fresh.stop();
});

test('double points apply to stars and gates and expire; gem awards once', () => {
  const r = createRewards(), p = player(), pickup = obstacle(215); pickup.item = {kind:'double',collected:false}; pickup.star=null;
  resolveRewards(p,[pickup],r); const o=obstacle(); resolveRewards(p,[o],r); assert.equal(r.score,20);
  o.x=30; resolveRewards(p,[o],r); assert.equal(r.score,22); assert.equal(r.gates,1);
  advanceRewards(r,8); resolveRewards(p,[obstacle()],r); assert.equal(r.score,32);
  pickup.item={kind:'gem',collected:false}; resolveRewards(p,[pickup],r); resolveRewards(p,[pickup],r); assert.equal(r.score,82);
});
test('heart absorbs one collision, grants escape protection, never stacks', () => {
  const r=createRewards(), p=player(), pickup=obstacle(215); pickup.star=null;
  for(let i=0;i<2;i++){pickup.item={kind:'heart',collected:false};resolveRewards(p,[pickup],r)}
  assert.equal(r.hearts,1); const danger=obstacle();danger.gapCenterY=100;danger.star=null;
  resolveRewards(p,[danger],r);assert.equal(r.hearts,0);assert.equal(p.alive,true);assert.equal(r.shieldTime,2);
  advanceRewards(r,2);resolveRewards(p,[danger],r);assert.equal(p.alive,false);
});
test('moving and breathing gates stay bounded and stars follow openings', () => {
  const cloud=createObstacle(300,215,1,'cloud'), crystal=createObstacle(300,215,2,'crystal');
  const center=cloud.gapCenterY; advanceObstacles([cloud,crystal],0,1);
  assert.notEqual(cloud.gapCenterY,center);assert.equal(cloud.star.y,cloud.gapCenterY);assert.notEqual(crystal.gapHeight,215);
  for(let i=0;i<400;i++){advanceObstacles([cloud,crystal],0,.03);assert.ok(cloud.gapCenterY-cloud.gapHeight/2>=60);assert.ok(crystal.gapHeight>=187);}
  const mushroom=obstacle();mushroom.kind='mushroom';assert.equal(hitsObstacle(100,mushroom),false);assert.equal(hitsObstacle(450,mushroom),true);
});
function engineForTest(callback=()=>{}) {
  globalThis.window={addEventListener(){},removeEventListener(){}};globalThis.Image=class{};
  const e=new JumpEngine({getContext:()=>({}),addEventListener(){},removeEventListener(){}},'',0,callback);e.draw=()=>{};return e;
}
test('slow candy slows world and gate animation without slowing effect countdown', () => {
  const normal=engineForTest(), slow=engineForTest();
  const pickup=obstacle(215);pickup.star=null;pickup.item={kind:'slow',collected:false};slow.player.y=300;
  resolveRewards(slow.player,[pickup],slow.rewards);assert.equal(slow.rewards.slowTime,6);
  normal.stepWorld(.5);slow.stepWorld(.5);assert.equal(slow.distanceScrolled,normal.distanceScrolled*.6);
  advanceRewards(slow.rewards,1);assert.equal(slow.rewards.slowTime,5);
});
test('four stages require eight gates each, award bonuses once and finish without death', () => {
  let completions=0;const e=engineForTest((score,won)=>{assert.equal(won,true);assert.equal(score,432);completions++});
  for(let stage=0;stage<4;stage++) {
    assert.equal(e.journey.stage,stage);
    for(let gate=0;gate<8;gate++) {const o=obstacle(30);o.star=null;e.player.y=300;e.obstacles=[o];e.resolveScoringAndCollisions();e.stepStage(.01);}
    assert.equal(e.rewards.score,(stage+1)*108);
  }
  assert.equal(e.player.alive,true);assert.equal(e.buildSnapshot().status,'won');
  e.tick(1000);e.tick(2000);e.stepStage(.1);assert.equal(completions,1);assert.equal(e.rewards.score,432);
  const reset=createJourney();assert.equal(reset.stage,0);assert.equal(finishStage(reset),false);
});
