import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const output = new URL('./probe-results.json', import.meta.url);
async function load(contents) {
  const r = await build({stdin:{contents,resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',define:{'import.meta.env.DEV':'false'}});
  const m={exports:{}};new Function('require','module','exports',r.outputFiles[0].text)(require,m,m.exports);return m.exports;
}
const { Fight, ColorMatchEngine, MemoryGameEngine } = await load(`export {Fight} from './src/games/kitchen-fighter/engine.ts'; export {ColorMatchEngine} from './src/games/hachuping-color-match/game/engine.ts'; export {MemoryGameEngine} from './src/games/hachuping-memory/game/engine.ts';`);
const results = {};
globalThis.window = {};
globalThis.localStorage = {getItem:()=>null,setItem:()=>{}};
let frames=new Map(),next=0;
globalThis.requestAnimationFrame=fn=>{frames.set(++next,fn);return next;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const c=new ColorMatchEngine(0,()=>{});
c.startGame();
results.colorRaf=[frames.size];
for(let i=0;i<3;i++){c.pauseGame();c.resumeGame();results.colorRaf.push(frames.size);}
c.destroy();results.colorRafAfterDestroy=frames.size;
frames.clear();
const terminal=new ColorMatchEngine(0,()=>{});terminal.startGame();terminal.gameState.timeRemaining=.001;
for(const [id,fn] of [...frames]){frames.delete(id);fn(16);}
results.colorEnded={status:terminal.getGameState().status,pendingFrames:frames.size};
const f=new Fight('local',['spatula','spatula']);f.phase='fight';f.fighters[0].x=400;f.fighters[1].x=500;
f.attack(0,'jab');f.attack(1,'jab');f.step(.05);f.step(.05);
results.sameFrameAttacks=f.fighters.map(p=>({hp:p.hp,action:p.action?.move??null}));
const realSetTimeout=globalThis.setTimeout;
let time=0,timers=[];
globalThis.setTimeout=(fn,ms)=>{timers.push({at:time+ms,fn});return timers.length;};
async function advance(ms){const end=time+ms;for(let count=0;count<1000;count++){timers.sort((a,b)=>a.at-b.at);if(!timers[0]||timers[0].at>end)break;const t=timers.shift();time=t.at;t.fn();await Promise.resolve();await Promise.resolve();}time=end;}
const m=new MemoryGameEngine();m.startGame();m.togglePause();await advance(2000);
results.memoryPause={status:m.uiStore.getSnapshot().status,playerTurn:m.uiStore.getSnapshot().gameState.isPlayerTurn,message:m.uiStore.getSnapshot().gameState.message};
timers=[];
globalThis.setTimeout=realSetTimeout;
const { useLeaderboard, React, renderToString } = await load(`export {useLeaderboard} from './src/shared/hooks/useLeaderboard.ts'; import * as React from 'react';export {React};export {renderToString} from 'react-dom/server';`);
let hook;
localStorage.getItem=()=>JSON.stringify(Array.from({length:10},(_,i)=>({score:100-i,timestamp:i})));
renderToString(React.createElement(()=>{hook=useLeaderboard('audit');return null;}));
results.leaderboardOutside=hook.submitScore(1);results.leaderboardTie=hook.submitScore(100);
const {createGameState,loadGame,HERO_CATALOG}=await load(`export {createGameState} from './src/games/three-kingdoms/game/state.ts';export {loadGame} from './src/games/three-kingdoms/game/save.ts';export {HERO_CATALOG} from './src/games/three-kingdoms-card/lib/heroCatalog.ts';`);
const malformed=createGameState('caocao');delete malformed.units;
localStorage.getItem=()=>JSON.stringify({version:1,savedAt:Date.now(),state:malformed});
results.pkMalformedSaveAccepted=loadGame()!==null;
results.cardHeroCount=HERO_CATALOG.length;
await writeFile(output,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
