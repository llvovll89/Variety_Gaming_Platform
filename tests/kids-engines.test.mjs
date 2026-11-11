import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({stdin:{contents:`export {ColorMatchEngine} from './src/games/hachuping-color-match/game/engine.ts'; export {MemoryGameEngine} from './src/games/hachuping-memory/game/engine.ts';`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const {ColorMatchEngine,MemoryGameEngine}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));

test('color match owns one loop through repeated pauses, resumes and starts; destroy releases it',()=>{
  const oldRequest=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
  const frames=new Map();let next=0;
  globalThis.requestAnimationFrame=fn=>{frames.set(++next,fn);return next;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
  try {
    const e=new ColorMatchEngine(0,()=>{});e.startGame();assert.equal(frames.size,1);
    for(let i=0;i<8;i++){e.pauseGame();e.pauseGame();assert.equal(frames.size,0);e.resumeGame();e.resumeGame();assert.equal(frames.size,1);}
    e.startGame();assert.equal(frames.size,1);e.destroy();assert.equal(frames.size,0);
    e.resumeGame();e.startGame();assert.equal(frames.size,0);
  } finally {globalThis.requestAnimationFrame=oldRequest;globalThis.cancelAnimationFrame=oldCancel;}
});

test('color match terminal frame never schedules again or reports game over twice',()=>{
  const oldRequest=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
  const frames=new Map();let next=0,calls=0;
  globalThis.requestAnimationFrame=fn=>{frames.set(++next,fn);return next;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
  try {
    const e=new ColorMatchEngine(0,()=>calls++);e.startGame();e.getGameState().timeRemaining=.001;
    const [id,callback]=frames.entries().next().value;frames.delete(id);callback(16);
    assert.equal(e.getGameState().status,'game-over');assert.equal(calls,1);assert.equal(frames.size,0);
    e.endGame();e.pauseGame();e.resumeGame();assert.equal(calls,1);assert.equal(frames.size,0);
  } finally {globalThis.requestAnimationFrame=oldRequest;globalThis.cancelAnimationFrame=oldCancel;}
});

function withClock(run){
  const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldNow=Date.now;
  const timers=new Map();let now=0,next=0;
  globalThis.setTimeout=(fn,ms)=>{timers.set(++next,{fn,at:now+ms});return next;};
  globalThis.clearTimeout=id=>timers.delete(id);Date.now=()=>now;
  const tick=ms=>{const end=now+ms;for(let safety=0;safety<10000;safety++){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;timers.delete(due[0]);now=due[1].at;due[1].fn();}now=end;};
  try{run({tick,timers});}finally{globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;Date.now=oldNow;}
}

test('memory pause freezes the exact remaining pattern delay and a visible card until resumed',()=>withClock(({tick,timers})=>{
  const e=new MemoryGameEngine();e.startGame();tick(800);e.togglePause();
  const paused=structuredClone(e.uiStore.getSnapshot());tick(10000);
  assert.deepEqual(e.uiStore.getSnapshot(),paused);assert.equal(timers.size,0);
  e.togglePause();tick(299);assert.ok(e.uiStore.getSnapshot().gameState.cards.every(c=>!c.isRevealed));
  tick(1);assert.ok(e.uiStore.getSnapshot().gameState.cards.some(c=>c.isRevealed));
  e.togglePause();tick(2000);assert.ok(e.uiStore.getSnapshot().gameState.cards.some(c=>c.isRevealed));
  e.togglePause();tick(300);assert.equal(e.uiStore.getSnapshot().gameState.isPlayerTurn,true);e.destroy();
}));

test('memory restart cancels old work and destruction never publishes or leaves callbacks behind',()=>withClock(({tick,timers})=>{
  const e=new MemoryGameEngine();let publishes=0;e.uiStore.subscribe(()=>publishes++);
  e.startGame();tick(600);e.startGame();assert.equal(timers.size,1);tick(1400);
  assert.equal(e.uiStore.getSnapshot().gameState.sequence.length,1);
  const state=e.uiStore.getSnapshot().gameState;e.playerClickCard(state.sequence[0]);
  assert.ok(timers.size>0);e.destroy();const before=publishes;tick(10000);
  assert.equal(timers.size,0);assert.equal(publishes,before);e.startGame();assert.equal(timers.size,0);
}));

test('memory wrong input locks the turn immediately; pause freezes game-over delay and restart recovers',()=>withClock(({tick,timers})=>{
  const e=new MemoryGameEngine(8);e.startGame();tick(1400);
  const state=e.uiStore.getSnapshot().gameState,expected=state.sequence[0];
  e.playerClickCard(-1);assert.equal(state.playerSequence.length,0);
  e.playerClickCard((expected+1)%state.cards.length);e.playerClickCard(expected);
  assert.equal(state.playerSequence.length,1);e.togglePause();tick(3000);assert.equal(state.status,'paused');
  e.togglePause();tick(500);assert.equal(state.status,'game-over');assert.equal(timers.size,0);assert.equal(state.highScore,8);
  e.startGame();assert.equal(state.status,'playing');assert.equal(state.score,0);assert.equal(timers.size,1);e.destroy();
}));
