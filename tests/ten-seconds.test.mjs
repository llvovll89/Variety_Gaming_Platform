import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const output=await build({entryPoints:['src/games/ten-seconds/engine.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {TimeRun,LEVELS,LOOP_TICKS,MOVE_TICKS,MAX_ECHOES,loadProgress,completeRoom,DIRECTIONS}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const frames=(run,n)=>{for(let i=0;i<n;i++)run.advance(1/60);};
const playing=(index=0)=>{const run=new TimeRun(index);run.start();return run;};

test('movement obeys walls, closed gates, cooldown and pause without consuming time',()=>{
 const r=new TimeRun();assert.equal(r.move(0),false);r.start();assert.ok(r.move(0));assert.equal(r.move(0),false);frames(r,MOVE_TICKS);assert.ok(r.move(0));r.pause();const p={...r.player},tick=r.tick;assert.equal(r.move(1),false);r.advance(.1);assert.deepEqual(r.player,p);assert.equal(r.tick,tick);r.start();r.player={x:5,y:4,direction:1};r.cooldown=0;assert.equal(r.move(1),false);assert.equal(r.player.x,5);
});
test('early rewind copies a complete ten-second trace and holds the final plate position',()=>{
 const r=playing();r.player={x:3,y:3,direction:2};frames(r,12);assert.ok(r.rewind());assert.equal(r.tick,0);assert.equal(r.echoes[0].length,LOOP_TICKS);assert.equal(r.echoes[0][599].x,3);assert.deepEqual(r.occupiedPlates,['A']);assert.ok(r.gateOpen(r.level.gates[0]));r.player.x=2;assert.equal(r.echoes[0][0].x,3);assert.equal(r.loops,1);
});
test('automatic rewind happens at exactly ten seconds and four echoes pause safely',()=>{
 const r=playing();frames(r,599);assert.equal(r.echoes.length,0);frames(r,1);assert.equal(r.echoes.length,1);assert.equal(r.tick,0);for(let i=1;i<MAX_ECHOES;i++)frames(r,600);assert.equal(r.echoes.length,4);frames(r,600);assert.equal(r.status,'paused');assert.equal(r.echoes.length,4);assert.ok(r.removeLastEcho());assert.equal(r.tick,0);r.start();frames(r,1);assert.equal(r.status,'playing');assert.equal(r.echoes.length,3);
});
test('ghosts play at matching ticks independently of current-player movement; failed records are discarded',()=>{
 const r=playing();r.move(0);frames(r,9);r.move(1);frames(r,9);const recorded=r.recording.map(p=>({...p}));r.rewind();assert.deepEqual(r.ghostFrames[0],recorded[0]);frames(r,10);assert.deepEqual(r.ghostFrames[0],recorded[10]);r.player={x:2,y:2,direction:0};assert.notDeepEqual(r.player,r.ghostFrames[0]);r.resetLoop();assert.equal(r.echoes.length,1);assert.equal(r.recording.length,0);
});
test('laser deaths preserve echoes and crystals, only live actors collect, and exit requires every crystal',()=>{
 const r=playing(3);r.player={x:3,y:2,direction:0};r.checkPosition();assert.deepEqual(r.collected,['left']);frames(r,1);r.rewind();r.player={x:8,y:4,direction:0};r.checkPosition();assert.equal(r.deaths,1);assert.equal(r.echoes.length,1);assert.deepEqual(r.collected,['left']);assert.deepEqual(r.player,{...r.level.start,direction:0});r.player={...r.level.exit,direction:0};r.checkPosition();assert.equal(r.status,'playing');r.player={x:10,y:6,direction:0};r.checkPosition();r.player={...r.level.exit,direction:0};r.checkPosition();assert.equal(r.status,'won');
});
test('delta clamping, malformed progress and best records remain bounded',()=>{
 const r=playing();r.advance(Infinity);r.advance(-1);assert.equal(r.tick,0);r.advance(100);assert.equal(r.tick,6);for(const raw of [null,'broken','{}','{"unlocked":99,"best":{}}','{"unlocked":1,"best":{"0":{"stars":8,"loops":1,"deaths":0}}}'])assert.equal(loadProgress(raw).unlocked,0);
 const initial=loadProgress(null);assert.equal(completeRoom(initial,r),initial);r.status='won';r.loops=1;const p=completeRoom(initial,r);assert.equal(p.unlocked,1);assert.equal(p.best[0].stars,3);r.deaths=5;r.loops=4;assert.deepEqual(completeRoom(p,r).best,p.best);assert.deepEqual(loadProgress(JSON.stringify(p)),p);
});

test('tap navigation reaches plates legally, stops at closed doors and yields to manual input',()=>{
 const r=playing();assert.equal(r.navigateTo({x:10,y:2}),false);assert.ok(r.navigateTo(r.level.plates[0]));frames(r,100);assert.equal(r.player.x,3);assert.equal(r.player.y,3);assert.equal(r.route.length,0);assert.ok(r.navigateTo({x:2,y:2}));r.advance(1/60,2);assert.equal(r.route.length,0);assert.equal(r.navigateTo({x:3.5,y:3}),false);r.pause();assert.equal(r.navigateTo({x:3,y:3}),false);
});
test('first-room practice waits indefinitely, records movement, and leaves its ghost on the plate',()=>{
 const r=playing();r.practice=true;frames(r,1200);assert.equal(r.tick,0);assert.equal(r.echoes.length,0);assert.ok(r.navigateTo(r.level.plates[0]));frames(r,100);const tick=r.tick;frames(r,1200);assert.equal(r.tick,tick);assert.equal(r.echoes.length,0);assert.ok(r.rewind());frames(r,1200);assert.equal(r.echoes.length,1);assert.equal(r.status,'playing');assert.ok(r.gateOpen(r.level.gates[0]));assert.equal(r.tick,599);assert.ok(r.navigateTo(r.level.exit));frames(r,300);assert.equal(r.status,'won');
});
test('tap routes wait at a temporarily closed gate and continue when the replay returns to its plate',()=>{
 const r=playing();r.echoes=[Array.from({length:600},(_,i)=>({x:3,y:i===0||i>=110?3:2,direction:0}))];assert.ok(r.navigateTo(r.level.exit));frames(r,100);assert.ok(r.route.length>0);assert.equal(r.status,'playing');frames(r,200);assert.equal(r.status,'won');
});
test('tap navigation can plan through a gate before a recorded ghost reaches its plate',()=>{
 const r=playing();r.echoes=[Array.from({length:600},(_,i)=>({x:3,y:i>=110?3:2,direction:0}))];assert.equal(r.gateOpen(r.level.gates[0]),false);assert.ok(r.navigateTo(r.level.exit));frames(r,300);assert.equal(r.status,'won');
});

// Search space includes wait actions and future ghost positions. Routes are then
// executed through public movement and fixed-clock APIs, without teleportation.
function solveTo(run,goal){
 const originalTick=run.tick;const queue=[{x:run.player.x,y:run.player.y,t:originalTick,path:[]}],seen=new Set();let found;
 for(let i=0;i<queue.length;i++){
  const state=queue[i];if(state.x===goal.x&&state.y===goal.y){found=state.path;break;}if(state.t+MOVE_TICKS>=600)continue;
  const mark=`${state.x},${state.y},${state.t}`;if(seen.has(mark))continue;seen.add(mark);
  for(const direction of [0,1,2,3,4]){
   const d=direction===4?{x:0,y:0}:DIRECTIONS[direction],p={x:state.x+d.x,y:state.y+d.y};if(p.x<1||p.x>11||p.y<1||p.y>7||run.level.walls.some(w=>w.x===p.x&&w.y===p.y))continue;
   const savedTick=run.tick,savedPlayer=run.player;run.tick=state.t;run.player={x:state.x,y:state.y,direction:0};
   const occupied=run.level.plates.filter(plate=>run.plateRemaining(plate)>0).map(p=>p.id);
   const blocked=run.level.gates.some(g=>g.x===p.x&&g.y===p.y&&!run.gateOpen(g));run.tick=savedTick;run.player=savedPlayer;if(blocked)continue;void occupied;
   let safe=true;for(let t=state.t;t<=state.t+MOVE_TICKS;t++)if(run.level.lasers.some(l=>(t+l.offset)%l.period<l.active&&l.cells.some(c=>c.x===p.x&&c.y===p.y))){safe=false;break;}if(!safe)continue;
   queue.push({...p,t:state.t+MOVE_TICKS,path:[...state.path,direction]});
  }
 }
 assert.ok(found,`room ${run.levelIndex+1}: no route to ${goal.x},${goal.y} at ${run.tick}`);
 for(const d of found){if(d!==4)assert.ok(run.move(d),`room ${run.levelIndex+1} legal move ${d}`);if(run.status==='won')break;frames(run,MOVE_TICKS);}
 assert.equal(run.deaths,0);assert.equal(run.player.x,goal.x);assert.equal(run.player.y,goal.y);
}
test('all six designed rooms can be solved with legal moves, timed ghosts and no deaths',()=>{
 for(let index=0;index<6;index++){
  const r=playing(index);if(index===3)solveTo(r,r.level.crystals[0]);
  for(const plate of r.level.plates){solveTo(r,plate);assert.ok(r.rewind());}
  for(const c of r.level.crystals)if(!r.collected.includes(c.id))solveTo(r,c);
  solveTo(r,r.level.exit);assert.equal(r.status,'won',`room ${index+1}`);assert.equal(r.loops,r.level.par);assert.equal(r.stars,3);
 }
});

test('ghost-only pulse plates expire, rearm on a fresh arrival and obey exact time windows',()=>{
 const r=playing(6),p=r.level.plates[0];Object.assign(r.player,p);assert.equal(r.occupiedPlates.includes('A'),false);r.echoes=[Array.from({length:600},(_,i)=>({x:p.x,y:i===140?p.y+1:p.y,direction:0}))];assert.ok(r.occupiedPlates.includes('A'));r.tick=119;assert.ok(r.occupiedPlates.includes('A'));r.tick=120;assert.equal(r.occupiedPlates.includes('A'),false);r.tick=141;assert.ok(r.occupiedPlates.includes('A'));
 const last=playing(8);last.echoes=last.level.plates.map(p=>Array.from({length:600},(_,i)=>({x:p.x,y:i>=231?p.y:p.y+1,direction:0})));last.tick=269;assert.equal(last.gateOpen(last.level.gates[0]),false);last.tick=270;assert.ok(last.gateOpen(last.level.gates[0]));last.tick=330;assert.equal(last.gateOpen(last.level.gates[0]),false);
});
test('interference blocks doors, unstable crystals reset, echo budgets and hint stars are enforced',()=>{
 const r=playing(7),a=r.level.plates[0],b=r.level.plates[1];r.echoes=[Array.from({length:600},()=>({...a,direction:0}))];assert.ok(r.gateOpen(r.level.gates[0]));Object.assign(r.player,b);assert.equal(r.gateOpen(r.level.gates[0]),false);Object.assign(r.player,r.level.crystals[0]);r.checkPosition();assert.ok(r.collected.includes('unstable'));r.resetLoop();assert.equal(r.collected.length,0);r.echoes.push(Array.from({length:600},()=>({...a,direction:0})));frames(r,1);assert.equal(r.rewind(),false);assert.equal(r.status,'paused');assert.equal(r.echoLimit,2);const score=playing();score.loops=1;assert.equal(score.stars,3);score.hintsUsed=1;assert.equal(score.stars,2);
});
test('old completed saves unlock the new chapter and preserve previous best scores',()=>{
 const old={unlocked:5,best:{5:{stars:3,loops:3,deaths:0}}};const loaded=loadProgress(JSON.stringify(old));assert.equal(loaded.unlocked,6);assert.deepEqual(loaded.best,old.best);
});
test('all three advanced experiments have legal, zero-death solutions within their echo budgets',()=>{
 for(const index of [6,7,8]){
  const r=playing(index);
  for(const plate of r.level.plates.filter(p=>p.echoOnly)){
   if(index===8){const adjacent={x:plate.x,y:plate.y+(plate.y<=2?1:-1)};solveTo(r,adjacent);frames(r,231-r.tick);assert.ok(r.move(plate.y<=2?0:2));frames(r,9);}else solveTo(r,plate);
   assert.ok(r.rewind());
  }
  for(const c of r.level.crystals)solveTo(r,c);
  solveTo(r,r.level.exit);assert.equal(r.status,'won',`advanced room ${index+1}`);assert.equal(r.deaths,0);assert.equal(r.loops,r.level.par);assert.ok(r.echoes.length<=r.echoLimit);assert.equal(r.stars,3);
 }
});
