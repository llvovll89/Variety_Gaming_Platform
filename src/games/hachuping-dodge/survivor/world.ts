import { ADVANCE_LEVELS, MAX_LEVEL, levelExperience, HERO_STATS, PATHS, promotionOptions, type JobState } from './classes.ts';
export const WIDTH = 1200, HEIGHT = 800;
export const UNIT_SCALE = .65;
export const PLAYER_RADIUS = 14 * UNIT_SCALE;
export const DIFFICULTIES = {
  easy: { name: '쉬움', description: '여유롭게 성장하는 원정', hp: 1, speed: 1, spawn: 1, damage: 1, projectile: 1, cooldown: 1, extraShots: 0 },
  normal: { name: '보통', description: '더 자주 몰려오는 군단', hp: 1.2, speed: 1.15, spawn: .8, damage: 1.15, projectile: 1.1, cooldown: .9, extraShots: 2 },
  hard: { name: '어려움', description: '빠른 추격과 촘촘한 탄막', hp: 1.55, speed: 1.35, spawn: .55, damage: 1.4, projectile: 1.3, cooldown: .8, extraShots: 4 },
  nightmare: { name: '악몽', description: '끊임없는 증원과 치명적인 공격', hp: 2, speed: 1.55, spawn: .38, damage: 1.7, projectile: 1.5, cooldown: .65, extraShots: 8 },
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;
export function enemyShotCount(w: World, kind: Kind) {
  return kind === 'boss' ? 12 + DIFFICULTIES[w.difficulty].extraShots : kind === 'elite' ? 7 + DIFFICULTIES[w.difficulty].extraShots : 1;
}
export const STAGES = [
  { name: '이끼빛 전초지', subtitle: '숲을 되찾아라', color: '#77cba3', floor: '#172b28', boss: '가시왕 그룸' },
  { name: '잿불의 성채', subtitle: '불타는 군단을 돌파하라', color: '#f4ad73', floor: '#302724', boss: '잿불 군주' },
  { name: '서리의 협곡', subtitle: '얼어붙은 골렘을 돌파하라', color: '#91dce8', floor: '#20353c', boss: '빙하 거인' },
  { name: '독안개의 늪', subtitle: '슬라임의 둥지를 정화하라', color: '#c3d979', floor: '#293323', boss: '늪의 포식자' },
  { name: '수정 심연', subtitle: '어둠 속 날개를 추적하라', color: '#c2a0ed', floor: '#2c233c', boss: '심연의 군주' },
  { name: '월식의 왕좌', subtitle: '마지막 수호자를 쓰러뜨려라', color: '#9ab9ef', floor: '#202a3b', boss: '월식의 파수꾼' },
];
export const WEAPONS = {
  sword: { name: '룬 장검', description: '가까운 적들을 한 번에 베는 부채꼴 참격', range: 125, damage: 2.8, interval: 1.25 },
  rifle: { name: '룬 소총', description: '멀리 있는 적을 빠르고 정확하게 사격', range: 560, damage: 1, interval: 1 },
  laser: { name: '광자 레이저', description: '일직선의 모든 적을 관통하는 광선', range: 620, damage: 1.7, interval: 1.8 },
  shotgun: { name: '산탄총', description: '다섯 발을 퍼뜨리는 강력한 근거리 사격', range: 300, damage: .65, interval: 1.65 },
} as const;
export type Weapon = keyof typeof WEAPONS;
export const HEROES = { ranger: '숲의 레인저', knight: '철갑 기사', witch: '별빛 마도사', robot: '룬 기계병' } as const;
export type Hero = keyof typeof HEROES;
export const TINTS = { mint: '#71bea5', gold: '#e5bd70', violet: '#b599e5', coral: '#e69083' } as const;
export type Tint = keyof typeof TINTS;
export interface Loadout { weapon: Weapon; hero: Hero; tint: Tint }
export const DEFAULT_LOADOUT: Loadout = { weapon: 'rifle', hero: 'ranger', tint: 'mint' };
export interface Attack { x: number; y: number; angle: number; range: number; life: number; kind: 'sword' | 'laser' | 'nova' | 'frost' | 'heal'; color?:string }
export type Status = 'menu' | 'playing' | 'paused' | 'upgrade' | 'promotion' | 'clear' | 'dead' | 'victory';
export type Kind = 'soldier' | 'mage' | 'brute' | 'elite' | 'boss' | 'slime' | 'bat' | 'golem';
export type Upgrade = 'damage' | 'haste' | 'vitality' | 'speed' | 'multishot' | 'magnet';
export const UPGRADES: Record<Upgrade, { name: string; description: string; symbol: string }> = {
  damage: { name: '룬 강화', description: '모든 무기 공격력 +25%', symbol: 'ATK' },
  haste: { name: '전투 가속', description: '공격 속도 +20%', symbol: 'SPD' },
  vitality: { name: '수호자의 심장', description: '최대 체력 +30 · 체력 45 회복', symbol: 'HP' },
  speed: { name: '바람의 발걸음', description: '이동 속도 +12% · 체력 15 회복', symbol: 'MOV' },
  multishot: { name: '분열 룬', description: '공격 +1 · 칼은 범위와 위력 증가 (최대 5)', symbol: 'MULTI' },
  magnet: { name: '영혼 수집가', description: '수집 범위 +45 · 경험치 획득 +15%', symbol: 'EXP' },
};
export interface Enemy { id: number; kind: Kind; x: number; y: number; hp: number; maxHp: number; radius: number; speed: number; cooldown: number; flash: number; angle: number; charge: number }
export interface Shot { x: number; y: number; vx: number; vy: number; damage: number; life: number; hostile: boolean; radius: number }
export interface Gem { x: number; y: number; value: number }
export interface Effect { x: number; y: number; life: number; text: string; color: string }
export interface World {
  job: JobState;
  loadout: Loadout; attacks: Attack[];
  difficulty: Difficulty;
  status: Status; stage: number; time: number; stageTime: number; kills: number; level: number; xp: number; xpNext: number;
  player: { x: number; y: number; hp: number; maxHp: number; damage: number; interval: number; speed: number; shots: number; magnet: number; xpBonus: number; invincible: number; angle: number; armor:number };
  enemies: Enemy[]; shots: Shot[]; gems: Gem[]; effects: Effect[]; choices: Upgrade[]; upgrades: Record<Upgrade, number>;
  spawnTimer: number; fireTimer: number; eliteSpawned: boolean; eliteKilled: boolean; bossSpawned: boolean; nextId: number;
}
export function createWorld(status: Status = 'playing', difficulty: Difficulty = 'normal', loadout: Loadout = DEFAULT_LOADOUT): World {
  const base=HERO_STATS[loadout.hero];
  return { status, difficulty, loadout: { ...loadout }, job:{path:null,history:[],cooldown:0,shield:0,slow:{},power:1}, attacks: [], stage: 0, time: 0, stageTime: 0, kills: 0, level: 1, xp: 0, xpNext: 12,
    player: { x: 600, y: 420, hp: base.hp, maxHp: base.hp, damage: base.damage, interval: base.interval, speed: base.speed, shots: 1, magnet: 105, xpBonus: base.xp, invincible: 0, angle: 0, armor:base.armor },
    enemies: [], shots: [], gems: [], effects: [], choices: [], upgrades: { damage: 0, haste: 0, vitality: 0, speed: 0, multishot: 0, magnet: 0 },
    spawnTimer: .5, fireTimer: 0, eliteSpawned: false, eliteKilled: false, bossSpawned: false, nextId: 1 };
}
const distance = (a: {x:number;y:number}, b: {x:number;y:number}) => Math.hypot(a.x-b.x, a.y-b.y);
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
export function spawnEnemy(w: World, kind: Kind): Enemy {
  const angle = Math.random() * Math.PI * 2, p = w.player;
  let x = clamp(p.x + Math.cos(angle) * 490, 25, WIDTH - 25);
  let y = clamp(p.y + Math.sin(angle) * 490, 40, HEIGHT - 25);
  if (distance({x,y}, p) < 280) { x = p.x < WIDTH / 2 ? WIDTH - 35 : 35; y = p.y < HEIGHT / 2 ? HEIGHT - 35 : 35; }
  const difficulty = DIFFICULTIES[w.difficulty];
  const hp = Math.round(({ soldier: 30, mage: 25, brute: 85, elite: 430, boss: 1100, slime: 38, bat: 18, golem: 140 }[kind]) * (1 + w.stage * .5) * difficulty.hp);
  const enemy: Enemy = { id: w.nextId++, kind, x, y, hp, maxHp: hp, radius: { soldier: 19, mage: 18, brute: 26, elite: 35, boss: 49, slime: 23, bat: 16, golem: 32 }[kind] * UNIT_SCALE, speed: ({ soldier: 65, mage: 46, brute: 40, elite: 62, boss: 42, slime: 48, bat: 115, golem: 28 }[kind] + w.stage * 5) * difficulty.speed, cooldown: 2.5 * difficulty.cooldown, flash: 0, angle: 0, charge: 0 };
  w.enemies.push(enemy); return enemy;
}
function offerPromotion(w:World) {
  const required=ADVANCE_LEVELS[w.job.history.length];
  if(required!==undefined && w.level>=required) { w.status='promotion'; return true; }
  return false;
}
export function choosePromotion(w:World,id:string) {
  if(w.status!=='promotion' || w.level<(ADVANCE_LEVELS[w.job.history.length]??Infinity))return;
  const choice=promotionOptions(w.loadout.hero,w.job).find(option=>option.id===id);
  if(!choice)return;
  const p=w.player;
  w.job.path=choice.path;w.job.history.push(choice);w.job.cooldown=0;
  if(choice.path==='sniper')p.damage*=1.15;
  if(choice.path==='hunter'){p.speed*=1.08;p.magnet+=25;}
  if(choice.path==='berserker')p.damage*=1.18;
  if(choice.path==='paladin'){p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25);}
  if(choice.path==='pyromancer')p.damage*=1.2;
  if(choice.path==='cryomancer')p.armor=Math.min(.65,p.armor+.08);
  if(choice.path==='artillery')p.interval/=1.12;
  if(choice.path==='engineer'){p.maxHp+=20;p.hp=Math.min(p.maxHp,p.hp+20);p.magnet+=20;}
  if(choice.tier>1){
    if(choice.focus==='power')w.job.power+=.35;
    else {p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30);p.armor=Math.min(.65,p.armor+.05);}
  }
  // A promotion never consumes the regular upgrade earned at this level.
  w.status='playing';
  if(offerPromotion(w))return;
  if(w.choices.length)w.status='upgrade';else offerUpgrade(w);
}
export function weaponStats(w:World) {
  const {weapon,hero}=w.loadout;
  return { damage:WEAPONS[weapon].damage*((hero==='knight'&&weapon==='sword')||(hero==='witch'&&weapon==='laser')?1.25:1),
    interval:WEAPONS[weapon].interval/(hero==='ranger'&&weapon==='rifle'?1.2:1),
    pellets:weapon==='shotgun'?(hero==='robot'?7:5):1 };
}
function offerUpgrade(w: World) {
  if(offerPromotion(w))return;
  if(w.level>=MAX_LEVEL){w.xp=0;return;}
  if (w.xp < w.xpNext) return;
  w.xp -= w.xpNext; w.level++; w.xpNext = levelExperience(w.level);
  if(w.level===MAX_LEVEL)w.xp=0;
  w.player.hp = Math.min(w.player.maxHp, w.player.hp + 10);
  const pool = (Object.keys(UPGRADES) as Upgrade[]).filter(k => k !== 'multishot' || w.player.shots < 5);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  w.choices = pool.slice(0, 3); w.status = 'upgrade'; offerPromotion(w);
}
export function chooseUpgrade(w: World, key: Upgrade) {
  if (w.status !== 'upgrade' || !w.choices.includes(key)) return;
  const p = w.player;
  if (key === 'damage') p.damage *= 1.25;
  if (key === 'haste') p.interval /= 1.2;
  if (key === 'vitality') { p.maxHp += 30; p.hp = Math.min(p.maxHp, p.hp + 45); }
  if (key === 'speed') { p.speed *= 1.12; p.hp = Math.min(p.maxHp, p.hp + 15); }
  if (key === 'multishot') p.shots = Math.min(5, p.shots + 1);
  if (key === 'magnet') { p.magnet += 45; p.xpBonus += .15; }
  w.upgrades[key]++; w.choices = []; w.status = 'playing'; offerUpgrade(w);
}
export function nextStage(w: World) {
  if (w.status !== 'clear' || w.stage >= STAGES.length - 1) return;
  w.stage++; w.stageTime = 0; w.eliteSpawned = false; w.eliteKilled = false; w.bossSpawned = false;
  w.enemies = []; w.shots = []; w.attacks = []; w.gems = []; w.effects = []; w.spawnTimer = 1; w.fireTimer = 0;
  w.job.slow={};w.job.cooldown=0;
  w.player.x = 600; w.player.y = 420; w.player.hp = w.player.maxHp; w.player.invincible = 1;
  w.status = 'playing'; offerUpgrade(w);
}
function hurt(w: World, damage: number) {
  const p = w.player;
  if (p.invincible > 0) return;
  damage = Math.round(damage * DIFFICULTIES[w.difficulty].damage*(1-p.armor));
  const absorbed=Math.min(w.job.shield,damage);w.job.shield-=absorbed;damage-=absorbed;
  p.hp = Math.max(0, p.hp - damage); p.invincible = .7;
  w.effects.push({ x: p.x, y: p.y - 40, life: .7, text: `−${damage}`, color: '#ff978c' });
  if (p.hp <= 0) w.status = 'dead';
}
function stepSkill(w:World,dt:number) {
  const job=w.job,path=job.path,p=w.player,tier=job.history.length;
  for(const id of Object.keys(job.slow)){job.slow[Number(id)]-=dt;if(job.slow[Number(id)]<=0)delete job.slow[Number(id)];}
  job.cooldown=Math.max(0,job.cooldown-dt);
  if(!path || job.cooldown>0)return;
  const enemies=w.enemies.filter(e=>e.hp>0 && distance(e,p)<620).sort((a,b)=>distance(a,p)-distance(b,p));
  const radius=130+tier*35;
  if(path==='engineer') {
    if(p.hp>=p.maxHp && !w.shots.some(s=>s.hostile && distance(s,p)<radius))return;
  } else if(!enemies.length || (['berserker','paladin','cryomancer'].includes(path) && distance(enemies[0],p)>radius))return;
  job.cooldown=PATHS[path].cooldown;
  const power=(1+tier*.6)*job.power,color=PATHS[path].color;
  const hit=(e:Enemy,multiplier:number)=>{e.hp-=p.damage*power*multiplier;e.flash=.2;};
  const ring=(x:number,y:number,range:number,kind:Attack['kind'])=>w.attacks.push({x,y,angle:0,range,life:.5,kind,color});
  if(path==='engineer') {
    p.hp=Math.min(p.maxHp,p.hp+Math.round((12+tier*8)*job.power));
    w.shots=w.shots.filter(s=>!s.hostile || distance(s,p)>=radius);ring(p.x,p.y,radius,'heal');
  } else if(path==='sniper') {
    const angle=Math.atan2(enemies[0].y-p.y,enemies[0].x-p.x);
    w.attacks.push({x:p.x,y:p.y,angle,range:620,life:.35,kind:'laser',color});
    for(const e of enemies){const dx=e.x-p.x,dy=e.y-p.y;if(dx*Math.cos(angle)+dy*Math.sin(angle)>0 && Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle))<e.radius+10)hit(e,2.5);}
  } else if(path==='artillery') {
    for(const e of enemies.slice(0,3)){hit(e,1.5);ring(e.x,e.y,32,'nova');}
  } else {
    const center=path==='hunter'||path==='pyromancer'?enemies[0]:p;
    let hits=0;
    for(const e of enemies)if(distance(e,center)<radius){hit(e,path==='pyromancer'?3:path==='berserker'?2:1.5);hits++;if(path==='hunter'||path==='cryomancer')job.slow[e.id]=3;}
    if(path==='paladin')job.shield=Math.max(job.shield,Math.round((20+tier*15)*job.power));
    if(path==='berserker' && hits)p.hp=Math.min(p.maxHp,p.hp+Math.round((4+tier*2)*job.power));
    ring(center.x,center.y,radius,path==='hunter'||path==='cryomancer'?'frost':'nova');
  }
  w.effects.push({x:p.x,y:p.y-50,life:1,text:PATHS[path].skill,color});
}
export function stepWorld(w: World, dt: number, movement: {x:number;y:number}) {
  if (w.status !== 'playing') return;
  dt = Math.min(dt, .05);
  const p = w.player, difficulty = DIFFICULTIES[w.difficulty];
  w.time += dt; w.stageTime += dt; p.invincible = Math.max(0, p.invincible - dt);
  p.x = clamp(p.x + movement.x * p.speed * dt, 28, WIDTH - 28); p.y = clamp(p.y + movement.y * p.speed * dt, 45, HEIGHT - 28);
  w.effects = w.effects.filter(e => { e.life -= dt; e.y -= dt * 25; return e.life > 0; });
  w.attacks = w.attacks.filter(a => { a.life -= dt; return a.life > 0; });
  stepSkill(w,dt);
  w.spawnTimer -= dt;
  if (w.spawnTimer <= 0 && w.enemies.length < 100) {
    w.spawnTimer = Math.max(.38, 1.1 - w.stage * .16 - w.stageTime * .003) * difficulty.spawn;
    const pools: Kind[][] = [['soldier','slime','bat','mage'],['soldier','brute','mage','bat'],['golem','soldier','mage','bat'],['slime','slime','brute','mage'],['bat','bat','golem','mage'],['golem','bat','brute','mage','slime','soldier']];
    const pool = pools[w.stage]; spawnEnemy(w, pool[Math.floor(Math.random()*pool.length)]);
  }
  if (w.stageTime >= 25 && !w.eliteSpawned) { w.eliteSpawned = true; spawnEnemy(w, 'elite'); }
  if (w.stageTime >= 60 && w.eliteKilled && !w.bossSpawned) { w.bossSpawned = true; spawnEnemy(w, 'boss'); }
  w.fireTimer -= dt;
  const weapon = weaponStats(w);
  const range = WEAPONS[w.loadout.weapon].range + (w.loadout.weapon === 'sword' ? (p.shots-1)*12 : 0);
  const targets = w.enemies.filter(e => e.hp > 0 && distance(e,p) < range).sort((a,b) => distance(a,p)-distance(b,p));
  if (w.fireTimer <= 0 && targets.length) {
    w.fireTimer = Math.max(.07, p.interval * weapon.interval);
    const hit = (e: Enemy, damage: number) => { e.hp -= damage; e.flash = .12; w.effects.push({ x:e.x,y:e.y-25,life:.5,text:String(Math.round(damage)),color:'#f4ddb0' }); };
    if (w.loadout.weapon === 'sword') {
      p.angle = Math.atan2(targets[0].y-p.y, targets[0].x-p.x);
      w.attacks.push({x:p.x,y:p.y,angle:p.angle,range,life:.22,kind:'sword'});
      for (const e of targets) {
        const delta = Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-p.angle),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-p.angle));
        if (Math.abs(delta) < 1.25) hit(e,p.damage*weapon.damage*(1+(p.shots-1)*.15));
      }
    } else {
    for (let i = 0; i < p.shots; i++) {
      const target = targets[i % targets.length], angle = Math.atan2(target.y-p.y,target.x-p.x);
      if (i === 0) p.angle = angle;
      if (w.loadout.weapon === 'laser') {
        w.attacks.push({x:p.x,y:p.y,angle,range,life:.18,kind:'laser'});
        for (const e of w.enemies) {
          const dx=e.x-p.x,dy=e.y-p.y,along=dx*Math.cos(angle)+dy*Math.sin(angle),across=Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle));
          if (e.hp>0 && along>0 && along<range && across<e.radius+5) hit(e,p.damage*weapon.damage);
        }
        continue;
      }
      const offset = (i - (p.shots - 1) / 2) * 7 * UNIT_SCALE;
      const pellets = weapon.pellets;
      for (let j=0;j<pellets;j++) {
        const a=angle+(j-(pellets-1)/2)*.13;
        w.shots.push({ x: p.x + Math.cos(a)*25*UNIT_SCALE - Math.sin(a)*offset, y: p.y + Math.sin(a)*25*UNIT_SCALE + Math.cos(a)*offset, vx: Math.cos(a)*640, vy: Math.sin(a)*640, damage: p.damage*weapon.damage, life: w.loadout.weapon==='shotgun' ? .47 : 1.1, hostile: false, radius: 3 });
      }
    }
    }
  }
  for (const e of w.enemies) {
    if (e.hp <= 0) continue;
    e.flash = Math.max(0, e.flash-dt); e.cooldown -= dt;
    const d = distance(e,p); e.angle = Math.atan2(p.y-e.y,p.x-e.x);
    const boss = e.kind === 'boss' || e.kind === 'elite';
    if (boss && e.cooldown < .8) e.charge = .8 - e.cooldown; else e.charge = 0;
    const slow=w.job.slow[e.id] ? .45 : 1;
    if (!(e.kind === 'mage' && d < 270) && e.charge === 0) { e.x += Math.cos(e.angle)*e.speed*dt*slow; e.y += Math.sin(e.angle)*e.speed*dt*slow; }
    if ((e.kind === 'mage' || boss) && e.cooldown <= 0) {
      const count = enemyShotCount(w, e.kind);
      for (let i = 0; i < count; i++) { const a = e.angle + (count === 1 ? 0 : i * Math.PI*2/count); w.shots.push({ x:e.x, y:e.y, vx:Math.cos(a)*175*difficulty.projectile, vy:Math.sin(a)*175*difficulty.projectile, damage:boss ? 18 : 10, life:5, hostile:true, radius:5 }); }
      e.cooldown = (boss ? 3.2 : 3) * difficulty.cooldown; e.charge = 0;
    }
    if (d < e.radius+PLAYER_RADIUS) hurt(w, boss ? 24 : e.kind === 'golem' ? 22 : e.kind === 'brute' ? 16 : 10);
  }
  for (const s of w.shots) {
    const previous = { x: s.x, y: s.y };
    s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt;
    // Swept collision keeps small targets hittable even when a frame spans an entire body.
    const hits = (target: {x:number;y:number}, radius: number) => {
      const dx=s.x-previous.x, dy=s.y-previous.y, length=dx*dx+dy*dy;
      const t=length ? clamp(((target.x-previous.x)*dx+(target.y-previous.y)*dy)/length,0,1) : 0;
      return distance(target,{x:previous.x+dx*t,y:previous.y+dy*t}) < radius+s.radius;
    };
    if (s.hostile) { if (hits(p,PLAYER_RADIUS)) { hurt(w,s.damage); s.life = 0; } }
    else {
      const enemy = w.enemies.find(e => e.hp > 0 && hits(e,e.radius));
      if (enemy) { enemy.hp -= s.damage; enemy.flash = .12; s.life = 0; w.effects.push({ x:enemy.x, y:enemy.y-25, life:.5, text:String(Math.round(s.damage)), color:'#f4ddb0' }); }
    }
  }
  w.shots = w.shots.filter(s => s.life > 0 && s.x > -50 && s.x < WIDTH+50 && s.y > -50 && s.y < HEIGHT+50);
  const playerDied = p.hp <= 0;
  let bossDied = false;
  for (const e of w.enemies.filter(e => e.hp <= 0)) {
    w.kills++;
    const value = e.kind === 'boss' ? 90 : e.kind === 'elite' ? 45 : e.kind === 'golem' ? 14 : e.kind === 'brute' ? 9 : 5;
    w.gems.push({ x:e.x, y:e.y, value:Math.round(value*(1+w.stage*.35)) });
    if (e.kind === 'elite') { w.eliteKilled = true; if (!playerDied) p.hp = Math.min(p.maxHp, p.hp+30); }
    if (e.kind === 'boss') bossDied = true;
  }
  w.enemies = w.enemies.filter(e => e.hp > 0);
  w.gems = w.gems.filter(g => {
    const d = distance(g,p);
    if (d < 20 || bossDied) { if(w.level<MAX_LEVEL)w.xp += g.value*p.xpBonus; return false; }
    if (d < p.magnet) { g.x += (p.x-g.x)/d*440*dt; g.y += (p.y-g.y)/d*440*dt; }
    return true;
  });
  if (playerDied) { w.status = 'dead'; return; }
  if (bossDied) { w.status = w.stage === STAGES.length - 1 ? 'victory' : 'clear'; w.shots = []; return; }
  offerUpgrade(w);
}
