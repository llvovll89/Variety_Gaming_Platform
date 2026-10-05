import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled=await build({entryPoints:['src/games/fantasy-tactics/game.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {Battle,STAGES,FINAL_STAGE,key,restore,serialize}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const playing=(stage=3)=>{const b=new Battle(stage);while(b.phase==='intro')b.advanceDialogue();return b;};

test('every chapter starts on valid terrain and supports saving both intro and first player turn',()=>{
  for(let stage=0;stage<STAGES.length;stage++){const b=new Battle(stage);assert.ok(restore(serialize(b)),`intro ${stage}`);while(b.phase==='intro')b.advanceDialogue();assert.ok(restore(serialize(b)),`player ${stage}`);}
});

test('completed part-one saves continue into all three sea chapters with growth, equipment and optional quests intact',()=>{
  const b=playing(2);b.units.find(u=>u.role==='boss').hp=0;b.checkResult();b.phase='ending';
  b.allies[0].level=5;b.allies[0].promoted=true;b.allies[0].training='reach';b.sideCompleted=[0,1];
  const old=JSON.parse(serialize(b));delete old.cutBridges;delete old.burning;
  const saved=restore(JSON.stringify(old));assert.ok(saved);assert.ok(saved.continuePartTwo());assert.equal(saved.phase,'camp');assert.equal(saved.startSideQuest(),null);
  assert.ok(restore(serialize(saved)));const next=saved.nextStage();assert.equal(next.stage,3);assert.equal(next.allies[0].level,5);assert.ok(next.allies[0].promoted);assert.equal(next.allies[0].training,'reach');assert.deepEqual(next.sideCompleted,[0,1]);assert.deepEqual(next.loadouts,b.loadouts);
  assert.equal(STAGES.length,6);assert.equal(FINAL_STAGE,5);assert.equal(playing(4).bossName,'레벤');assert.equal(playing(5).bossName,'아스트라');
});

test('cutting an empty adjacent fragile bridge consumes one action and keeps a reachable permanent crossing',()=>{
  for(const stage of [3,4]){
    const b=playing(stage);b.actor.x=4;b.actor.y=5;const bridge={x:5,y:5};
    assert.ok(b.targets('cut').some(t=>key(t)===key(bridge)));assert.ok(b.act(bridge,'cut'));assert.equal(b.tile(bridge).terrain,'water');assert.ok(b.actor.acted);assert.equal(b.canUndo(),false);assert.equal(b.act(bridge,'cut'),false);
    const saved=restore(serialize(b));assert.ok(saved,`stage ${stage}`);assert.equal(saved.tile(bridge).terrain,'water');assert.equal(saved.tile({x:5,y:6}).terrain,'bridge');
    assert.ok([...saved.paths(saved.actor).values()].some(path=>path.some(p=>p.x===6)));
    const retry=saved.retryStage();assert.deepEqual(retry.cutBridges,[]);assert.equal(retry.tile(bridge).terrain,'bridge');
  }
});

test('occupied, permanent, distant and first-part bridges cannot be cut and never spend an action',()=>{
  const b=playing();b.actor.x=4;b.actor.y=5;const enemy=b.units.find(u=>u.team==='enemy');enemy.x=5;enemy.y=5;
  assert.equal(b.act(enemy,'cut'),false);assert.equal(b.actor.acted,false);enemy.x=6;
  assert.equal(b.act({x:5,y:6},'cut'),false);assert.equal(b.actor.acted,false);b.actor.x=1;assert.equal(b.act({x:5,y:5},'cut'),false);
  assert.equal(playing(0).act({x:5,y:5},'cut'),false);
});

test('cutting a bridge removes affected undo routes and preserves valid save state',()=>{
  const b=playing(3);b.units.filter(u=>u.team==='enemy').forEach(u=>{u.x=9;u.y=1+Number(u.id.split('-')[1]);});
  b.actor.x=4;b.actor.y=5;assert.ok(b.moveTo({x:6,y:5}));const other=b.allies[1];b.selected=other.id;other.x=4;other.y=5;
  assert.ok(b.act({x:5,y:5},'cut'));assert.equal(b.routes.arin,undefined);assert.ok(restore(serialize(b)));
});

test('push moves one cell, respects blocked landings and applies extra cliff damage',()=>{
  const b=playing(5),enemy=b.units.find(u=>u.team==='enemy');b.actor.x=8;b.actor.y=6;enemy.x=8;enemy.y=7;const hp=enemy.hp;
  assert.ok(b.preview(enemy,'push').includes('낙하'));assert.ok(b.act(enemy,'push'));assert.equal(enemy.y,8);assert.equal(enemy.hp,hp-26);assert.equal(b.actor.acted,true);assert.ok(restore(serialize(b)));
  const blocked=playing(3),target=blocked.units.find(u=>u.team==='enemy');blocked.actor.x=6;blocked.actor.y=4;target.x=7;target.y=4;blocked.allies[1].x=8;blocked.allies[1].y=4;
  assert.equal(blocked.act(target,'push'),false);assert.equal(blocked.actor.acted,false);assert.equal(target.x,7);
});

test('sea knockback defeats normal enemies but bosses resist and board-edge falls remain saveable',()=>{
  for(const outside of [false,true]){
    const b=playing(4),enemy=b.units.find(u=>u.team==='enemy');b.actor.x=outside?2:2;b.actor.y=outside?1:2;enemy.x=2;enemy.y=outside?0:1;
    if(outside){b.tiles.find(t=>t.x===2&&t.y===0).terrain='stone';enemy.y=0;}
    assert.ok(b.act(enemy,'push'));assert.equal(enemy.hp,0);assert.ok(restore(serialize(b)));
  }
  const b=playing(4),boss=b.units.find(u=>u.role==='boss');b.actor.x=8;b.actor.y=4;assert.equal(b.act(boss,'push'),false);assert.equal(b.actor.acted,false);assert.ok(b.preview(boss,'push').includes('면역'));
});

test('fire hurts both teams at the end of the player turn, respects wards, expires, and saves countdowns',()=>{
  const b=playing(3);b.actor.x=6;b.actor.y=4;const ally=b.allies[1];ally.x=7;ally.y=4;ally.ward=2;const hp=ally.hp;
  assert.ok(b.act(ally,'ignite'));assert.ok(b.actor.acted);const restored=restore(serialize(b));assert.ok(restored);assert.equal(restored.burning[0].turns,2);
  b.endTurn();assert.equal(ally.hp,hp-5);assert.equal(b.burning[0].turns,1);
  b.phase='player';b.endTurn();assert.equal(ally.hp,hp-10);assert.equal(b.burning.length,0);
  const enemyCase=playing(3),enemy=enemyCase.units.find(u=>u.team==='enemy');enemyCase.actor.x=6;enemyCase.actor.y=4;enemy.x=7;enemy.y=4;const enemyHp=enemy.hp;
  assert.ok(enemyCase.act(enemy,'ignite'));enemyCase.endTurn();assert.equal(enemy.hp,enemyHp-8);
});

test('fire can resolve victory or defeat before enemy AI and cannot ignite water, bridges or repeat an existing fire',()=>{
  const b=playing(3);b.actor.x=6;b.actor.y=4;assert.equal(b.act({x:5,y:4},'ignite'),false);assert.equal(b.act({x:5,y:5},'ignite'),false);assert.equal(b.actor.acted,false);
  const enemy=b.units.find(u=>u.team==='enemy');b.units.filter(u=>u.team==='enemy'&&u!==enemy).forEach(u=>u.hp=0);enemy.x=7;enemy.y=4;enemy.hp=7;
  assert.ok(b.act(enemy,'ignite'));assert.equal(b.environmentAction(enemy,'ignite'),false);b.endTurn();assert.equal(b.phase,'won');assert.equal(b.aiStep(),false);assert.ok(restore(serialize(b)));
  const loss=playing(3);loss.actor.x=7;loss.actor.y=4;loss.allies.slice(1).forEach(u=>u.hp=0);loss.actor.hp=1;assert.ok(loss.act(loss.actor,'ignite'));assert.equal(loss.phase,'lost');assert.ok(restore(serialize(loss)));
});

test('flame magic ignites its grassy area while frost magic does not',()=>{
  for(const mode of ['skill0','skill1']){
    const b=playing(3);b.selected='ria';b.actor.x=6;b.actor.y=4;const target=b.units.find(u=>u.team==='enemy');target.x=7;target.y=4;
    assert.ok(b.act(target,mode));assert.equal(b.burning.length>0,mode==='skill0');assert.ok(restore(serialize(b)));
  }
});

test('invalid environment saves are rejected and final chapter ending round-trips',()=>{
  for(const mutate of [d=>d.cutBridges=[{x:5,y:6}],d=>d.burning=[{x:5,y:2,turns:2}],d=>d.burning=[{x:7,y:5,turns:9}],d=>d.burning=[{x:7,y:5,turns:1},{x:7,y:5,turns:2}],d=>{d.units[0].x=5;d.units[0].y=5;d.cutBridges=[{x:5,y:5}];}]){
    const d=JSON.parse(serialize(playing(3)));mutate(d);assert.equal(restore(JSON.stringify(d)),null);
  }
  const final=playing(FINAL_STAGE);final.units.find(u=>u.role==='boss').hp=0;final.checkResult();final.phase='ending';assert.ok(restore(serialize(final)));assert.equal(final.continuePartTwo(),false);assert.equal(final.nextStage(),null);
});
