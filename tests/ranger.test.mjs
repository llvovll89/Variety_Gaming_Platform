import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld, stepWorld, spawnEnemy, chooseUpgrade, choosePromotion, nextStage, DIFFICULTIES, PLAYER_RADIUS, STAGES} from '../src/games/hachuping-dodge/survivor/world.ts';
import {ADVANCE_LEVELS,promotionOptions} from '../src/games/hachuping-dodge/survivor/classes.ts';
const still={x:0,y:0};
function isolated(){const w=createWorld('playing','easy');w.spawnTimer=999;return w;}
test('auto fire kills a nearby enemy and its gem awards experience',()=>{
  const w=isolated(),e=spawnEnemy(w,'soldier');e.x=680;e.y=420;e.speed=0;
  for(let i=0;i<120;i++)stepWorld(w,1/60,still);
  assert.equal(w.kills,1);assert.equal(w.enemies.length,0);assert.equal(w.xp,5);assert.equal(w.gems.length,0);
});
test('level up freezes combat and a selected upgrade applies only once',()=>{
  const w=isolated();w.xp=12;stepWorld(w,.01,still);assert.equal(w.status,'upgrade');assert.equal(w.level,2);
  const time=w.time;stepWorld(w,1,still);assert.equal(w.time,time);
  w.choices=['damage','haste','vitality'];chooseUpgrade(w,'damage');assert.equal(w.player.damage,22.5);assert.equal(w.status,'playing');
  chooseUpgrade(w,'damage');assert.equal(w.player.damage,22.5);
});
test('all upgrades change effective combat stats and preserve surplus XP',()=>{
  for(const key of ['damage','haste','vitality','speed','multishot','magnet']){
    const w=isolated();w.status='upgrade';w.choices=[key];const before={...w.player};chooseUpgrade(w,key);
    assert.notDeepEqual(w.player,before);assert.equal(w.upgrades[key],1);
  }
  const w=isolated();w.xp=100;stepWorld(w,.01,still);const surplus=w.xp;chooseUpgrade(w,w.choices[0]);
  assert.equal(w.status,'upgrade');assert.equal(w.level,3);assert.ok(w.xp<surplus);
});
test('elite gates the boss and telegraphs a radial attack',()=>{
  const w=isolated();w.stageTime=61;stepWorld(w,.01,still);
  assert.ok(w.enemies.some(e=>e.kind==='elite'));assert.ok(!w.bossSpawned);
  const elite=w.enemies[0];elite.cooldown=.5;stepWorld(w,.01,still);assert.ok(elite.charge>0);
  elite.cooldown=0;stepWorld(w,.01,still);assert.equal(w.shots.filter(s=>s.hostile).length,7);
  elite.hp=0;stepWorld(w,.01,still);stepWorld(w,.01,still);assert.ok(w.bossSpawned);
});
test('stage clear preserves growth, heals, and final boss ends in victory',()=>{
  const w=isolated();w.level=ADVANCE_LEVELS[1];w.status='promotion';
  while(w.status==='promotion')choosePromotion(w,promotionOptions(w.loadout.hero,w.job)[0].id);
  w.xpNext=999;w.player.damage=64;w.player.hp=21;
  for(let stage=0;stage<STAGES.length;stage++){
    w.xp=0;const boss=spawnEnemy(w,'boss');boss.hp=0;stepWorld(w,.01,still);
    assert.equal(w.status,stage===STAGES.length-1?'victory':'clear');
    if(stage<STAGES.length-1){nextStage(w);assert.equal(w.stage,stage+1);assert.equal(w.player.damage,64);assert.equal(w.player.hp,w.player.maxHp);assert.equal(w.level,ADVANCE_LEVELS[1]);assert.equal(w.enemies.length,0);}
  }
});
test('contact damage has invulnerability frames and death stops the world',()=>{
  const w=isolated(),e=spawnEnemy(w,'soldier');e.x=w.player.x;e.y=w.player.y;e.speed=0;
  stepWorld(w,.01,still);assert.equal(w.player.hp,90);stepWorld(w,.01,still);assert.equal(w.player.hp,90);
  w.player.invincible=0;w.player.hp=1;stepWorld(w,.01,still);assert.equal(w.status,'dead');assert.equal(w.player.hp,0);
  const time=w.time;stepWorld(w,1,still);assert.equal(w.time,time);
});
test('paused and completed worlds cannot move or spawn',()=>{
  for(const state of ['menu','paused','upgrade','promotion','clear','dead','victory']){const w=createWorld(state);stepWorld(w,1,{x:1,y:1});assert.equal(w.time,0);assert.equal(w.player.x,600);assert.equal(w.enemies.length,0);}
});
test('simultaneous elite kill cannot revive a defeated player',()=>{
  const w=isolated();w.player.hp=1;const e=spawnEnemy(w,'elite');e.x=w.player.x;e.y=w.player.y;e.hp=0;
  w.shots.push({x:w.player.x,y:w.player.y,vx:0,vy:0,life:1,damage:10,hostile:true,radius:5});
  stepWorld(w,.01,still);assert.equal(w.status,'dead');assert.equal(w.player.hp,0);
});
test('sword hits a front arc but cannot hit distant or rear targets',()=>{
  const w=isolated();w.loadout.weapon='sword';
  const enemies=[[70,0],[80,30],[-70,0],[180,0]].map(([x,y])=>{const e=spawnEnemy(w,'golem');e.x=w.player.x+x;e.y=w.player.y+y;e.speed=0;return e;});
  stepWorld(w,.01,still);
  assert.ok(enemies[0].hp<enemies[0].maxHp);assert.ok(enemies[1].hp<enemies[1].maxHp);
  assert.equal(enemies[2].hp,enemies[2].maxHp);assert.equal(enemies[3].hp,enemies[3].maxHp);
  assert.equal(w.attacks[0].kind,'sword');assert.equal(w.shots.length,0);
});
test('laser pierces aligned enemies and misses enemies outside its beam',()=>{
  const w=isolated();w.loadout.weapon='laser';
  const enemies=[[100,0],[220,0],[220,80]].map(([x,y])=>{const e=spawnEnemy(w,'golem');e.x=w.player.x+x;e.y=w.player.y+y;e.speed=0;return e;});
  stepWorld(w,.01,still);
  assert.ok(enemies[0].hp<enemies[0].maxHp);assert.ok(enemies[1].hp<enemies[1].maxHp);assert.equal(enemies[2].hp,enemies[2].maxHp);
  assert.equal(w.attacks[0].kind,'laser');
});
test('robot shotgun emits seven distinct short range pellets and loadout survives stage changes',()=>{
  const w=createWorld('playing','easy',{weapon:'shotgun',hero:'robot',tint:'violet'});w.spawnTimer=999;
  const e=spawnEnemy(w,'golem');e.x=w.player.x+200;e.y=w.player.y;e.speed=0;
  stepWorld(w,.01,still);assert.equal(w.shots.length,7);assert.equal(new Set(w.shots.map(s=>s.vy)).size,7);assert.ok(w.shots.every(s=>s.life<.5));
  w.status='clear';nextStage(w);assert.deepEqual(w.loadout,{weapon:'shotgun',hero:'robot',tint:'violet'});assert.equal(w.attacks.length,0);
});
test('new enemy archetypes have distinct speed, durability and contact damage',()=>{
  const w=isolated();const bat=spawnEnemy(w,'bat'),slime=spawnEnemy(w,'slime'),golem=spawnEnemy(w,'golem');
  assert.ok(bat.speed>slime.speed && slime.speed>golem.speed);assert.ok(bat.hp<slime.hp && slime.hp<golem.hp);
  w.fireTimer=999;golem.x=w.player.x;golem.y=w.player.y;stepWorld(w,.01,still);assert.equal(w.player.hp,78);
});
test('spawns stay separated from player even at arena corners',()=>{
  for(const [x,y] of [[28,45],[1172,772],[600,420]]){const w=isolated();w.player.x=x;w.player.y=y;for(let i=0;i<200;i++){const e=spawnEnemy(w,'soldier');assert.ok(Math.hypot(e.x-x,e.y-y)>=280);}}
});
test('higher difficulties increase actual spawn density, durability, speed, damage and boss fire',()=>{
  let previous={count:0,hp:0,speed:0,damage:0,bullets:0,projectile:0};
  for(const difficulty of Object.keys(DIFFICULTIES)){
    const w=createWorld('playing',difficulty);w.fireTimer=999;w.player.invincible=999;
    for(let i=0;i<200;i++)stepWorld(w,.05,still);
    const count=w.enemies.length;
    w.enemies=[];w.shots=[];w.spawnTimer=999;
    const boss=spawnEnemy(w,'boss');boss.x=w.player.x;boss.y=w.player.y;boss.cooldown=0;w.player.invincible=0;
    stepWorld(w,.01,still);
    const result={count,hp:boss.maxHp,speed:boss.speed,damage:100-w.player.hp,bullets:w.shots.filter(s=>s.hostile).length,projectile:DIFFICULTIES[difficulty].projectile};
    // Place the player outside the firing origin when counting bullets separately.
    w.shots=[];w.player.x=100;boss.cooldown=0;stepWorld(w,.01,still);result.bullets=w.shots.filter(s=>s.hostile).length;
    for(const key of Object.keys(result))assert.ok(result[key]>previous[key],`${difficulty} ${key}`);
    previous=result;
    w.status='clear';nextStage(w);assert.equal(w.difficulty,difficulty);
  }
});
test('smaller bodies use smaller hitboxes and fast bullets cannot tunnel through enemies',()=>{
  const w=isolated(),e=spawnEnemy(w,'soldier');e.x=w.player.x+25;e.y=w.player.y;e.speed=0;w.fireTimer=999;
  assert.ok(e.radius<19);assert.ok(PLAYER_RADIUS<14);
  stepWorld(w,.01,still);assert.equal(w.player.hp,100);
  w.shots=[{x:e.x-30,y:e.y,vx:1200,vy:0,life:1,damage:100,hostile:false,radius:3}];
  stepWorld(w,.05,still);assert.equal(w.kills,1);
});
