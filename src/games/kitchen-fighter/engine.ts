export type Weapon = 'spatula' | 'swatter' | 'golf';
export type Move = 'jab' | 'heavy' | 'low' | 'skill' | 'ultimate';
export type Input = { x: number; z: number; guard: boolean; crouch: boolean; jump?: boolean };
export const WEAPONS = {
  spatula: { name: '밥심 주걱', short: '주걱', skill: '밥상 뒤집기', ultimate: '천하제일 볶음밥', range: 150, speed: 1, damage: 1 },
  swatter: { name: '전설의 파리채', short: '파리채', skill: '모기 사냥', ultimate: '여름밤 100연타', range: 165, speed: .78, damage: .82 },
  golf: { name: '분노의 골프채', short: '골프채', skill: '벙커 탈출', ultimate: '인생 한 방, 홀인원', range: 205, speed: 1.24, damage: 1.22 },
} as const;
export const MOVES = {
  jab: { startup: .10, duration: .34, damage: 6, reach: 0, level: 'high', launch: 0 },
  heavy: { startup: .25, duration: .65, damage: 13, reach: 15, level: 'mid', launch: 0 },
  low: { startup: .18, duration: .50, damage: 9, reach: 8, level: 'low', launch: 0 },
  skill: { startup: .22, duration: .76, damage: 16, reach: 28, level: 'mid', launch: 155 },
  ultimate: { startup: .38, duration: 1.1, damage: 32, reach: 65, level: 'mid', launch: 210 },
} as const;
export type Fighter = {
  x: number; z: number; hp: number; gauge: number; weapon: Weapon; facing: number;
  input: Input; action: { move: Move; elapsed: number; hit: boolean } | null;
  stun: number; air: number; vy: number; combo: number; comboTime: number; wins: number;
  vx: number; push: number; gait: number; dashTime: number; dashDir: number; sideTime: number; sideDir: number; jumping: boolean; lastJump: boolean;
  tap: { direction: number; time: number }; buffer: { move: Move; expires: number } | null;
};
export type HitEvent = { x: number; z: number; y: number; text: string; kind: 'hit' | 'block' | 'super'; weapon: Weapon; life: number };
export class Fight {
  fighters: [Fighter, Fighter];
  phase: 'ready' | 'fight' | 'roundover' | 'matchover' = 'ready';
  time = 60; phaseTime = 1.6; round = 1; winner: number | null = null;
  effects: HitEvent[] = []; sounds: HitEvent[] = []; elapsed = 0; hitstop = 0;
  aiTime = .3;
  constructor(public mode: 'cpu' | 'local', weapons: [Weapon, Weapon], public difficulty: 'easy' | 'normal' = 'normal', public random = Math.random) {
    this.fighters = weapons.map((weapon, i) => ({ x: i ? 735 : 345, z: 0, hp: 100, gauge: 0, weapon, facing: i ? -1 : 1,
      input: { x: 0, z: 0, guard: false, crouch: false }, action: null, stun: 0, air: 0, vy: 0, combo: 0, comboTime: 0, wins: 0,
      vx: 0, push: 0, gait: 0, dashTime: 0, dashDir: 0, sideTime: 0, sideDir: 0, jumping: false, lastJump: false, tap: { direction: 0, time: -1 }, buffer: null })) as [Fighter, Fighter];
  }
  attack(index: number, move: Move, allowBuffer = false) {
    const f = this.fighters[index];
    if (this.phase !== 'fight' || (move === 'ultimate' && f.gauge < 100)) return false;
    if (f.stun > 0 || f.action || (f.air > 0 && !f.jumping)) {
      if (allowBuffer && ((f.action && MOVES[f.action.move].duration * WEAPONS[f.weapon].speed - f.action.elapsed < .16) || (f.stun > 0 && f.stun < .14))) f.buffer = { move, expires: this.elapsed + .22 };
      return false;
    }
    if (move === 'ultimate') f.gauge = 0;
    f.action = { move, elapsed: 0, hit: false }; return true;
  }
  tapDirection(index: number, direction: number) {
    const f = this.fighters[index];
    if (this.phase !== 'fight') return;
    if (f.tap.direction === direction && this.elapsed - f.tap.time < .25 && !f.action && !f.stun && !f.air) { f.dashTime = .2; f.dashDir = direction; f.tap.time = -1; }
    else f.tap = { direction, time: this.elapsed };
  }
  /** A tapped sidestep is a quick burst into or out of the screen; holding keeps walking sideways. */
  sidestep(index: number, direction: number) {
    const f = this.fighters[index];
    if (this.phase !== 'fight' || f.action || f.stun || f.air || f.sideTime > 0) return false;
    f.sideTime = .2; f.sideDir = direction; return true;
  }
  resetRound() {
    this.round++; this.time = 60; this.phase = 'ready'; this.phaseTime = 1.6; this.winner = null; this.effects = []; this.hitstop = 0;
    this.fighters.forEach((f, i) => { Object.assign(f, { x: i ? 735 : 345, z: 0, hp: 100, gauge: 0, action: null, stun: 0, air: 0, vy: 0, combo: 0, comboTime: 0, vx: 0, push: 0, gait: 0, dashTime: 0, sideTime: 0, jumping: false, lastJump: false, buffer: null, tap: { direction: 0, time: -1 } }); });
  }
  endRound() {
    const [a, b] = this.fighters;
    this.winner = a.hp === b.hp ? null : a.hp > b.hp ? 0 : 1;
    if (this.winner !== null) this.fighters[this.winner].wins++;
    this.phase = this.fighters.some(f => f.wins >= 2) ? 'matchover' : 'roundover'; this.phaseTime = 2.6;
    this.fighters.forEach(f => { f.action = null; });
  }
  ai(dt: number) {
    const [p, f] = this.fighters; const dx = p.x - f.x;
    this.aiTime -= dt;
    if (this.aiTime > 0) return;
    this.aiTime = this.difficulty === 'easy' ? .48 : .23;
    const r = this.random(); const danger = !!p.action && Math.abs(dx) < 230;
    f.input = { x: Math.abs(dx) > WEAPONS[f.weapon].range - 30 ? Math.sign(dx) : r < .15 ? -Math.sign(dx) : 0,
      z: Math.abs(p.z - f.z) > 14 ? Math.sign(p.z - f.z) : 0, guard: danger && r < (this.difficulty === 'easy' ? .2 : .6), crouch: danger && p.action?.move === 'low' && r < .6 };
    if (Math.abs(dx) < WEAPONS[f.weapon].range + 20 && !f.input.guard && r > (this.difficulty === 'easy' ? .55 : .25)) {
      this.attack(1, f.gauge >= 100 && r > .45 ? 'ultimate' : r > .8 ? 'skill' : r > .6 ? 'heavy' : r > .4 ? 'low' : 'jab');
    }
  }
  step(dt: number) {
    dt = Math.min(Math.max(dt, 0), .05);
    this.effects.forEach(e => e.life -= dt); this.effects = this.effects.filter(e => e.life > 0);
    if (this.phase !== 'fight') {
      if (this.phase === 'matchover') return;
      this.phaseTime -= dt;
      if (this.phaseTime <= 0) { if (this.phase === 'ready') this.phase = 'fight'; else this.resetRound(); }
      return;
    }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    this.elapsed += dt;
    this.time = Math.max(0, this.time - dt);
    if (this.mode === 'cpu') this.ai(dt);
    this.fighters.forEach((f, i) => {
      const other = this.fighters[1 - i]; if (!f.action && !f.stun) f.facing = other.x >= f.x ? 1 : -1;
      f.stun = Math.max(0, f.stun - dt); f.comboTime = Math.max(0, f.comboTime - dt); if (!f.comboTime) f.combo = 0;
      if (f.input.jump && !f.lastJump && !f.action && !f.stun && !f.air) { f.air = 1; f.vy = 330; f.jumping = true; }
      f.lastJump = !!f.input.jump;
      if (f.air > 0 || f.vy > 0) { f.vy -= 700 * dt; f.air = Math.max(0, f.air + f.vy * dt); if (!f.air) { f.vy = 0; f.jumping = false; } }
      f.dashTime = Math.max(0, f.dashTime - dt); f.sideTime = Math.max(0, f.sideTime - dt);
      if (!f.action && f.stun === 0 && !f.air) {
        const backwards = f.input.x * f.facing < 0;
        const speed = f.input.guard || f.input.crouch ? 70 : backwards ? 170 : 215;
        const target = f.dashTime > 0 && !f.input.guard && !f.input.crouch ? f.dashDir * 430 : f.input.x * speed;
        f.vx = target ? f.vx + (target - f.vx) * Math.min(1, dt * 32) : 0;
        const before = f.x; f.x = Math.max(90, Math.min(990, f.x + f.vx * dt));
        f.gait += Math.abs(f.x - before) / 62 * Math.PI;
        f.z = Math.max(-65, Math.min(65, f.z + (f.sideTime > 0 ? f.sideDir * 330 : f.input.z * 120) * dt));
      } else if (f.jumping && !f.stun) { f.x = Math.max(90, Math.min(990, f.x + f.input.x * 120 * dt)); f.vx = f.input.x * 120; }
      else f.vx = 0;
      // Knockback slides and decays instead of teleporting, so hits read as a shove.
      if (f.push) { f.x = Math.max(90, Math.min(990, f.x + f.push * dt)); f.push *= Math.exp(-dt * 12); if (Math.abs(f.push) < 6) f.push = 0; }
      if (f.buffer && f.buffer.expires < this.elapsed) f.buffer = null;
      if (f.buffer && !f.action && !f.stun && (!f.air || f.jumping)) { const move = f.buffer.move; f.buffer = null; this.attack(i, move); }
      if (f.action) {
        const action = f.action, spec = MOVES[action.move], weapon = WEAPONS[f.weapon]; action.elapsed += dt;
        if (!action.hit && action.elapsed >= spec.startup * weapon.speed) {
          action.hit = true;
          const range = weapon.range + spec.reach;
          if (Math.abs(f.x - other.x) < range && Math.abs(f.z - other.z) < 32 && Math.abs(f.air - other.air) < 155 && !(spec.level === 'low' && other.air > 35 && !f.air) && !(spec.level === 'high' && other.input.crouch && !other.air)) {
            action.elapsed = spec.startup * weapon.speed;
            const retreatGuard = other.input.x * other.facing < 0;
            const block = (other.input.guard || retreatGuard) && !other.action && other.stun === 0 && !other.air && (spec.level === 'low' ? other.input.crouch : !other.input.crouch);
            const damage = Math.round(spec.damage * weapon.damage * (block ? .12 : Math.max(.45, 1 - f.combo * .12)));
            other.hp = Math.max(0, other.hp - damage); other.gauge = Math.min(100, other.gauge + (block ? 4 : 11));
            f.gauge = Math.min(100, f.gauge + (block ? 4 : 12));
            other.push = f.facing * (block ? 130 : action.move === 'ultimate' ? 780 : action.move === 'heavy' ? 340 : 264);
            if (!block) { other.stun = spec.launch ? .7 : action.move === 'heavy' ? .32 : .21; other.action = null; other.dashTime = 0; if (spec.launch) { other.air = 1; other.vy = spec.launch * 2.2; other.jumping = false; } f.combo++; f.comboTime = 1.25; }
            const e: HitEvent = { x: other.x - f.facing * 24, z: other.z, y: other.air + (spec.level === 'low' ? 60 : 190), text: block ? '가드!' : action.move === 'ultimate' ? weapon.ultimate : f.combo > 1 ? `${f.combo}연타!` : '', kind: block ? 'block' : action.move === 'ultimate' ? 'super' : 'hit', weapon: f.weapon, life: .4 };
            this.effects.push(e); this.sounds.push(e); this.hitstop = block ? .025 : action.move === 'ultimate' ? .16 : .065;
          }
        }
        if (action.elapsed >= spec.duration * weapon.speed) f.action = null;
      }
    });
    const [a, b] = this.fighters;
    if (Math.abs(a.z - b.z) < 35 && Math.abs(a.x - b.x) < 76) {
      const sign = b.x >= a.x ? 1 : -1, correction = (76 - Math.abs(a.x - b.x)) / 2;
      a.x = Math.max(90, Math.min(990, a.x - sign * correction)); b.x = Math.max(90, Math.min(990, b.x + sign * correction));
    }
    if (!a.hp || !b.hp || !this.time) this.endRound();
  }
}
