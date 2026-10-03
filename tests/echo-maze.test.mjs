import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({ entryPoints:['src/games/echo-maze/engine.ts'], bundle:true, write:false, format:'esm', platform:'node' });
const { MazeRun, LEVELS, distances, key, DIRECTIONS } = await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
test('all difficulties generate connected mazes with reachable farthest exits and rewards',()=>{
  let seed=98765; const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(const difficulty of Object.keys(LEVELS)) for(let i=0;i<40;i++) {
    const run=new MazeRun(difficulty,random), reachable=distances(run.cells,run.player);
    assert.equal(reachable.size,run.cells.flat().filter(v=>v===0).length);
    assert.equal(reachable.get(key(run.exit)),Math.max(...reachable.values()));
    assert.ok([...run.shards].every(s=>reachable.has(s)&&s!==key(run.exit)&&s!=='1,1'));
    assert.equal(run.remaining,LEVELS[difficulty].seconds);
    assert.ok(run.cells[0].every(v=>v===1)); assert.ok(run.cells.at(-1).every(v=>v===1));
  }
});
test('walls block movement, walking route reaches victory and terminal state freezes',()=>{
  const run=new MazeRun('easy'); run.move(0);assert.deepEqual(run.player,{x:1,y:1});assert.equal(run.steps,0);
  const walkTo = target => {
    const dist=distances(run.cells,target);
    while(key(run.player)!==key(target)) {
      const current=dist.get(key(run.player));
      run.move(DIRECTIONS.findIndex(d=>dist.get(key({x:run.player.x+d.x,y:run.player.y+d.y}))===current-1));
    }
  };
  for(const id of [...run.seals]) { const [x,y]=id.split(',').map(Number);walkTo({x,y}); }
  const dist=distances(run.cells,run.exit);
  while(run.status==='playing') { const current=dist.get(key(run.player));const d=DIRECTIONS.findIndex(d=>dist.get(key({x:run.player.x+d.x,y:run.player.y+d.y}))===current-1);assert.ok(d>=0);run.move(d); }
  assert.equal(run.status,'won');const before=run.remaining;run.tick(1000);run.move(0);assert.equal(run.remaining,before);assert.deepEqual(run.player,run.exit);
});
test('timeout loses exactly once; pause freezes both timer and actions',()=>{
  const run=new MazeRun('normal');run.paused=true;run.tick(500);run.action('pulse');run.action('anchor');run.move(1);
  assert.equal(run.remaining,LEVELS.normal.seconds);assert.equal(run.pulses,3);assert.equal(run.anchor,null);assert.equal(run.steps,0);
  run.paused=false;run.tick(LEVELS.normal.seconds);assert.equal(run.status,'lost');assert.equal(run.remaining,0);run.action('pulse');assert.equal(run.pulses,3);run.tick(100);assert.equal(run.remaining,0);
});
test('anchor returns position but never restores time or collected rewards; charges are limited',()=>{
  const run=new MazeRun('easy');run.action('anchor');const direction=DIRECTIONS.findIndex(d=>run.cells[1+d.y]?.[1+d.x]===0);
  const d=DIRECTIONS[direction];run.shards.add(key({x:1+d.x,y:1+d.y}));run.move(direction);assert.equal(run.collected,1);assert.equal(run.remaining,LEVELS.easy.seconds+10);
  run.tick(5);run.action('return');assert.deepEqual(run.player,{x:1,y:1});assert.equal(run.remaining,LEVELS.easy.seconds+5);run.move(direction);assert.equal(run.collected,1);
  run.action('return');run.action('return');assert.equal(run.returns,0);run.move(direction);const p={...run.player};run.action('return');assert.deepEqual(run.player,p);
});
test('pulse costs real time and expires; cannot spend the last four seconds',()=>{
  const run=new MazeRun('hard');run.action('pulse');assert.equal(run.remaining,LEVELS.hard.seconds-4);assert.equal(run.reveal,5);assert.equal(run.pulses,1);
  run.tick(5);assert.equal(run.reveal,0);run.remaining=4;run.action('pulse');assert.equal(run.pulses,1);assert.equal(run.remaining,4);
});

test('seals and traps are reachable and do not overlap rewards',()=>{
 for(const difficulty of Object.keys(LEVELS)) for(let i=0;i<20;i++) {
 const run=new MazeRun(difficulty),reachable=distances(run.cells,run.player);
 assert.equal(run.requiredSeals,difficulty==='easy'?2:difficulty==='normal'?3:4);
 for(const id of run.seals){assert.ok(reachable.has(id));assert.ok(!run.shards.has(id)&&!run.traps.has(id));}
 for(const id of run.traps){assert.ok(reachable.has(id));assert.ok(!run.shards.has(id));}
 }
});
test('locked exit requires seals; active traps cost time and sleeping traps are safe',()=>{
 const run=new MazeRun('normal');
 const neighbor=DIRECTIONS.findIndex(d=>run.cells[run.exit.y-d.y]?.[run.exit.x-d.x]===0);
 const d=DIRECTIONS[neighbor];run.player={x:run.exit.x-d.x,y:run.exit.y-d.y};run.move(neighbor);
 assert.equal(run.status,'playing');run.seals.clear();run.player={x:run.exit.x-d.x,y:run.exit.y-d.y};run.move(neighbor);assert.equal(run.status,'won');
 const trap=new MazeRun('easy');const dir=DIRECTIONS.findIndex(d=>trap.cells[1+d.y]?.[1+d.x]===0);const delta=DIRECTIONS[dir];
 trap.shards.clear();trap.seals.clear();trap.traps.add(key({x:1+delta.x,y:1+delta.y}));trap.move(dir);assert.equal(trap.remaining,LEVELS.easy.seconds-6);
 trap.player={x:1,y:1};trap.tick(3);trap.move(dir);assert.equal(trap.trapHits,1);
 trap.player={x:1,y:1};trap.tick(3);trap.remaining=5;trap.move(dir);assert.equal(trap.status,'lost');
});
