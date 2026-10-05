import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['src/games/fantasy-tactics/game.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {Battle,restore,serialize}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
function camp(stage=1){const b=new Battle(stage);b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.phase='won';b.enterCamp();return b;}
test('recruitment gates, four-member swaps, reserves and growth survive saves and departure',()=>{
 const b=camp(0);assert.equal(b.recruit('kai'),false);assert.ok(b.recruit('sera'));assert.equal(b.recruit('sera'),false);assert.ok(b.swapParty('arin','sera'));assert.equal(b.allies.length,4);assert.ok(restore(serialize(b)));const next=b.nextStage();assert.equal(next.reserve[0].id,'arin');assert.equal(next.actor.id,'sera');next.phase='won';next.enterCamp();assert.ok(next.recruit('kai'));assert.equal(next.roster.length,6);next.reserve[0].level=5;assert.ok(next.promote('arin','power'));assert.ok(restore(serialize(next)));next.phase='player';assert.equal(next.swapParty('sera','arin'),false);
});
test('ranger traps spend mana once, stop enemies along their route and persist in saves',()=>{
 const b=camp();b.recruit('sera');b.swapParty('arin','sera');b.phase='player';b.camp=null;b.selected='sera';const u=b.actor,p={x:3,y:5};const mp=u.mp;assert.ok(b.act(p,'skill0'));assert.equal(u.mp,mp-4);assert.ok(restore(serialize(b)));const enemy=b.units.find(u=>u.team==='enemy');enemy.hp=enemy.maxHp;const hp=enemy.hp;assert.ok(b.springTrap(enemy,[{x:4,y:5},p,{x:2,y:5}]));assert.equal(enemy.hp,hp-18);assert.equal(enemy.x,3);assert.ok(enemy.acted);assert.equal(b.traps.length,0);
});
test('shield frontal defense can be bypassed from behind and rogue blink rejects occupied landings',()=>{
 const b=camp(3);b.recruit('kai');b.swapParty('arin','kai');b.phase='player';b.camp=null;b.selected='kai';const u=b.actor,v=b.units.find(u=>u.role==='shield');v.hp=v.maxHp;Object.assign(v,{x:4,y:5});Object.assign(u,{x:3,y:5});const frontal=b.damage(u,v);Object.assign(u,{x:5,y:5});assert.ok(b.damage(u,v)>frontal);Object.assign(u,{x:3,y:5});assert.ok(b.act(v,'skill0'));assert.equal(u.x,5);assert.equal(u.y,5);assert.ok(u.acted);u.acted=false;Object.assign(u,{x:3,y:5});Object.assign(b.allies[1],{x:5,y:5});assert.equal(b.act(v,'skill0'),false);
});
test('water mages extinguish nearby fire; shamans resurrect once and cannot recover drowned enemies',()=>{
 const b=new Battle(3);b.phase='enemy';b.units.filter(u=>u.team==='enemy').forEach(u=>u.acted=true);const water=b.units.find(u=>u.role==='watermage');water.acted=false;b.burning=[{x:water.x,y:water.y,turns:2}];assert.ok(b.aiStep());assert.equal(b.burning.length,0);assert.equal(water.mp,9);
 const shaman=b.units.find(u=>u.role==='shaman'),dead=b.units.find(u=>u.role==='goblin');dead.hp=0;Object.assign(dead,{x:shaman.x+1,y:shaman.y});shaman.acted=false;assert.ok(b.aiStep());assert.equal(dead.hp,Math.ceil(dead.maxHp/2));assert.ok(dead.revived);assert.equal(shaman.mp,0);assert.ok(restore(serialize(b)));dead.hp=0;shaman.mp=4;shaman.acted=false;b.aiStep();assert.equal(dead.hp,0);dead.revived=false;dead.banished=true;shaman.acted=false;b.aiStep();assert.equal(dead.hp,0);
});
