import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['src/games/fantasy-tactics/game.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { Battle, FINAL_STAGE, SKILLS, STAGES, key, distance, restore, serialize } = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const playing = (stage = 0) => { const b = new Battle(stage); while (b.phase === 'intro') b.advanceDialogue(); return b; };
const gearBuild=await build({entryPoints:['src/games/fantasy-tactics/equipment.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {EQUIPMENT,TREASURES,START_GEAR}=await import('data:text/javascript;base64,'+Buffer.from(gearBuild.outputFiles[0].text).toString('base64'));
const camping=()=>{const b=playing();b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.checkResult();b.enterCamp();return b;};

test('promotion is camp-only at level three, chooses a permanent upgrade and unlocks hidden skills at five',()=>{
  const b=camping();
  for(const u of b.allies){
    b.selected=u.id;assert.equal(b.promote(u.id,'power'),false);assert.equal(b.skill('skill2'),undefined);assert.equal(b.act(u,'skill2'),false);
    b.gainXp(u,160);assert.equal(u.level,3);const base=b.skill('skill0').power;
    assert.ok(b.promote(u.id,'power'));assert.ok(b.skill('skill0').power>base);assert.equal(b.promote(u.id,'reach'),false);
    assert.equal(b.skills(u).length,2);b.gainXp(u,160);assert.equal(b.skills(u).length,3);assert.ok(b.skill('skill2'));
  }
  const next=b.nextStage(),saved=restore(serialize(next));assert.ok(saved);assert.ok(saved.allies.every(u=>u.promoted&&u.training==='power'&&u.level===5));
  assert.equal(next.promote('arin','reach'),false);
  const old=JSON.parse(serialize(playing()));old.units.forEach(u=>{delete u.promoted;delete u.training;});assert.ok(restore(JSON.stringify(old)));
});

test('reach promotion extends line length, ranged skills, and hidden skills execute with mana costs',()=>{
  const b=camping();b.allies.forEach(u=>{b.gainXp(u,320);b.promote(u.id,'reach');});const next=b.nextStage();while(next.phase==='intro')next.advanceDialogue();
  next.selected='arin';assert.equal(next.area({x:3,y:5},'skill0').length,3);
  next.selected='theo';assert.equal(next.area({x:3,y:6},'skill0').length,4);
  next.selected='ria';assert.equal(next.skill('skill0').range,5);
  const enemy=next.units.find(u=>u.team==='enemy');enemy.x=3;enemy.y=5;const mana=next.actor.mp;assert.ok(next.act(enemy,'skill2'));assert.equal(next.actor.mp,mana-10);
  next.selected='noah';next.allies[0].hp=1;assert.ok(next.act(next.allies[0],'skill2'));assert.ok(next.allies[0].hp>1);assert.ok(restore(serialize(next)));
});

test('rescue side quest requires three rescues, survives saves and returns to camp with one-time rewards',()=>{
  const camp=camping();let b=camp.startSideQuest();assert.ok(b);assert.equal(b.sideQuest,true);while(b.phase==='intro')b.advanceDialogue();
  assert.equal(b.rescue('child'),false);b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.checkResult();assert.equal(b.phase,'player');
  for(const [i,v] of b.civilians.entries()){b.selected=b.allies[i].id;b.actor.x=v.x-1;b.actor.y=v.y;assert.ok(b.rescue(v.id));assert.equal(b.rescue(v.id),false);const loaded=restore(serialize(b));assert.ok(loaded);b=loaded;}
  assert.equal(b.phase,'won');const xp=b.allies.map(u=>u.xp),levels=b.allies.map(u=>u.level);const returned=b.returnFromSideQuest();assert.equal(returned.phase,'camp');assert.equal(returned.startSideQuest(),null);assert.deepEqual(returned.allies.map(u=>u.xp),xp);assert.deepEqual(returned.allies.map(u=>u.level),levels);assert.ok(restore(serialize(returned)));assert.ok(restore(serialize(returned.nextStage())));
});

test('rescue deadline fails after eight full turns and allows retry or camp return',()=>{
  let b=camping().startSideQuest();while(b.phase==='intro')b.advanceDialogue();b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);
  for(let i=0;i<8;i++){assert.ok(b.endTurn());b.aiStep();}
  assert.equal(b.phase,'lost');assert.ok(restore(serialize(b)));assert.ok(b.retryStage());assert.equal(b.returnFromSideQuest().phase,'camp');
});

test('both rescue missions can be completed with legal movement and actions before the deadline',()=>{
  let camp=camping();
  for(const stage of [0,1]){
    if(stage===1){camp=camp.nextStage();while(camp.phase==='intro')camp.advanceDialogue();camp.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);camp.checkResult();camp.enterCamp();}
    let b=camp.startSideQuest();while(b.phase==='intro')b.advanceDialogue();
    for(let round=0;round<8&&b.phase!=='won'&&b.phase!=='lost';round++){
      for(const u of b.allies){
        if(b.phase!=='player'||u.hp===0||u.acted)continue;b.selected=u.id;
        const people=b.civilians.filter(v=>!b.rescued.includes(v.id));
        const adjacent=people.find(v=>distance(u,v)<=1&&b.at(v)?.team!=='enemy');
        if(adjacent){b.rescue(adjacent.id);continue;}
        const destinations=b.targets('move').sort((a,c)=>Math.min(...people.map(v=>distance(a,v)))-Math.min(...people.map(v=>distance(c,v))));
        if(destinations[0])assert.ok(b.moveTo(destinations[0]));
        const reachable=people.find(v=>distance(u,v)<=1&&b.at(v)?.team!=='enemy');
        if(reachable)b.rescue(reachable.id);else {
          const mode=['skill0','skill1','attack'].find(m=>{const skill=b.skill(m);return (!skill||skill.effect==='damage'&&u.mp>=b.skillCost(m))&&b.targets(m).some(p=>b.affected(p,m).length);});
          if(mode){const target=b.targets(mode).find(p=>b.affected(p,mode).length);b.act(target,mode);}else b.wait();
        }
      }
      if(b.phase==='player')b.endTurn();while(b.phase==='enemy')b.aiStep();
      assert.ok(restore(serialize(b)));
    }
    assert.equal(b.phase,'won',`stage ${stage}, round ${b.round}: ${b.log.join(' / ')}`);camp=b.returnFromSideQuest();
  }
  assert.ok(camp.allies.every(u=>u.level>=5));
});

test('boss telegraphs fixed cells, hits only those cells, preserves warnings and enters phase two',()=>{
  const b=playing(2);assert.equal(b.bossWarning.length,5);const saved=restore(serialize(b));assert.deepEqual(saved.bossWarning,b.bossWarning);
  const boss=b.units.find(u=>u.role==='boss');boss.hp=Math.floor(boss.maxHp/2);b.checkResult();assert.equal(b.bossPhase,2);
  b.prepareBossWarning();assert.ok(b.bossWarning.length>5);const target=b.allies.find(u=>b.bossWarning.some(p=>key(p)===key(u)));const hp=target.hp;target.ward=2;
  b.units.filter(u=>u.team==='enemy'&&u!==boss).forEach(u=>u.acted=true);b.endTurn();b.units.filter(u=>u.team==='enemy'&&u!==boss).forEach(u=>u.acted=true);b.aiStep();assert.equal(target.hp,hp-21);assert.equal(b.bossWarning.length,0);assert.ok(restore(serialize(b)));
  b.aiStep();assert.ok(b.bossWarning.length>0);
});
const animationBuild = await build({ entryPoints: ['src/games/fantasy-tactics/animation.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { facing, motion, eventDuration, moveDuration } = await import('data:text/javascript;base64,' + Buffer.from(animationBuild.outputFiles[0].text).toString('base64'));

test('animation follows legal path segments and finishes movement before enemy attack', () => {
  const b=playing(); assert.ok(b.moveTo({x:4,y:6}));
  const e=b.lastEvent; assert.equal(e.actorId,'arin'); assert.ok(e.path.length>2);
  for(let i=0;i<e.path.length-1;i++) {
    const m=motion(e,i*130+65); assert.deepEqual(m.from,e.path[i]); assert.deepEqual(m.to,e.path[i+1]); assert.equal(m.fraction,.5);
  }
  assert.equal(motion(e,eventDuration(e)).walking,false);
  assert.deepEqual(['se','nw','sw','ne'],[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].map(p=>facing({x:0,y:0},p)));
  const enemy=b.units.find(u=>u.team==='enemy'); enemy.x=4;enemy.y=4;
  b.endTurn();b.aiStep();const attack=b.lastEvent;
  assert.equal(attack.kind,'damage'); assert.equal(attack.actorId,enemy.id);
  assert.ok(attack.path.length>1);assert.equal(eventDuration(attack),moveDuration(attack)+620);
  assert.equal(motion(attack,moveDuration(attack)+200).actionTime,200);
});

test('area animation retains every affected target and attack origin after defeat', () => {
  const b=playing();b.selected='ria';
  const enemies=b.units.filter(u=>u.team==='enemy');enemies[0].x=3;enemies[0].y=5;enemies[1].x=3;enemies[1].y=6;enemies[0].hp=1;
  assert.ok(b.act(enemies[0],'skill0'));
  assert.equal(b.lastEvent.actorId,'ria');assert.equal(b.lastEvent.mode,'skill0');assert.equal(b.lastEvent.hits.length,2);
  assert.ok(b.lastEvent.hits.some(h=>h.id===enemies[0].id));assert.equal(enemies[0].hp,0);
});

test('intro blocks commands; movement respects river, occupancy, range and unit elevation limits', () => {
  const intro = new Battle(); assert.equal(intro.moveTo({ x: 3, y: 5 }), false); assert.equal(intro.endTurn(), false);
  const b = playing(); const paths = b.paths();
  assert.equal(paths.has('5,4'), false); assert.equal(paths.has('2,6'), false); assert.equal(paths.has('11,9'), false);
  for (const path of paths.values()) {
    assert.ok(path.length - 1 <= b.actor.move);
    path.forEach((p, i) => { assert.notEqual(b.tile(p).terrain, 'water'); if (i) assert.equal(distance(p, path[i - 1]), 1); });
  }
  const high = b.tile({ x: 3, y: 5 }); high.height = 2;
  assert.equal(b.paths().has(key(high)), false);
  assert.equal(b.moveTo({ x: 3, y: 5 }), false);
});

test('movement undo and saved movement retain path, dash and one-action constraints', () => {
  const b = playing(); const u = b.actor; u.x = 0; u.y = 8;
  const enemy = b.units.find(v => v.team === 'enemy'); enemy.x = 4; enemy.y = 8;
  // A straight three-cell approach, ending one cell before the target.
  assert.equal(b.moveTo({ x: 3, y: 8 }), true); assert.equal(b.isDash(u, enemy), true);
  const restored = restore(serialize(b)); assert.ok(restored); assert.equal(restored.isDash(restored.actor, restored.at(enemy)), true);
  assert.equal(restored.undoMove(), true); assert.deepEqual({ x: restored.actor.x, y: restored.actor.y }, { x: 0, y: 8 });
  assert.equal(b.moveTo({ x: 4, y: 7 }), false);
  const normal = { ...u, role: 'healer' }; assert.ok(b.damage(u, enemy) > b.damage(normal, enemy));
  assert.equal(b.act(enemy, 'attack'), true); const hp = enemy.hp;
  assert.equal(b.act(enemy, 'attack'), false); assert.equal(enemy.hp, hp); assert.equal(b.undoMove(), false);
});

test('range, MP and invalid targets never consume an action; AoE damages enemies only', () => {
  const b = playing(); b.selected = 'ria'; const mage = b.actor;
  const enemy = b.units.find(v => v.team === 'enemy'); enemy.x = 3; enemy.y = 5;
  const second = b.units.filter(v => v.team === 'enemy')[1]; second.x = 3; second.y = 6;
  const ally = b.allies.find(u => u.id === 'arin'); ally.x = 2; ally.y = 5;
  const hp = ally.hp, mana = mage.mp;
  assert.equal(b.act({ x: 11, y: 0 }, 'skill0'), false); assert.equal(mage.mp, mana); assert.equal(mage.acted, false);
  mage.mp = 0; assert.equal(b.act(enemy, 'skill0'), false); assert.equal(mage.acted, false); mage.mp = mana;
  assert.equal(b.act(enemy, 'skill0'), true); assert.ok(enemy.hp < enemy.maxHp); assert.ok(second.hp < second.maxHp);
  assert.equal(ally.hp, hp); assert.equal(mage.mp, mana - SKILLS.mage[0].cost);
});

test('switching heroes preserves each movement path; occupied origins cannot be undone', () => {
  const b = playing(), arin = b.actor;
  arin.x = 0; arin.y = 8;
  const enemy = b.units.find(u => u.team === 'enemy'); enemy.x = 4; enemy.y = 8;
  assert.equal(b.moveTo({ x: 3, y: 8 }), true);
  b.selected = 'noah'; assert.equal(b.wait(), true);
  b.selected = 'arin'; assert.equal(b.isDash(arin, enemy), true); assert.equal(b.canUndo(), true);
  const restored = restore(serialize(b)); assert.ok(restored); assert.equal(restored.isDash(restored.actor, restored.at(enemy)), true);
  b.selected = 'theo'; b.actor.x = 0; b.actor.y = 7; assert.equal(b.moveTo({ x: 0, y: 8 }), true);
  b.selected = 'arin'; assert.equal(b.canUndo(), false); assert.equal(b.undoMove(), false); assert.ok(restore(serialize(b)));
  assert.equal(b.isDash(arin, enemy), true);
});

test('healing and potion cap HP and award XP only for effective support', () => {
  const b = playing(); b.selected = 'noah'; const healer = b.actor, ally = b.allies[0];
  assert.equal(b.act(ally, 'skill0'), false); assert.equal(healer.mp, healer.maxMp); assert.equal(healer.xp, 0);
  ally.hp -= 9; assert.equal(b.act(ally, 'skill0'), true); assert.equal(ally.hp, ally.maxHp); assert.equal(healer.xp, 15);
  b.selected = ally.id; ally.hp -= 7; assert.equal(b.potion(), true); assert.equal(ally.hp, ally.maxHp); assert.equal(b.potions, 2);
  assert.equal(b.potion(), false); assert.equal(b.potions, 2);
});

test('ward reduces real damage and expires at subsequent player rounds', () => {
  const b = playing(); b.selected = 'noah'; const ally = b.allies[0], enemy = b.units.find(u => u.team === 'enemy');
  const unguarded = b.damage(enemy, ally); assert.equal(b.act(ally, 'skill1'), true); assert.equal(ally.ward, 2); assert.ok(b.damage(enemy, ally) < unguarded);
  b.endTurn(); let steps = 0; while (b.phase === 'enemy' && steps++ < 20) b.aiStep();
  assert.equal(b.phase, 'player'); assert.equal(ally.ward, 1);
  b.endTurn(); steps = 0; while (b.phase === 'enemy' && steps++ < 20) b.aiStep(); assert.equal(ally.ward, 0);
});

test('elevation changes damage, enemy AI respects walkable cells, and turns reset actions', () => {
  const b = playing(1), enemy = b.units.find(u => u.team === 'enemy');
  enemy.x = 8; enemy.y = 3;
  const lowDamage = b.damage(b.actor, enemy); b.actor.x = 8; b.actor.y = 4; assert.ok(b.damage(b.actor, enemy) > lowDamage);
  b.actor.x = 2; b.actor.y = 5; b.endTurn();
  for (let i = 0; i < 20 && b.phase === 'enemy'; i++) { b.aiStep(); const living = b.units.filter(u => u.hp > 0); assert.equal(new Set(living.map(key)).size, living.length); living.forEach(u => assert.notEqual(b.tile(u).terrain, 'water')); }
  assert.equal(b.round, 2); assert.equal(b.phase, 'player'); assert.ok(b.allies.every(u => !u.acted && !u.moved));
});

test('boss objective ends with remaining enemies; complete party defeat is terminal', () => {
  const b = playing(2); b.moveTo({ x: 3, y: 5 }); b.units.find(u => u.role === 'boss').hp = 0; b.checkResult(); assert.equal(b.phase, 'won'); assert.ok(b.units.some(u => u.team === 'enemy' && u.hp > 0)); assert.ok(restore(serialize(b))); assert.deepEqual(b.routes, {});
  const loss = playing(); loss.allies.forEach(u => { u.hp = 0; }); loss.checkResult(); assert.equal(loss.phase, 'lost'); assert.equal(loss.endTurn(), false); assert.equal(loss.aiStep(), false); assert.equal(loss.moveTo({ x: 3, y: 5 }), false);
});

test('save validation rejects malformed identity, duplicate positions, impossible HP, and forged paths', () => {
  const b = playing(); assert.ok(restore(serialize(b))); assert.equal(restore('broken'), null);
  for (const mutate of [d => { d.version = 9; }, d => { d.units[0].hp = d.units[0].maxHp + 1; }, d => { d.units[0].role = 'boss'; }, d => { d.units[0].x = d.units[1].x; d.units[0].y = d.units[1].y; }, d => { d.stage = 99; }, d => { d.selected = 'missing'; }, d => { d.undo = { id: 'arin', path: [{ x: 0, y: 0 }, { x: 2, y: 5 }] }; }]) {
    const data = JSON.parse(serialize(b)); mutate(data); assert.equal(restore(JSON.stringify(data)), null);
  }
  b.endTurn(); const saved = restore(serialize(b)); assert.equal(saved.phase, 'enemy'); saved.aiStep(); assert.ok(saved.units.some(u => u.team === 'enemy' && u.acted));
});

// A deterministic test commander plays the shipped content, using the same
// actions available to a human. It catches disconnected maps and unwinnable progression.
function commandParty(b) {
  for (const u of b.allies.filter(v => v.hp > 0 && !v.acted)) {
    if (b.phase !== 'player') break;
    b.selected = u.id;
    function options() {
      const candidates = [];
      for (const mode of ['attack', 'skill0', 'skill1']) {
        const skill = b.skill(mode);
        if (mode !== 'attack' && (!skill || u.mp < skill.cost)) continue;
        for (const p of b.targets(mode)) {
          const affected = b.affected(p, mode);
          let score = 0;
          if (skill?.effect === 'heal') score = affected.reduce((sum, v) => sum + (v.hp < v.maxHp * .65 ? Math.min(skill.power, v.maxHp - v.hp) * 2 : 0), 0);
          else if (skill?.effect === 'ward') score = 0;
          else score = affected.reduce((sum, v) => sum + Math.min(b.damage(u, v, mode), v.hp) + (b.damage(u, v, mode) >= v.hp ? 18 : 0), 0);
          if (score > 0) candidates.push({ p, mode, score });
        }
      }
      return candidates.sort((a, d) => d.score - a.score);
    }
    const first = options()[0];
    if (first) { b.act(first.p, first.mode); continue; }
    if (u.hp < u.maxHp * .35 && b.potions) { b.potion(); continue; }
    const enemies = b.units.filter(v => v.team === 'enemy' && v.hp > 0), injured = b.allies.filter(v => v.hp > 0 && v.hp < v.maxHp * .65);
    const goals = u.role === 'healer' && injured.length ? injured : enemies;
    const destinations = [...b.paths(u).values()].map(path => path.at(-1));
    const score = p => Math.min(...goals.map(v => distance(p, v))) + ((u.role === 'mage' || u.role === 'healer') && enemies.some(v => distance(p, v) === 1) ? 3 : 0);
    const destination = destinations.sort((a, d) => score(a) - score(d))[0];
    if (key(destination) !== key(u)) b.moveTo(destination);
    const afterMove = options()[0]; if (afterMove) b.act(afterMove.p, afterMove.mode); else b.wait();
  }
  if (b.phase === 'player') b.endTurn();
}
test('all six chapters can be completed through legal actions with growth, restoration and final boss objective', () => {
  let b = playing(); const results = [];
  for (let stage = 0; stage < STAGES.length; stage++) {
    while (b.phase === 'intro') b.advanceDialogue();
    for (let turns = 0; turns < 60 && !['won', 'lost'].includes(b.phase); turns++) {
      commandParty(b); while (b.phase === 'enemy') b.aiStep();
    }
    results.push({ stage, phase: b.phase, round: b.round, levels: b.allies.map(u => u.level) });
    assert.equal(b.phase, 'won', JSON.stringify(results)); assert.ok(restore(serialize(b)));
    if (stage < STAGES.length - 1) { assert.ok(b.enterCamp()); b = b.nextStage(); assert.ok(b.allies.every(u => u.hp === u.maxHp && u.mp === u.maxMp)); }
  }
  assert.ok(b.allies.some(u => u.level > 1)); assert.equal(b.nextStage(), null);
});

test('camp gates progression, restores party once, preserves growth and allows optional conversations', () => {
  const b=playing();assert.equal(b.enterCamp(),false);assert.equal(b.nextStage(),null);assert.equal(b.talkCamp('ria'),false);
  b.allies[1].hp=0;b.allies[0].hp=8;b.allies[2].mp=0;b.potions=0;
  b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.checkResult();const xp=b.allies.map(u=>u.xp);
  assert.equal(b.nextStage(),null);assert.ok(b.enterCamp());assert.equal(b.phase,'camp');
  assert.ok(b.allies.every(u=>u.hp===u.maxHp&&u.mp===u.maxMp&&!u.acted&&!u.moved&&!u.ward));assert.equal(b.potions,3);
  assert.equal(b.enterCamp(),false);assert.deepEqual(b.allies.map(u=>u.xp),xp);
  assert.equal(b.act({x:3,y:5},'move'),false);assert.equal(b.aiStep(),false);assert.equal(b.endTurn(),false);
  const next=b.nextStage();assert.equal(next.stage,1);assert.equal(next.phase,'intro');assert.equal(next.camp,null);assert.deepEqual(next.allies.map(u=>u.xp),xp);
  const final=playing(FINAL_STAGE);final.units.find(u=>u.role==='boss').hp=0;final.checkResult();assert.equal(final.enterCamp(),false);
});

test('camp saves exact dialogue progress, heard topics and route; old saves still resume', () => {
  const b=playing();const old=JSON.parse(serialize(b));delete old.camp;assert.ok(restore(JSON.stringify(old)));
  b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.checkResult();b.enterCamp();
  assert.ok(b.talkCamp('ria'));b.advanceCamp();const restored=restore(serialize(b));assert.ok(restored);
  assert.equal(restored.phase,'camp');assert.equal(restored.camp.topic,'ria');assert.equal(restored.camp.line,1);
  restored.advanceCamp();restored.advanceCamp();assert.deepEqual(restored.camp.heard,['ria']);assert.equal(restored.camp.topic,null);
  restored.talkCamp('ria');restored.advanceCamp();restored.advanceCamp();restored.advanceCamp();assert.deepEqual(restored.camp.heard,['ria']);
  restored.talkCamp('route');assert.equal(restored.camp.mapSeen,true);assert.equal(restore(serialize(restored)).camp.mapSeen,true);
  for(const mutate of [d=>d.camp=null,d=>d.camp.line=99,d=>d.camp.topic='missing',d=>d.camp.heard=['ria','ria'],d=>d.stage=2,d=>d.units.find(u=>u.team==='enemy').hp=1]){
    const d=JSON.parse(serialize(restored));mutate(d);assert.equal(restore(JSON.stringify(d)),null);
  }
});

test('all five camps complete all conversations safely and reset camp history on departure', () => {
  for (const stage of [0,1,2,3,4]) {
    const b=playing(stage);b.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);b.checkResult();b.enterCamp();
    for(const topic of ['arrival','arin','theo','ria','noah','route']) {
      assert.ok(b.talkCamp(topic));let count=0;
      while(b.camp.topic && count++<10){assert.ok(restore(serialize(b)));assert.ok(b.advanceCamp());}
      assert.ok(count<=3);assert.equal(b.camp.topic,null);assert.ok(b.camp.heard.includes(topic));
    }
    assert.equal(b.camp.heard.length,6);assert.ok(b.camp.mapSeen);
    const next=b.nextStage();assert.equal(next.stage,stage+1);assert.equal(next.camp,null);assert.equal(next.phase,'intro');
  }
});

test('24 distinct equipment items are obtainable and all eighteen chest positions are reachable',()=>{
  assert.equal(EQUIPMENT.length,24);assert.equal(new Set(EQUIPMENT.map(g=>g.id)).size,24);
  assert.equal(EQUIPMENT.filter(g=>g.slot==='weapon').length,12);assert.equal(EQUIPMENT.filter(g=>g.slot==='armor').length,6);
  const obtainable=new Set([...START_GEAR,...TREASURES.flat().flatMap(t=>t.items),'acc-focus','armor-star']);assert.equal(obtainable.size,24);
  for(let stage=0;stage<STAGES.length;stage++){
    const b=playing(stage);assert.equal(b.treasures.length,3);
    const visited=new Set(),queue=[{x:2,y:5}];
    for(let i=0;i<queue.length;i++){const p=queue[i];if(visited.has(key(p)))continue;visited.add(key(p));for(const d of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]){const q={x:p.x+d.x,y:p.y+d.y};if(b.inside(q)&&b.tile(q).terrain!=='water'&&Math.abs(b.tile(q).height-b.tile(p).height)<=1&&!visited.has(key(q)))queue.push(q);}}
    for(const chest of b.treasures){assert.ok(visited.has(key(chest)));assert.notEqual(b.tile(chest).terrain,'water');}
  }
});

test('opening a nearby chest consumes one action, saves loot and cannot be farmed after retry',()=>{
  const b=playing(),chest=b.treasures[0];assert.equal(b.canOpen(chest.id),true);
  assert.equal(b.openChest(b.treasures[2].id),false);assert.equal(b.openChest('missing'),false);
  assert.equal(b.act(chest,'chest'),true);assert.ok(b.actor.acted);assert.ok(b.inventory.includes('sword-iron'));assert.equal(b.potions,4);
  const saved=restore(serialize(b));assert.ok(saved);assert.ok(saved.opened.includes(chest.id));assert.equal(saved.potions,4);
  const retry=b.retryStage();while(retry.phase==='intro')retry.advanceDialogue();assert.equal(retry.openChest(chest.id),false);assert.equal(retry.inventory.filter(id=>id==='sword-iron').length,1);
  assert.equal(b.equip('arin','weapon','sword-iron'),false);
});

test('gear enforces role, ownership and unique assignment without stat accumulation',()=>{
  const b=camping();b.inventory.push('sword-iron','armor-mail','acc-swift');const base=b.actor.attack;
  assert.equal(b.equip('arin','weapon','mage-start'),false);assert.equal(b.equip('arin','weapon','sword-star'),false);
  assert.equal(b.equip('arin','armor','sword-iron'),false);assert.ok(b.equip('arin','weapon','sword-iron'));
  b.equip('arin','weapon','sword-iron');assert.equal(b.stats(b.actor).attack,base+3);assert.equal(b.actor.attack,base);
  assert.ok(b.equip('arin','accessory','acc-swift'));assert.equal(b.stats(b.actor).move,5);assert.equal(b.stats(b.actor).defense,5);
  assert.equal(b.equip('theo','accessory','acc-swift'),false);assert.ok(b.equip('arin','accessory',null));assert.ok(b.equip('theo','accessory','acc-swift'));
  assert.equal(b.equip('ria','armor','armor-mail'),false);
  const next=b.nextStage(),saved=restore(serialize(next));assert.ok(saved);assert.equal(saved.stats(saved.actor).attack,base+3);assert.equal(saved.stats(saved.allies[1]).move,5);
});

test('equipment modifies mana, healing, damage, dash and saved movement range',()=>{
  const b=camping();b.inventory.push('mage-ember','armor-robe','acc-moon','healer-heal','acc-heal','spear-oak','acc-swift');
  b.equip('ria','weapon','mage-ember');b.equip('ria','armor','armor-robe');b.equip('ria','accessory','acc-moon');
  b.equip('noah','weapon','healer-heal');b.equip('noah','accessory','acc-heal');b.equip('theo','weapon','spear-oak');b.equip('arin','accessory','acc-swift');
  const next=b.nextStage();while(next.phase==='intro')next.advanceDialogue();
  next.selected='ria';assert.equal(next.skillCost('skill0'),2);assert.equal(next.skillCost('skill1'),1);
  const enemy=next.units.find(u=>u.team==='enemy');enemy.x=3;enemy.y=5;const mana=next.actor.mp;assert.ok(next.act(enemy,'skill0'));assert.equal(next.actor.mp,mana-2);
  next.selected='noah';const arin=next.allies[0];arin.hp=1;assert.ok(next.preview(arin,'skill0').includes('+38 HP'));assert.ok(next.act(arin,'skill0'));assert.equal(arin.hp,39);
  next.selected='theo';next.actor.x=0;next.actor.y=8;enemy.x=4;enemy.y=8;assert.ok(next.moveTo({x:3,y:8}));const boosted=next.damage(next.actor,enemy);next.loadouts.theo={};assert.ok(boosted>next.damage(next.actor,enemy));
  next.selected='arin';arin.x=0;arin.y=9;assert.ok(next.moveTo({x:5,y:9}));assert.ok(restore(serialize(next)));
});

test('equipment save validation rejects unknown, duplicate and incompatible gear while old saves migrate',()=>{
  const b=camping(),old=JSON.parse(serialize(b));for(const key of ['inventory','loadouts','opened','rewarded'])delete old[key];assert.ok(restore(JSON.stringify(old)));
  for(const mutate of [d=>d.inventory.push('fake'),d=>d.inventory.push(d.inventory[0]),d=>d.loadouts.ria.weapon='sword-start',d=>d.loadouts.theo.armor='armor-star',d=>{d.loadouts.arin.accessory='acc-travel';d.loadouts.theo.accessory='acc-travel';},d=>d.opened=['fake'],d=>d.opened=['tower-road'],d=>d.rewarded=[0,0]]){
    const d=JSON.parse(serialize(b));mutate(d);assert.equal(restore(JSON.stringify(d)),null);
  }
  const before=b.allies.map(u=>u.xp);b.checkResult();assert.deepEqual(b.allies.map(u=>u.xp),before);assert.equal(b.inventory.filter(id=>id==='acc-focus').length,1);
});


test('enemy click approaches along a legal path and attacks once with a combined animation', () => {
  const b = playing(), u = b.actor, enemy = b.units.find(v => v.team === 'enemy');
  const hp = enemy.hp, start = {x:u.x,y:u.y}, legal = b.paths(u);
  assert.ok(b.approachAttack(enemy));
  assert.ok(u.moved); assert.ok(u.acted); assert.ok(enemy.hp < hp);
  const event = b.lastEvent;
  assert.equal(event.kind, 'damage'); assert.deepEqual(event.path[0], start);
  assert.deepEqual(event.path, legal.get(key(u)));
  assert.ok(distance(u,enemy) <= b.attackRange(u));
  const after = enemy.hp; assert.equal(b.approachAttack(enemy), false); assert.equal(enemy.hp,after);
});

test('unreachable enemies and allies do not consume movement or actions', () => {
  const b=playing(), before=serialize(b), enemy=b.units.find(v=>v.team==='enemy' && v.x===9);
  assert.equal(b.approachAttack(enemy),false); assert.equal(serialize(b),before);
  assert.equal(b.approachAttack(b.allies[1]),false); assert.equal(serialize(b),before);
});

test('enemy click after moving attacks in range and refuses an extra move', () => {
  const b=playing(), u=b.actor, enemy=b.units.find(v=>v.team==='enemy');
  assert.ok(b.moveTo({x:4,y:5}));
  const before=serialize(b); assert.equal(b.approachAttack(enemy),false); assert.equal(serialize(b),before);
  enemy.x=5;enemy.y=5;assert.ok(b.approachAttack(enemy));assert.ok(u.acted);
  assert.equal(b.lastEvent.path,undefined);
});

test('ranged enemy click attacks without moving when already in range', () => {
  const b=playing(); b.selected='theo';const u=b.actor, enemy=b.units.find(v=>v.team==='enemy');
  enemy.x=u.x+2;enemy.y=u.y;
  assert.ok(b.approachAttack(enemy));assert.equal(u.moved,false);assert.ok(u.acted);
});
