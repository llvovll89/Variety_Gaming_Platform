import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const output=await build({entryPoints:['src/games/ghost-movers/engine.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {LEVELS,createState,act,stars,loadProgress,completeLevel,key,routeTo}=await import('data:text/javascript;base64,'+Buffer.from(output.outputFiles[0].text).toString('base64'));
const direction={U:0,R:1,D:2,L:3};
test('click-to-walk finds an empty route, never pushes cargo, and preserves individual undo turns',()=>{
 let s=act(createState(),{type:'possess',id:'sofa'}),before=JSON.stringify(s);
 assert.deepEqual(routeTo(s,{x:3,y:3}),[1]);assert.equal(routeTo(s,{x:4,y:3}),null);assert.equal(routeTo(s,{x:NaN,y:2}),null);
 const moved=act(s,{type:'navigate',point:{x:5,y:3}});assert.equal(moved.furniture[0].x,5);assert.equal(moved.furniture[0].y,3);assert.equal(moved.cargo[0].x,4);assert.equal(moved.steps,5);assert.equal(moved.history.length,5);assert.equal(JSON.stringify(s),before);
 const undone=act(moved,{type:'undo'});assert.equal(undone.steps,4);
 assert.equal(act(s,{type:'navigate',point:{x:4,y:3}}).steps,0);
 s.steps=23;const lost=act(s,{type:'navigate',point:{x:5,y:3}});assert.equal(lost.status,'lost');assert.equal(lost.steps,24);assert.notEqual(lost.furniture[0].x,5);
});
test('clicking cargo approaches and faces it; Space ability moves it without standing on it',()=>{
 let s=act(createState(),{type:'possess',id:'sofa'});s=act(s,{type:'target',id:'a'});assert.equal(s.furniture[0].x,3);assert.equal(s.furniture[0].direction,1);assert.equal(s.cargo[0].x,4);assert.equal(s.steps,1);
 s=act(s,{type:'ability'});assert.equal(s.cargo[0].x,5);assert.equal(s.furniture[0].x,3);
 let fan=act(createState(1),{type:'possess',id:'fan'});fan=act(fan,{type:'face',direction:0});fan=act(fan,{type:'target',id:'a'});assert.equal(fan.steps,0);assert.equal(fan.furniture[0].direction,1);assert.equal(act(fan,{type:'ability'}).cargo[0].x,5);
 let vac=act(createState(8),{type:'possess',id:'vacuum'});vac=act(vac,{type:'target',id:'a'});const object=vac.furniture.find(f=>f.id==='vacuum');assert.ok(Math.abs(object.x-vac.cargo[0].x)+Math.abs(object.y-vac.cargo[0].y)>=2);assert.equal(act(vac,{type:'ability'}).steps,vac.steps+1);
 assert.match(act(createState(),{type:'target',id:'a'}).message,/빙의/);
});
test('pointer routing respects closed doors, occupied cells, and carried parcels',()=>{
 let s=act(createState(10),{type:'possess',id:'sofa'});assert.equal(routeTo(s,{x:6,y:2}),null);
 s=act(s,{type:'possess',id:'lamp'});s=act(s,{type:'ability'});s=act(s,{type:'possess',id:'sofa'});assert.ok(routeTo(s,{x:6,y:2}));
 let cart=act(createState(11),{type:'possess',id:'cart'});cart=act(cart,{type:'ability'});cart=act(cart,{type:'navigate',point:{x:3,y:4}});assert.equal(cart.cargo[0].x,3);assert.equal(cart.cargo[0].y,4);assert.ok(cart.carry);assert.equal(cart.cargo[0].delivered,false);
});
const parse=token=>token.startsWith('@')?{type:'possess',id:token.slice(1)}:token.startsWith('>')?{type:'face',direction:Number(token[1])}:token==='!'?{type:'ability'}:{type:'move',direction:direction[token]};
function solve(index){let s=createState(index);for(const token of LEVELS[index].solution){const next=act(s,parse(token));if(token in direction||token==='!')assert.equal(next.steps,s.steps+1,`room ${index+1}: ${token} failed: ${next.message}`);s=next;}return s;}

test('all twenty-four authored puzzles are solvable through legal commands, with three stars and matching par',()=>{
  let progress=loadProgress(null);
  for(let i=0;i<LEVELS.length;i++){const s=solve(i);assert.equal(s.status,'won',`room ${i+1}`);assert.equal(s.steps,LEVELS[i].par);assert.equal(stars(s),3);assert.ok(s.cargo.every(c=>c.delivered));progress=completeLevel(progress,s);assert.equal(progress.unlocked,Math.min(LEVELS.length-1,i+1));}
  assert.deepEqual(loadProgress(JSON.stringify(progress)),progress);
});
test('possession and rotation are free; walls, other furniture and heavy cargo block without using a turn',()=>{
  let s=createState(3);s=act(s,{type:'possess',id:'fan'});assert.equal(s.steps,0);
  s=act(s,{type:'face',direction:0});assert.equal(s.furniture[1].direction,0);s=act(s,{type:'move',direction:0});assert.equal(s.steps,0);assert.equal(s.furniture[1].y,3);
  s=act(s,{type:'face',direction:1});s=act(s,{type:'ability'});assert.equal(s.steps,0);assert.match(s.message,/무거워/);assert.equal(s.cargo[0].x,4);
  const before=JSON.stringify(s);assert.equal(act(s,{type:'possess',id:'missing'}),s);assert.equal(JSON.stringify(s),before);
  let first=act(createState(),{type:'possess',id:'sofa'});first=act(first,{type:'move',direction:3});assert.equal(first.steps,1);first=act(first,{type:'move',direction:3});assert.equal(first.steps,1);assert.equal(first.furniture[0].x,1);
});
test('fan cannot push by walking, wind stops at walls or furniture, and empty abilities cost nothing',()=>{
  let s=act(createState(1),{type:'possess',id:'fan'});s=act(s,{type:'move',direction:1});assert.equal(s.steps,1);s=act(s,{type:'move',direction:1});assert.equal(s.steps,1);assert.equal(s.cargo[0].x,4);
  s=act(s,{type:'face',direction:0});s=act(s,{type:'ability'});assert.equal(s.steps,1);
  s=act(createState(3),{type:'possess',id:'fan'});s.furniture[0]={...s.furniture[0],x:3,y:3};s.ice=['4,3','5,3','6,3','7,3'];s=act(s,{type:'ability'});assert.equal(s.steps,0);assert.equal(s.cargo[0].x,4);
  s.furniture[0]={...s.furniture[0],x:3,y:2};s=act(s,{type:'ability'});assert.equal(s.cargo[0].delivered,true);
});
test('freezing reaches under cargo, stops at barriers and heavy cargo slides all the way to the delivery tile',()=>{
  let s=createState(3);for(const token of LEVELS[3].solution.slice(0,5))s=act(s,parse(token));assert.deepEqual(s.ice,['4,3','5,3','6,3','7,3']);assert.equal(s.steps,3);
  const old=JSON.stringify(s);const blocked=act(s,{type:'ability'});assert.equal(blocked.steps,3);assert.equal(JSON.stringify(s),old);
  s=act(s,{type:'move',direction:0});s=act(s,{type:'possess',id:'fan'});s=act(s,{type:'ability'});assert.equal(s.cargo[0].x,7);assert.equal(s.cargo[0].delivered,true);assert.equal(s.status,'won');
  let wall=act(createState(5),{type:'possess',id:'fridge'});wall.furniture[0]={...wall.furniture[0],x:4,y:3,direction:1};wall=act(wall,{type:'ability'});assert.deepEqual(wall.ice,[]);
});
test('ice can overshoot; a cargo stops at the first uniced tile or at an obstacle and matches only its own goal kind',()=>{
  let s=act(createState(4),{type:'possess',id:'fan'});s.ice=['5,3','6,3'];s=act(s,{type:'ability'});assert.equal(s.cargo[0].x,6);assert.ok(s.cargo[0].delivered);
  s=act(createState(1),{type:'possess',id:'fan'});s.ice=['5,3'];s=act(s,{type:'ability'});assert.equal(s.cargo[0].x,6);assert.equal(s.cargo[0].delivered,false);
  s=act(createState(3),{type:'possess',id:'fan'});s.cargo[0].kind='box';s=act(s,{type:'ability'});s=act(s,{type:'ability'});s=act(s,{type:'ability'});assert.equal(s.cargo[0].x,7);assert.equal(s.cargo[0].delivered,false);assert.equal(s.status,'playing');
});
test('undo restores delivered cargo, ice, possession, orientation and action count without mutating the source',()=>{
  const winner=solve(3),before=JSON.stringify(winner),undo=act(winner,{type:'undo'});assert.equal(winner.status,'won');assert.equal(JSON.stringify(winner),before);assert.equal(undo.status,'playing');assert.equal(undo.cargo[0].delivered,false);assert.equal(undo.cargo[0].x,4);assert.equal(undo.steps,4);assert.equal(undo.undos,1);assert.equal(undo.active,'fan');assert.deepEqual(undo.ice,winner.ice);
  let s=createState(3);for(const token of LEVELS[3].solution.slice(0,5))s=act(s,parse(token));s=act(s,{type:'possess',id:'fan'});s=act(s,{type:'undo'});assert.equal(s.active,'fridge');assert.deepEqual(s.ice,[]);assert.equal(s.steps,2);
});
test('homecoming occurs only after a valid action, undo recovers, relaxed mode is unlimited and winning on the final turn wins',()=>{
  let s=act(createState(),{type:'possess',id:'sofa'});s.steps=23;s=act(s,{type:'move',direction:1});assert.equal(s.status,'lost');assert.equal(act(s,{type:'ability'}),s);s=act(s,{type:'undo'});assert.equal(s.status,'playing');assert.equal(s.steps,23);
  s=act(createState(0,true),{type:'possess',id:'sofa'});s.steps=100;s=act(s,{type:'move',direction:1});assert.equal(s.status,'playing');
  s=createState(0);for(const token of LEVELS[0].solution.slice(0,-1))s=act(s,parse(token));s.steps=23;s=act(s,{type:'move',direction:1});assert.equal(s.status,'won');
});
test('hints cap three-star runs; best scores only improve; incomplete and malformed saves do not unlock rooms',()=>{
  let s=solve(0),p=completeLevel(loadProgress(null),s);assert.equal(p.best[0].stars,3);s={...s,steps:8};assert.deepEqual(completeLevel(p,s),p);s={...s,hints:1};assert.equal(stars(s),2);s.steps=30;assert.equal(stars(s),1);
  const untouched=loadProgress(null);assert.equal(completeLevel(untouched,createState()),untouched);
  for(const raw of [null,'bad','{}','{"unlocked":99}','{"best":{"0":{"stars":7,"steps":1}}}','{"best":{"0":{"stars":3,"steps":-1}}}'])assert.deepEqual(loadProgress(raw),untouched);
  assert.equal(loadProgress('{"best":{"7":{"stars":3,"steps":14}}}').unlocked,0);
  assert.equal(createState(-5).levelIndex,0);assert.equal(createState(Infinity).levelIndex,0);assert.equal(key({x:2,y:3}),'2,3');
});
test('every level has bounded, nonoverlapping starting objects and exactly matching cargo goals',()=>{
  for(const l of LEVELS){const occupied=new Set();for(const p of [...l.furniture,...l.cargo,...l.walls]){assert.ok(p.x>0&&p.y>0&&p.x<l.width-1&&p.y<l.height-1,`${l.name}: bounds ${key(p)}`);assert.ok(!occupied.has(key(p)),`${l.name}: overlap ${key(p)}`);occupied.add(key(p));}for(const kind of ['box','wardrobe'])assert.equal(l.cargo.filter(c=>c.kind===kind).length,l.goals.filter(g=>g.kind===kind).length);assert.ok(l.solution.length>0);assert.ok(l.par<l.budget);}
});
test('vacuum pulls light cargo, cannot pull into its own cell and does not mutate the previous state',()=>{
 let s=act(createState(8),{type:'possess',id:'vacuum'}),before=JSON.stringify(s);s=act(s,{type:'ability'});assert.equal(s.cargo[0].x,4);assert.equal(s.steps,1);assert.ok(before.includes('"x":5'));
 s=act(s,{type:'ability'});s=act(s,{type:'move',direction:1});const blocked=act(s,{type:'ability'});assert.equal(blocked.steps,s.steps);assert.equal(blocked.cargo[0].x,3);
});
test('bed jumps a light parcel over a partition, but rejects heavy parcels and occupied landings',()=>{
 let s=act(createState(9),{type:'possess',id:'bed'}),jump=act(s,{type:'ability'});assert.equal(jump.cargo[0].x,5);assert.ok(jump.cargo[0].delivered);assert.equal(jump.effect.kind,'jump');assert.equal(s.cargo[0].x,3);
 s.cargo[0].kind='wardrobe';assert.equal(act(s,{type:'ability'}).steps,0);s.cargo[0].kind='box';s.furniture.push({id:'block',kind:'sofa',x:5,y:2,direction:0});assert.equal(act(s,{type:'ability'}).steps,0);
});
test('lamp gates block wind and walking until opened, cannot close on actors and restore with undo',()=>{
 let s=act(createState(10),{type:'possess',id:'lamp'}),opened=act(s,{type:'ability'});assert.equal(s.powered,false);assert.equal(opened.powered,true);assert.equal(act(opened,{type:'undo'}).powered,false);
 opened.furniture[1]={...opened.furniture[1],x:6,y:2};const blocked=act(opened,{type:'ability'});assert.equal(blocked.powered,true);assert.equal(blocked.steps,1);
 let walk=act(createState(10),{type:'possess',id:'sofa'});walk.furniture[1]={...walk.furniture[1],x:5,y:2};assert.equal(act(walk,{type:'move',direction:1}).steps,0);
});
test('desk carries wardrobes through turns, refuses blocked unloading and undo restores both cargo and carrier',()=>{
 let s=act(createState(11),{type:'possess',id:'cart'});s=act(s,{type:'ability'});assert.deepEqual(s.carry,{cargoId:'a',furnitureId:'cart'});assert.equal(s.cargo[0].x,3);assert.equal(s.cargo[0].delivered,false);
 s=act(s,{type:'move',direction:2});assert.equal(s.cargo[0].y,3);s=act(s,{type:'face',direction:1});s.cargo[1]={...s.cargo[1],x:4,y:3};assert.equal(act(s,{type:'ability'}).steps,s.steps);
 s=act(s,{type:'undo'});assert.equal(s.cargo[0].y,2);assert.ok(s.carry);s=act(s,{type:'undo'});assert.equal(s.carry,null);assert.equal(s.cargo[0].x,4);
});
test('completed eight-room saves continue into the new chapter, and large houses require longer multi-parcel runs',()=>{
 const old={unlocked:7,best:{}};for(let i=0;i<8;i++)old.best[i]={stars:3,steps:LEVELS[i].par};const loaded=loadProgress(JSON.stringify(old));assert.equal(loaded.unlocked,8);assert.deepEqual(loaded.best,old.best);
 assert.equal(LEVELS.length,24);assert.equal(new Set(LEVELS.flatMap(l=>l.furniture.map(f=>f.kind))).size,7);assert.ok(LEVELS.slice(16).every(l=>l.cargo.length>=4&&l.par>=30));assert.ok(LEVELS.reduce((n,l)=>n+l.par,0)>600);
});
