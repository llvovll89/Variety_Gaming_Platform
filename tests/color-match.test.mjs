import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({stdin:{contents:`export {ColorMatchEngine,roundRules} from './src/games/hachuping-color-match/game/engine.ts'; export * from './src/games/hachuping-color-match/game/constants.ts';`,resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'node'});
const M=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const {ColorMatchEngine,roundRules,DIFFICULTY_CONFIGS,CORRECT_PER_LEVEL,MIN_TIME_FACTOR,WRONG_PENALTY_SECONDS,POINTS_PER_CORRECT,STREAK_BONUS_PER_HIT,STREAK_BONUS_CAP,COLOR_PALETTE}=M;

/** Engine with a hand-cranked frame loop: step(seconds) advances the game clock. */
function withEngine(difficulty, run){
  const oldRequest=globalThis.requestAnimationFrame,oldCancel=globalThis.cancelAnimationFrame;
  const frames=new Map();let next=0,now=0;
  globalThis.requestAnimationFrame=fn=>{frames.set(++next,fn);return next;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
  const step=seconds=>{for(let left=seconds;left>1e-9;){const dt=Math.min(.05,left);left-=dt;now+=dt*1000;const entry=frames.entries().next().value;if(!entry)return;frames.delete(entry[0]);entry[1](now);}};
  const overs=[];
  try{const e=new ColorMatchEngine(0,s=>overs.push(s),difficulty);e.startGame();step(.016);run({e,step,overs,state:()=>e.getGameState(),snap:()=>e.uiStore.getSnapshot()});e.destroy();}
  finally{globalThis.requestAnimationFrame=oldRequest;globalThis.cancelAnimationFrame=oldCancel;}
}
const right=e=>{const s=e.getGameState();return s.options.find(o=>o.colorId===s.targetColorId).id;};
const wrong=e=>{const s=e.getGameState();return s.options.find(o=>o.colorId!==s.targetColorId).id;};

test('round rules: pots grow at levels 3 and 5 up to the cap, and the answer window shrinks to a floor',()=>{
  for(const [name,c] of Object.entries(DIFFICULTY_CONFIGS)){
    assert.equal(roundRules(name,1).optionCount,c.optionCount);
    assert.equal(roundRules(name,1).answerTimeLimit,c.answerTimeLimit);
    assert.equal(roundRules(name,3).optionCount,Math.min(c.maxOptionCount,c.optionCount+1));
    assert.equal(roundRules(name,99).optionCount,c.maxOptionCount);
    assert.ok(c.maxOptionCount<=6,'keyboard 1–6 must reach every pot');
    let prev=Infinity;
    for(let level=1;level<=20;level++){const t=roundRules(name,level).answerTimeLimit;assert.ok(t<=prev);prev=t;}
    assert.ok(Math.abs(prev-c.answerTimeLimit*MIN_TIME_FACTOR)<1e-9);
  }
});

test('every round has the target among distinct pots, and the target never repeats back to back',()=>withEngine('hard',({e,state})=>{
  let last=state().targetColorId;
  for(let i=0;i<60;i++){
    const s=state();
    assert.equal(new Set(s.options.map(o=>o.colorId)).size,s.options.length);
    assert.ok(s.options.some(o=>o.colorId===s.targetColorId));
    assert.ok(s.options.every(o=>COLOR_PALETTE.some(c=>c.id===o.colorId)));
    assert.deepEqual(s.options.map(o=>o.id),s.options.map((_,i)=>i));
    e.selectOption(right(e));
    if(i>0)assert.notEqual(state().targetColorId,last);
    last=state().targetColorId;
  }
}));

test('correct answers score with a capped streak bonus and level up every few hits',()=>withEngine('normal',({e,state,snap})=>{
  let expected=0;
  for(let hit=1;hit<=20;hit++){
    e.selectOption(right(e));
    expected+=POINTS_PER_CORRECT+Math.min(hit-1,STREAK_BONUS_CAP)*STREAK_BONUS_PER_HIT;
    assert.equal(state().score,expected);
    assert.equal(state().level,1+Math.floor(hit/CORRECT_PER_LEVEL));
  }
  assert.equal(state().streak,20);assert.equal(state().bestStreak,20);
  const kinds=snap().events.map(ev=>ev.kind);
  assert.ok(kinds.includes('level-up')&&kinds.includes('streak'));
  assert.equal(state().options.length,roundRules('normal',state().level).optionCount);
}));

test('a wrong pot costs time once per flash, breaks the streak, and keeps the round',()=>withEngine('normal',({e,state,step})=>{
  e.selectOption(right(e));e.selectOption(right(e));
  const target=state().targetColorId,before=state().timeRemaining,id=wrong(e);
  e.selectOption(id);e.selectOption(id);
  assert.equal(state().totalWrong,1,'double tap on the same wrong pot is one mistake');
  assert.ok(Math.abs(before-state().timeRemaining-WRONG_PENALTY_SECONDS)<1e-9);
  assert.equal(state().streak,0);assert.equal(state().bestStreak,2);
  assert.equal(state().targetColorId,target);
  step(.5);
  state().answerTimeRemaining=10;
  e.selectOption(id);
  assert.equal(state().totalWrong,2,'once the flash ends the same pot counts again');
}));

test('running out of answer time is a miss and deals a fresh round',()=>withEngine('easy',({e,state,step,snap})=>{
  e.selectOption(right(e));
  const round=state().round,limit=state().answerTimeLimit;
  step(limit-.1);
  assert.equal(state().round,round,'still answering just before the limit');
  step(.2);
  assert.equal(state().round,round+1);
  assert.equal(state().totalWrong,1);assert.equal(state().streak,0);
  assert.equal(snap().events.at(-1).kind,'timeout');
  assert.ok(snap().answerProgress>.9,'the new round starts with a full ring');
}));

test('wrong taps that drain the clock end the game once with the final score',()=>withEngine('normal',({e,state,overs})=>{
  e.selectOption(right(e));
  state().timeRemaining=WRONG_PENALTY_SECONDS/2;
  e.selectOption(wrong(e));
  assert.equal(state().status,'game-over');assert.equal(state().timeRemaining,0);
  assert.deepEqual(overs,[state().score]);
  e.selectOption(right(e));e.selectOption(wrong(e));
  assert.equal(overs.length,1);
}));

test('selectOptionAt picks by screen position and ignores positions past the last pot',()=>withEngine('easy',({e,state})=>{
  const s=state(),index=s.options.findIndex(o=>o.colorId===s.targetColorId);
  e.selectOptionAt(s.options.length);e.selectOptionAt(-1);
  assert.equal(state().totalCorrect+state().totalWrong,0);
  e.selectOptionAt(index);
  assert.equal(state().totalCorrect,1);
}));

test('nothing counts while paused',()=>withEngine('normal',({e,state,step})=>{
  e.pauseGame();
  const before=JSON.stringify(state());
  e.selectOption(right(e));step(5);
  assert.equal(JSON.stringify(state()),before);
}));

test('the menu shows the best score of the selected difficulty, apart from older shared records', async () => {
  const ui = await build({stdin:{contents:`export {createElement} from 'react'; export {renderToStaticMarkup} from 'react-dom/server'; export {default as StartMenu} from './src/games/hachuping-color-match/components/StartMenu.tsx';`,resolveDir:process.cwd()},bundle:true,write:false,format:'cjs',platform:'node',jsx:'automatic'});
  const {default:Module}=await import('node:module');const {fileURLToPath}=await import('node:url');
  const bundled=new Module(fileURLToPath(import.meta.url));bundled.filename=fileURLToPath(import.meta.url);bundled.paths=Module._nodeModulePaths(process.cwd());
  bundled._compile(ui.outputFiles[0].text,bundled.filename);
  const {createElement,renderToStaticMarkup,StartMenu}=bundled.exports;
  const html=renderToStaticMarkup(createElement(StartMenu,{difficulty:'hard',onDifficultyChange(){},focusDifficulty:false,patterns:false,bestScore:120,legacyBest:300,legacyLeaderboard:[{score:300,timestamp:1},{score:250,timestamp:2}],onTogglePatterns(){},onStart(){}}));
  assert.match(html,new RegExp(`${DIFFICULTY_CONFIGS.hard.name} 최고 기록 <b class="cm-num">120</b>`));
  assert.match(html,/난이도 구분 전 기록 · 최고 <b class="cm-num">300<\/b>/);
  assert.match(html,/2위 · <b class="cm-num">250<\/b>/,'older TOP 10 stays visible');
});
