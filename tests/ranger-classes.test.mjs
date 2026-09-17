import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,stepWorld,spawnEnemy,chooseUpgrade,choosePromotion,nextStage,weaponStats} from '../src/games/hachuping-dodge/survivor/world.ts';
import {HERO_STATS,PATHS,ADVANCE_LEVELS,MAX_LEVEL,levelExperience,promotionOptions} from '../src/games/hachuping-dodge/survivor/classes.ts';
const still={x:0,y:0};
function world(hero='ranger',weapon='rifle') {const w=createWorld('playing','easy',{hero,weapon,tint:'mint'});w.spawnTimer=999;return w;}
function advance(w,path,focus='power') {
  w.level=ADVANCE_LEVELS[w.job.history.length];w.status='promotion';
  const option=promotionOptions(w.loadout.hero,w.job).find(p=>p.path===path&&(p.tier===1||p.focus===focus));
  assert.ok(option);choosePromotion(w,option.id);return option;
}
function target(w,x=90,y=0) {const e=spawnEnemy(w,'golem');e.x=w.player.x+x;e.y=w.player.y+y;e.speed=0;return e;}

test('all character bases differ and only matching weapons get mastery',()=>{
  const builds=Object.keys(HERO_STATS).map(hero=>world(hero));
  assert.equal(new Set(builds.map(w=>JSON.stringify(w.player))).size,4);
  assert.ok(world('ranger').player.speed>world('knight').player.speed);
  assert.ok(world('witch').player.xpBonus>1);
  assert.ok(weaponStats(world('ranger','rifle')).interval<weaponStats(world('witch','rifle')).interval);
  assert.ok(weaponStats(world('knight','sword')).damage>weaponStats(world('ranger','sword')).damage);
  assert.ok(weaponStats(world('witch','laser')).damage>weaponStats(world('robot','laser')).damage);
  assert.equal(weaponStats(world('robot','shotgun')).pellets,7);
  assert.equal(weaponStats(world('ranger','shotgun')).pellets,5);
});
test('all three earned promotions retain normal upgrades, surplus XP and freeze combat',()=>{
  const w=world();w.xp=100000;const promotions=[],upgrades=[];
  for(let i=0;i<150&&w.level<41;i++){
    if(w.status==='playing')stepWorld(w,.01,still);
    else if(w.status==='promotion'){
      const before=structuredClone(w);stepWorld(w,.05,{x:1,y:1});assert.deepEqual(w,before);
      promotions.push(w.level);choosePromotion(w,promotionOptions(w.loadout.hero,w.job)[0].id);
      assert.equal(w.status,'upgrade');
    }else if(w.status==='upgrade'){upgrades.push(w.level);chooseUpgrade(w,w.choices[0]);}
  }
  assert.deepEqual(promotions,[10,25,40]);assert.deepEqual(upgrades,Array.from({length:39},(_,i)=>i+2));
  assert.equal(w.job.history.length,3);assert.equal(promotionOptions(w.loadout.hero,w.job).length,0);assert.ok(w.xp>0);
});
test('early, foreign, repeated and out-of-order promotions cannot apply',()=>{
  const w=world();w.status='promotion';choosePromotion(w,'sniper-1');assert.equal(w.job.history.length,0);
  w.level=10;choosePromotion(w,'paladin-1');assert.equal(w.job.history.length,0);
  choosePromotion(w,'sniper-1');const snapshot=structuredClone(w);choosePromotion(w,'sniper-1');assert.deepEqual(w,snapshot);
  w.level=25;w.status='promotion';choosePromotion(w,'hunter-2-power');assert.equal(w.job.history.length,1);
});
test('level 60 awards its final upgrade once and then stops accumulating XP',()=>{
  const w=world();w.xp=100000;let upgrades=0;
  for(let i=0;i<150;i++){
    if(w.status==='playing')stepWorld(w,.01,still);
    else if(w.status==='promotion')choosePromotion(w,promotionOptions(w.loadout.hero,w.job)[0].id);
    else if(w.status==='upgrade'){upgrades++;chooseUpgrade(w,w.choices[0]);}
  }
  assert.equal(w.level,MAX_LEVEL);assert.equal(upgrades,MAX_LEVEL-1);assert.equal(w.xp,0);assert.equal(w.job.history.length,3);
  w.gems.push({x:w.player.x,y:w.player.y,value:10000});stepWorld(w,.01,still);
  assert.equal(w.level,60);assert.equal(w.status,'playing');assert.equal(w.xp,0);assert.equal(w.gems.length,0);
});
test('later regions reward more experience and new curve reaches third promotion within expedition rewards',()=>{
  const rewards=[];
  for(let stage=0;stage<6;stage++){
    const w=world();w.stage=stage;const e=target(w,300);e.hp=0;stepWorld(w,.01,still);rewards.push(w.gems[0].value);
  }
  for(let i=1;i<rewards.length;i++)assert.ok(rewards[i]>rewards[i-1]);
  const requirement=Array.from({length:39},(_,i)=>levelExperience(i+1)).reduce((a,b)=>a+b,0);
  // A modest mixed-enemy expedition budget: 75 kills per region, 7 base XP on average.
  const budget=Array.from({length:6},(_,stage)=>(75*7+45+90)*(1+stage*.35)).reduce((a,b)=>a+b,0);
  assert.ok(budget>requirement);assert.equal(requirement,4914);
});
test('eight career skills produce actual damage, healing, shields, slow or projectile removal',()=>{
  for(const [path,definition] of Object.entries(PATHS)){
    const w=world(definition.hero);advance(w,path);w.fireTimer=999;w.player.hp=40;
    const e=target(w),health=e.hp;
    w.shots.push({x:w.player.x+60,y:w.player.y,vx:0,vy:0,life:4,damage:10,hostile:true,radius:5});
    stepWorld(w,.01,still);
    assert.equal(w.job.cooldown,definition.cooldown,path);assert.ok(w.attacks.length>0,path);
    if(path==='engineer'){assert.equal(w.player.hp,60);assert.equal(w.shots.length,0);assert.equal(e.hp,health);}
    else assert.ok(e.hp<health,path);
    if(path==='paladin')assert.equal(w.job.shield,35);
    if(path==='berserker')assert.equal(w.player.hp,46);
    if(path==='hunter'||path==='cryomancer')assert.equal(w.job.slow[e.id],3);
    const after=e.hp;stepWorld(w,.01,still);assert.equal(e.hp,after,'cooldown prevents repeated damage');
  }
});
test('power and survival specializations persist through stages and restart resets careers',()=>{
  for(const path of Object.keys(PATHS))for(const focus of ['power','survival']){
    const w=world(PATHS[path].hero);advance(w,path);const hp=w.player.maxHp;
    advance(w,path,focus);advance(w,path,focus);
    assert.equal(w.job.history.length,3);
    if(focus==='power')assert.ok(w.job.power>1.6);else assert.ok(w.player.maxHp>=hp+60);
    const job=structuredClone(w.job);w.status='clear';nextStage(w);assert.deepEqual(w.job.history,job.history);
    assert.equal(w.job.path,path);assert.equal(w.player.hp,w.player.maxHp);
    const fresh=createWorld('playing',w.difficulty,w.loadout);assert.equal(fresh.job.path,null);assert.equal(fresh.job.history.length,0);
  }
});
test('shield absorbs real damage and slow expires without permanently changing base speed',()=>{
  const w=world('knight');advance(w,'paladin');w.fireTimer=999;const e=target(w);stepWorld(w,.01,still);
  e.x=w.player.x;e.y=w.player.y;const hp=w.player.hp,shield=w.job.shield;stepWorld(w,.01,still);
  assert.equal(w.player.hp,hp);assert.ok(w.job.shield<shield);
  const frozen=world('witch');advance(frozen,'cryomancer');frozen.fireTimer=999;const foe=target(frozen,150);foe.speed=50;
  stepWorld(frozen,.01,still);assert.ok(foe.x>frozen.player.x+149.7);
  frozen.job.cooldown=999;frozen.player.invincible=999;
  for(let i=0;i<62;i++)stepWorld(frozen,.05,still);
  assert.equal(frozen.job.slow[foe.id],undefined);assert.equal(foe.speed,50);
});
