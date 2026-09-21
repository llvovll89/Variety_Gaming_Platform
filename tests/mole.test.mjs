import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const out=await build({stdin:{contents:`export * from './src/games/hachuping-whack-a-mole/game/engine'; export * from './src/games/hachuping-whack-a-mole/game/constants';`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {WhackAMoleEngine,DIFFICULTY_CONFIGS}=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
let next=0;
const callbacks=new Map();
globalThis.requestAnimationFrame=cb=>{callbacks.set(++next,cb);return next;};
globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
function make(difficulty='normal',done=()=>{}) {const e=new WhackAMoleEngine(80,done,difficulty);e.setMuted(true);return e;}
function play(e){e.startGame(); e.update(3); assert.equal(e.getGameState().status,'playing');}

test('ready countdown does not spend play time and prevents early hits',()=>{
  const e=make();e.startGame();assert.equal(e.getGameState().moles.length,9);
  assert.equal(e.hitMole(0),false);e.update(1);assert.equal(e.getGameState().countdown,2);
  assert.equal(e.getGameState().timeRemaining,30);e.update(2);assert.equal(e.getGameState().status,'playing');
  e.update(.5);assert.equal(e.getGameState().timeRemaining,29.5);e.destroy();
});
test('pause and repeated resume own exactly one animation loop',()=>{
  callbacks.clear();const e=make();e.startGame();assert.equal(callbacks.size,1);
  e.pauseGame();assert.equal(callbacks.size,0);const s={...e.getGameState()};e.update(10);
  assert.equal(e.getGameState().countdown,s.countdown);e.resumeGame();e.resumeGame();assert.equal(callbacks.size,1);
  assert.equal(e.getGameState().status,'ready');e.pauseGame();e.resumeGame();assert.equal(callbacks.size,1);e.destroy();assert.equal(callbacks.size,0);
});
test('one hit awards ten once, misses reset the streak, and paused input is ignored',()=>{
  const e=make();play(e);const s=e.getGameState();s.moles[0].isActive=true;
  assert.equal(e.hitMole(0),true);assert.equal(s.score,10);assert.equal(s.combo,1);
  assert.equal(e.hitMole(0),false);assert.equal(s.score,10);assert.equal(s.attempts,2);assert.equal(s.combo,0);
  s.moles[1].isActive=true;e.hitMole(1);s.moles[2].isActive=true;e.hitMole(2);assert.equal(s.bestCombo,2);
  const attempts=s.attempts;e.pauseGame();e.hitMole(2);assert.equal(s.attempts,attempts);e.destroy();
});
test('each difficulty respects its simultaneous target cap and sampled visible duration',()=>{
  for(const difficulty of ['easy','normal','hard']){
    const e=make(difficulty);play(e);const s=e.getGameState(),c=DIFFICULTY_CONFIGS[difficulty];
    for(let i=0;i<240;i++) {e.update(.05);assert.ok(s.moles.filter(m=>m.isActive).length<=c.activeMoleCount);
      for(const m of s.moles.filter(m=>m.isActive)){assert.ok(m.duration>=c.moleActiveDurationMin&&m.duration<=c.moleActiveDurationMax);}}
    assert.ok(s.moles.some(m=>m.isActive));e.destroy();
  }
});
test('end callback and storage submission trigger once, result cannot become paused',()=>{
  let ends=0;const e=make('easy',()=>ends++);play(e);e.update(30);assert.equal(ends,1);
  assert.equal(e.getGameState().timeRemaining,0);e.endGame();e.pauseGame();e.resumeGame();
  assert.equal(ends,1);assert.equal(e.getGameState().status,'game-over');e.destroy();
});
test('restart clears statistics, hit effects and pause state',()=>{
  const e=make();play(e);e.getGameState().moles[0].isActive=true;e.hitMole(0);e.pauseGame();e.startGame();
  const s=e.getGameState();assert.equal(s.status,'ready');assert.equal(s.score,0);assert.equal(s.attempts,0);assert.equal(s.bestCombo,0);
  assert.equal(e.getMoleHitFlashAlpha(0),0);assert.equal(s.timeRemaining,30);e.destroy();
});
