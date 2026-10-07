import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({stdin:{contents:`export * from "./src/games/hachuping-balloon/game/engine.ts"; export * from "./src/games/hachuping-balloon/game/balloons.ts"; export * from "./src/games/hachuping-balloon/game/renderer.ts";`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.DEV':'false'}});
const {BalloonEngine,spawnBalloon,advanceBalloons,findBalloonsAtPoint,computeLetterboxTransform,toLogical} = await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
globalThis.window={matchMedia:()=>({matches:false})};
globalThis.Image=class{complete=false;naturalWidth=0;};
function engine(){
 const gradient={addColorStop(){}};
 const context=new Proxy({}, {get:(_o,p)=>p==='createLinearGradient'||p==='createRadialGradient'?()=>gradient:()=>{},set:()=>true});
 const canvas={getContext:()=>context,style:{}};
 const e=new BalloonEngine(canvas,'/mascot.png',8);e.resize(1200,760,1);e.setMuted(true);return e;
}
test('wide and portrait spaces map taps without a horizontal dead zone',()=>{
 for(const [w,h] of [[1200,760],[390,844],[844,390]]){
  const t=computeLetterboxTransform(w,h);
  assert.equal(t.offsetX,0);
  const p=toLogical(t,w-30,h/2);
  assert.ok(Math.abs(p.x*t.scale+t.offsetX-(w-30))<1e-8);
  assert.ok(Math.abs(p.y*t.scale+t.offsetY-h/2)<1e-8);
 }
});
test('spawned models cover all three shapes and stay inside their arena',()=>{
 const shapes=new Set();
 for(let i=0;i<200;i++){const b=spawnBalloon(75,1200);shapes.add(b.shape);assert.ok(b.baseX>=b.radius+30);assert.ok(b.baseX<=1200-b.radius-30);}
 assert.deepEqual([...shapes].sort(),['heart','round','star']);
});
test('forgiving tap pops overlapping balloons, preserves others, and updates score immediately',()=>{
 const e=engine(),a=spawnBalloon(75),b=spawnBalloon(75),c=spawnBalloon(75);
 a.x=b.x=100;a.y=b.y=200;c.x=700;c.y=200;e.balloons=[a,b,c];
 e.handleScreenTap(100,200);
 assert.equal(e.uiStore.getSnapshot().score,2);assert.equal(e.balloons.length,1);assert.equal(e.popEffects.length,2);
 e.handleScreenTap(900,200);assert.equal(e.uiStore.getSnapshot().score,2);
});
test('pause blocks taps and freezes the round; resume retains score and time',()=>{
 const e=engine(),b=spawnBalloon(75);b.x=100;b.y=200;e.balloons=[b];
 e.pause();e.tick(0);e.tick(1000);e.handleScreenTap(100,200);
 assert.equal(e.uiStore.getSnapshot().score,0);assert.equal(e.uiStore.getSnapshot().timeRemaining,60);
 e.resume();e.handleScreenTap(100,200);assert.equal(e.uiStore.getSnapshot().score,1);
});
test('the 60-second round ends once, blocks further scoring and retains the best',()=>{
 const e=engine();e.spawnTimer=9999;e.tick(0);
 for(let i=1;i<=1802;i++)e.tick(i*1000/30);
 const state=e.uiStore.getSnapshot();assert.equal(state.status,'gameover');assert.equal(state.timeRemaining,0);assert.equal(state.finalScore,0);assert.equal(state.bestScore,8);
 const b=spawnBalloon(75);b.x=100;b.y=200;e.balloons=[b];e.handleScreenTap(100,200);e.resume();assert.equal(e.uiStore.getSnapshot().score,0);
});
test('keyboard aiming uses the same hit detection as touch',()=>{
 const e=engine(),b=spawnBalloon(75);b.x=628;b.y=380;e.balloons=[b];
 e.handleKey('ArrowRight');e.handleKey(' ');assert.equal(e.uiStore.getSnapshot().score,1);
});
test('balloons that leave the sky are removed and survivors keep rising',()=>{
 const a=spawnBalloon(75),b=spawnBalloon(75);a.y=-a.radius*3;b.y=400;
 assert.deepEqual(advanceBalloons([a,b],.1),[b]);assert.ok(b.y<400);
});

