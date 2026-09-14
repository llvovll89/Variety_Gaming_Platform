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
  { name: '월식의 왕좌', subtitle: '마지막 수호자를 쓰러뜨려라', color: '#9ab9ef', floor: '#202a3b', boss: '월식의 파수꾼' },
];
export type Status = 'menu' | 'playing' | 'paused' | 'upgrade' | 'clear' | 'dead' | 'victory';
export type Kind = 'soldier' | 'mage' | 'brute' | 'elite' | 'boss';
export type Upgrade = 'damage' | 'haste' | 'vitality' | 'speed' | 'multishot' | 'magnet';
export const UPGRADES: Record<Upgrade, { name: string; description: string; symbol: string }> = {
  damage: { name: '강화 탄환', description: '공격력 +25% · 더 묵직한 한 발', symbol: 'ATK' },
  haste: { name: '고속 장전', description: '공격 속도 +20% · 더 빠른 연사', symbol: 'SPD' },
  vitality: { name: '수호자의 심장', description: '최대 체력 +30 · 체력 45 회복', symbol: 'HP' },
  speed: { name: '바람의 발걸음', description: '이동 속도 +12% · 체력 15 회복', symbol: 'MOV' },
  multishot: { name: '분열 사격', description: '탄환 +1 · 주변 적을 함께 조준 (최대 5발)', symbol: 'MULTI' },
  magnet: { name: '영혼 수집가', description: '수집 범위 +45 · 경험치 획득 +15%', symbol: 'EXP' },
};
export interface Enemy { id: number; kind: Kind; x: number; y: number; hp: number; maxHp: number; radius: number; speed: number; cooldown: number; flash: number; angle: number; charge: number }
export interface Shot { x: number; y: number; vx: number; vy: number; damage: number; life: number; hostile: boolean; radius: number }
export interface Gem { x: number; y: number; value: number }
export interface Effect { x: number; y: number; life: number; text: string; color: string }
export interface World {
  difficulty: Difficulty;
  status: Status; stage: number; time: number; stageTime: number; kills: number; level: number; xp: number; xpNext: number;
  player: { x: number; y: number; hp: number; maxHp: number; damage: number; interval: number; speed: number; shots: number; magnet: number; xpBonus: number; invincible: number; angle: number };
  enemies: Enemy[]; shots: Shot[]; gems: Gem[]; effects: Effect[]; choices: Upgrade[]; upgrades: Record<Upgrade, number>;
  spawnTimer: number; fireTimer: number; eliteSpawned: boolean; eliteKilled: boolean; bossSpawned: boolean; nextId: number;
}
export function createWorld(status: Status = 'playing', difficulty: Difficulty = 'normal'): World {
  return { status, difficulty, stage: 0, time: 0, stageTime: 0, kills: 0, level: 1, xp: 0, xpNext: 12,
    player: { x: 600, y: 420, hp: 100, maxHp: 100, damage: 18, interval: .48, speed: 210, shots: 1, magnet: 105, xpBonus: 1, invincible: 0, angle: 0 },
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
  const hp = Math.round(({ soldier: 30, mage: 25, brute: 85, elite: 430, boss: 1100 }[kind]) * (1 + w.stage * .65) * difficulty.hp);
  const enemy: Enemy = { id: w.nextId++, kind, x, y, hp, maxHp: hp, radius: { soldier: 19, mage: 18, brute: 26, elite: 35, boss: 49 }[kind] * UNIT_SCALE, speed: ({ soldier: 65, mage: 46, brute: 40, elite: 62, boss: 42 }[kind] + w.stage * 7) * difficulty.speed, cooldown: 2.5 * difficulty.cooldown, flash: 0, angle: 0, charge: 0 };
  w.enemies.push(enemy); return enemy;
}
function offerUpgrade(w: World) {
  if (w.xp < w.xpNext) return;
  w.xp -= w.xpNext; w.level++; w.xpNext = Math.round(w.xpNext * 1.18 + 4);
  w.player.hp = Math.min(w.player.maxHp, w.player.hp + 10);
  const pool = (Object.keys(UPGRADES) as Upgrade[]).filter(k => k !== 'multishot' || w.player.shots < 5);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  w.choices = pool.slice(0, 3); w.status = 'upgrade';
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
  w.enemies = []; w.shots = []; w.gems = []; w.effects = []; w.spawnTimer = 1;
  w.player.x = 600; w.player.y = 420; w.player.hp = w.player.maxHp; w.player.invincible = 1;
  w.status = 'playing'; offerUpgrade(w);
}
function hurt(w: World, damage: number) {
  const p = w.player;
  if (p.invincible > 0) return;
  damage = Math.round(damage * DIFFICULTIES[w.difficulty].damage);
  p.hp = Math.max(0, p.hp - damage); p.invincible = .7;
  w.effects.push({ x: p.x, y: p.y - 40, life: .7, text: `−${damage}`, color: '#ff978c' });
  if (p.hp <= 0) w.status = 'dead';
}
export function stepWorld(w: World, dt: number, movement: {x:number;y:number}) {
  if (w.status !== 'playing') return;
  dt = Math.min(dt, .05);
  const p = w.player, difficulty = DIFFICULTIES[w.difficulty];
  w.time += dt; w.stageTime += dt; p.invincible = Math.max(0, p.invincible - dt);
  p.x = clamp(p.x + movement.x * p.speed * dt, 28, WIDTH - 28); p.y = clamp(p.y + movement.y * p.speed * dt, 45, HEIGHT - 28);
  w.effects = w.effects.filter(e => { e.life -= dt; e.y -= dt * 25; return e.life > 0; });
  w.spawnTimer -= dt;
  if (w.spawnTimer <= 0 && w.enemies.length < 100) {
    w.spawnTimer = Math.max(.38, 1.1 - w.stage * .16 - w.stageTime * .003) * difficulty.spawn;
    const roll = Math.random(); spawnEnemy(w, roll < .16 ? 'brute' : roll < .38 ? 'mage' : 'soldier');
  }
  if (w.stageTime >= 25 && !w.eliteSpawned) { w.eliteSpawned = true; spawnEnemy(w, 'elite'); }
  if (w.stageTime >= 60 && w.eliteKilled && !w.bossSpawned) { w.bossSpawned = true; spawnEnemy(w, 'boss'); }
  w.fireTimer -= dt;
  const targets = w.enemies.filter(e => distance(e,p) < 560).sort((a,b) => distance(a,p)-distance(b,p));
  if (w.fireTimer <= 0 && targets.length) {
    w.fireTimer = Math.max(.07, p.interval);
    for (let i = 0; i < p.shots; i++) {
      const target = targets[i % targets.length], angle = Math.atan2(target.y-p.y,target.x-p.x);
      if (i === 0) p.angle = angle;
      const offset = (i - (p.shots - 1) / 2) * 7 * UNIT_SCALE;
      w.shots.push({ x: p.x + Math.cos(angle)*25*UNIT_SCALE - Math.sin(angle)*offset, y: p.y + Math.sin(angle)*25*UNIT_SCALE + Math.cos(angle)*offset, vx: Math.cos(angle)*640, vy: Math.sin(angle)*640, damage: p.damage, life: 1.1, hostile: false, radius: 3 });
    }
  }
  for (const e of w.enemies) {
    e.flash = Math.max(0, e.flash-dt); e.cooldown -= dt;
    const d = distance(e,p); e.angle = Math.atan2(p.y-e.y,p.x-e.x);
    const boss = e.kind === 'boss' || e.kind === 'elite';
    if (boss && e.cooldown < .8) e.charge = .8 - e.cooldown; else e.charge = 0;
    if (!(e.kind === 'mage' && d < 270) && e.charge === 0) { e.x += Math.cos(e.angle)*e.speed*dt; e.y += Math.sin(e.angle)*e.speed*dt; }
    if ((e.kind === 'mage' || boss) && e.cooldown <= 0) {
      const count = enemyShotCount(w, e.kind);
      for (let i = 0; i < count; i++) { const a = e.angle + (count === 1 ? 0 : i * Math.PI*2/count); w.shots.push({ x:e.x, y:e.y, vx:Math.cos(a)*175*difficulty.projectile, vy:Math.sin(a)*175*difficulty.projectile, damage:boss ? 18 : 10, life:5, hostile:true, radius:5 }); }
      e.cooldown = (boss ? 3.2 : 3) * difficulty.cooldown; e.charge = 0;
    }
    if (d < e.radius+PLAYER_RADIUS) hurt(w, boss ? 24 : e.kind === 'brute' ? 16 : 10);
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
    const value = e.kind === 'boss' ? 90 : e.kind === 'elite' ? 45 : e.kind === 'brute' ? 9 : 5;
    w.gems.push({ x:e.x, y:e.y, value });
    if (e.kind === 'elite') { w.eliteKilled = true; if (!playerDied) p.hp = Math.min(p.maxHp, p.hp+30); }
    if (e.kind === 'boss') bossDied = true;
  }
  w.enemies = w.enemies.filter(e => e.hp > 0);
  w.gems = w.gems.filter(g => {
    const d = distance(g,p);
    if (d < 20 || bossDied) { w.xp += g.value*p.xpBonus; return false; }
    if (d < p.magnet) { g.x += (p.x-g.x)/d*440*dt; g.y += (p.y-g.y)/d*440*dt; }
    return true;
  });
  if (playerDied) { w.status = 'dead'; return; }
  if (bossDied) { w.status = w.stage === 2 ? 'victory' : 'clear'; w.shots = []; return; }
  offerUpgrade(w);
}
