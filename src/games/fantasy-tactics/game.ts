import { z } from 'zod';
import { CAMPS, CAMP_TOPICS, newCamp, type CampState, type CampTopic } from './camp';
import { ALL_CHEST_IDS, GEAR, SLOTS, START_GEAR, TREASURES, type GearStats, type Loadout, type Slot } from './equipment';

export type Point = { x: number; y: number };
export type Role = 'sword' | 'spear' | 'mage' | 'healer' | 'goblin' | 'archer' | 'boss';
export type Phase = 'intro' | 'player' | 'enemy' | 'won' | 'camp' | 'lost' | 'ending';
export type Mode = 'move' | 'attack' | 'skill0' | 'skill1' | 'chest';
export interface Tile extends Point { height: number; terrain: 'grass' | 'water' | 'bridge' | 'stone'; }
export interface BattleEvent {
  from: Point; to: Point; text: string; kind: 'move' | 'damage' | 'heal' | 'ward';
  actorId: string; path?: Point[]; mode?: Mode; hits?: { id: string; at: Point; text: string }[];
}
export interface Unit extends Point {
  id: string; name: string; role: Role; team: 'ally' | 'enemy';
  hp: number; maxHp: number; mp: number; maxMp: number; attack: number; defense: number;
  move: number; level: number; xp: number; moved: boolean; acted: boolean; ward: number;
}
export interface Skill { name: string; cost: number; range: number; shape: 'single' | 'cross' | 'line'; effect: 'damage' | 'heal' | 'ward'; power: number; description: string; }
export const SKILLS: Record<Role, Skill[]> = {
  sword: [
    { name: '별가르기', cost: 4, range: 1, shape: 'line', effect: 'damage', power: 1.4, description: '앞으로 이어진 두 칸을 벤다.' },
    { name: '수호의 맹세', cost: 3, range: 3, shape: 'single', effect: 'ward', power: 0, description: '동료의 받는 피해를 두 차례 동안 줄인다.' },
  ],
  spear: [
    { name: '관통창', cost: 4, range: 1, shape: 'line', effect: 'damage', power: 1.5, description: '일직선 세 칸을 관통한다.' },
    { name: '응급 처치', cost: 4, range: 1, shape: 'single', effect: 'heal', power: 18, description: '가까운 동료의 체력을 18 회복한다.' },
  ],
  mage: [
    { name: '불꽃별', cost: 5, range: 4, shape: 'cross', effect: 'damage', power: 1.5, description: '대상과 상하좌우에 불꽃을 떨어뜨린다. 아군은 피해를 받지 않는다.' },
    { name: '서리 화살', cost: 3, range: 5, shape: 'single', effect: 'damage', power: 1.2, description: '멀리 있는 적 하나를 공격한다.' },
  ],
  healer: [
    { name: '치유의 빛', cost: 4, range: 4, shape: 'single', effect: 'heal', power: 26, description: '동료 한 명의 체력을 26 회복한다.' },
    { name: '빛의 장막', cost: 5, range: 3, shape: 'cross', effect: 'ward', power: 0, description: '십자 범위의 동료가 받는 피해를 두 차례 동안 줄인다.' },
  ],
  goblin: [], archer: [], boss: [],
};
export const ROLE_LABEL: Record<Role, string> = { sword: '별의 검사', spear: '왕국의 창병', mage: '불꽃 마법사', healer: '빛의 치유사', goblin: '숲의 약탈자', archer: '산적 궁수', boss: '검은 기사' };
export const STAGES = [
  { name: '여울숲의 약속', place: '여울숲 · 오래된 나무다리', objective: '숲을 가로막은 적을 모두 물리치세요.', boss: false,
    dialogue: [{ speaker: '리아', text: '저 다리만 건너면 별의 등대가 보여. 해가 지기 전에 도착할 수 있겠지?' }, { speaker: '테오', text: '잠깐. 다리 건너에 누가 있어… 여행자를 기다리는 얼굴은 아닌데.' }, { speaker: '아린', text: '모두 내 뒤로! 좁은 다리에서는 한꺼번에 달려들지 못할 거야.' }],
    after: '숲길에 다시 고요가 찾아왔다. 네 사람은 오래된 다리를 건너 별의 등대로 향했다.' },
  { name: '바람이 머무는 언덕', place: '바람 언덕 · 무너진 성벽', objective: '고지의 궁수를 포함한 적을 모두 물리치세요.', boss: false,
    dialogue: [{ speaker: '노아', text: '언덕 위에 궁수들이 있어요. 높이 차이가 나면 공격이 더 아플 거예요.' }, { speaker: '테오', text: '내가 앞을 막을게. 리아, 저들이 모이는 순간을 노려.' }, { speaker: '리아', text: '좋아. 불꽃별 한 번이면 밤하늘처럼 반짝일 거야!' }],
    after: '언덕 너머, 꺼진 등대가 모습을 드러냈다. 누군가 별빛을 가두고 있었다.' },
  { name: '꺼지지 않는 별빛', place: '별의 등대 · 봉인된 뜰', objective: '검은 기사 모르덴을 물리치세요.', boss: true,
    dialogue: [{ speaker: '모르덴', text: '이 빛이 꺼지면 왕국도 길을 잃는다. 너희 같은 아이들이 무엇을 바꿀 수 있지?' }, { speaker: '아린', text: '혼자라면 모르겠지만… 우리는 넷이야.' }, { speaker: '노아', text: '등대의 빛을 되찾아요. 돌아갈 길을 기다리는 사람들을 위해서.' }],
    after: '등대에 별빛이 돌아왔다. 길을 잃었던 배들이 다시 항구를 향했다. 네 사람의 첫 원정은 끝났지만, 새로운 모험은 이제 시작이었다.' },
] as const;
export const WIDTH = 12, HEIGHT = 10;
export const key = (p: Point) => `${p.x},${p.y}`;
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
export function makeMap(stage: number): Tile[] {
  return Array.from({ length: WIDTH * HEIGHT }, (_, i) => {
    const x = i % WIDTH, y = Math.floor(i / WIDTH);
    const river = stage === 0 && x === 5;
    const bridge = river && (y === 5 || y === 6);
    const height = stage === 0 ? (x >= 8 && y <= 4 ? 1 : 0) : stage === 1 ? (x >= 7 ? (y <= 4 ? 2 : 1) : x >= 5 ? 1 : 0) : (x >= 7 && y >= 2 && y <= 6 ? 1 : 0);
    return { x, y, height, terrain: bridge ? 'bridge' : river ? 'water' : stage === 2 && x >= 6 ? 'stone' : 'grass' };
  });
}
function createUnit(id: string, name: string, role: Role, team: Unit['team'], x: number, y: number, stage = 0): Unit {
  const stats: Record<Role, [number, number, number, number, number]> = {
    sword: [58, 16, 19, 6, 4], spear: [66, 16, 18, 8, 4], mage: [40, 28, 17, 3, 4], healer: [46, 26, 12, 5, 4],
    goblin: [32 + stage * 9, 0, 12 + stage * 2, 3, 3], archer: [28 + stage * 8, 0, 11 + stage * 2, 2, 3], boss: [112, 0, 22, 9, 3],
  };
  const [hp, mp, attack, defense, move] = stats[role];
  return { id, name, role, team, x, y, hp, maxHp: hp, mp, maxMp: mp, attack, defense, move, level: 1, xp: 0, moved: false, acted: false, ward: 0 };
}
const starts = [{ x: 2, y: 5 }, { x: 2, y: 6 }, { x: 1, y: 5 }, { x: 1, y: 6 }];
export class Battle {
  stage: number;
  round = 1;
  phase: Phase = 'intro';
  dialogue = 0;
  selected = 'arin';
  units: Unit[];
  tiles: Tile[];
  potions = 3;
  log: string[] = ['네 사람의 첫 원정이 시작됩니다.'];
  routes: Record<string, Point[]> = {};
  get undo() { const path = this.routes[this.selected]; return path ? { id: this.selected, path } : null; }
  set undo(value: { id: string; path: Point[] } | null) { if (value) this.routes[value.id] = value.path; else delete this.routes[this.selected]; }
  lastEvent: BattleEvent | null = null;
  facings: Record<string, Point> = {};
  camp: CampState | null = null;
  inventory = [...START_GEAR];
  loadouts: Record<string,Loadout> = {arin:{weapon:'sword-start'},theo:{weapon:'spear-start'},ria:{weapon:'mage-start'},noah:{weapon:'healer-start'}};
  opened: string[] = [];
  rewarded: number[] = [];

  constructor(stage = 0, party?: Unit[]) {
    this.stage = stage; this.tiles = makeMap(stage);
    this.units = party ? party.map((u, i) => ({ ...u, ...starts[i], hp: u.maxHp, mp: u.maxMp, moved: false, acted: false, ward: 0 })) : [
      createUnit('arin', '아린', 'sword', 'ally', 2, 5), createUnit('theo', '테오', 'spear', 'ally', 2, 6),
      createUnit('ria', '리아', 'mage', 'ally', 1, 5), createUnit('noah', '노아', 'healer', 'ally', 1, 6),
    ];
    const enemies: [Role, number, number][] = stage === 0 ? [['goblin', 6, 5], ['goblin', 7, 6], ['archer', 9, 3], ['goblin', 9, 6]] : stage === 1 ? [['goblin', 5, 5], ['goblin', 6, 7], ['archer', 8, 3], ['archer', 9, 4], ['goblin', 9, 7]] : [['goblin', 5, 4], ['goblin', 6, 7], ['archer', 8, 2], ['archer', 9, 7], ['boss', 9, 4]];
    this.units.push(...enemies.map(([role, x, y], i) => createUnit(`enemy-${i}`, role === 'boss' ? '모르덴' : `${role === 'archer' ? '산적 궁수' : '숲 고블린'} ${i + 1}`, role, 'enemy', x, y, stage)));
  }
  get actor() { return this.units.find(u => u.id === this.selected)!; }
  get allies() { return this.units.filter(u => u.team === 'ally'); }
  stats(u: Unit, loadout = this.loadouts[u.id] ?? {}): GearStats {
    const s: GearStats = {attack:u.attack,defense:u.defense,move:u.move,mpDiscount:0,healing:0,dash:0};
    if(u.team==='ally') for(const id of Object.values(loadout)) for(const [stat,value] of Object.entries(GEAR[id]?.bonus ?? {})) s[stat as keyof GearStats]+=value;
    s.attack=Math.max(1,s.attack);s.defense=Math.max(0,s.defense);s.move=Math.max(1,Math.min(6,s.move));return s;
  }
  skillCost(mode: Mode, u=this.actor) { const skill=this.skill(mode,u);return skill?Math.max(1,skill.cost-this.stats(u).mpDiscount):0; }
  equip(id: string, slot: Slot, gear: string | null) {
    const u=this.allies.find(v=>v.id===id);
    if(this.phase!=='camp'||!u||!SLOTS.includes(slot))return false;
    if(gear && (!this.inventory.includes(gear)||GEAR[gear]?.slot!==slot||!GEAR[gear].roles.includes(u.role)||Object.entries(this.loadouts).some(([owner,slots])=>owner!==id&&Object.values(slots).includes(gear))))return false;
    this.loadouts[id]??={};if(gear)this.loadouts[id][slot]=gear;else delete this.loadouts[id][slot];return true;
  }
  get treasures() { return TREASURES[this.stage]; }
  canOpen(id: string) { const t=this.treasures.find(v=>v.id===id);return !!t&&this.canAct()&&!this.opened.includes(id)&&distance(this.actor,t)<=1&&this.at(t)?.team!=='enemy'; }
  openChest(id: string) {
    if(!this.canOpen(id))return false;const t=this.treasures.find(v=>v.id===id)!;
    this.opened.push(id);this.inventory=[...new Set([...this.inventory,...t.items])];this.potions=Math.min(6,this.potions+t.potions);
    this.actor.acted=true;this.undo=null;this.lastEvent=null;
    this.note(`${this.actor.name} · ${t.name} 개봉 · ${t.items.map(v=>GEAR[v].name).join(', ')}${t.potions?' · 회복약 +1':''}`);this.autoEnd();return true;
  }
  carryTo(next: Battle) { next.inventory=[...this.inventory];next.loadouts=structuredClone(this.loadouts);next.opened=[...this.opened];next.rewarded=[...this.rewarded];next.potions=Math.max(3,this.potions);return next; }
  retryStage() { return this.carryTo(new Battle(this.stage,this.allies)); }
  tile(p: Point) { return this.tiles[p.y * WIDTH + p.x]; }
  inside(p: Point) { return Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < WIDTH && p.y < HEIGHT; }
  at(p: Point) { return this.units.find(u => u.hp > 0 && u.x === p.x && u.y === p.y); }
  note(message: string) { this.log = [...this.log.slice(-7), message]; }
  canAct(u = this.actor) { return this.phase === 'player' && u.team === 'ally' && u.hp > 0 && !u.acted; }
  advanceDialogue() {
    if (this.phase !== 'intro') return;
    if (this.dialogue < STAGES[this.stage].dialogue.length - 1) this.dialogue++;
    else { this.phase = 'player'; this.note('동료를 선택하고 파란 칸으로 이동하세요.'); }
  }
  paths(u = this.actor): Map<string, Point[]> {
    const paths = new Map<string, Point[]>([[key(u), [{ x: u.x, y: u.y }]]]);
    const queue: Point[] = [{ x: u.x, y: u.y }];
    for (let i = 0; i < queue.length; i++) {
      const p = queue[i], path = paths.get(key(p))!;
      if (path.length - 1 >= this.stats(u).move) continue;
      for (const d of directions) {
        const n = { x: p.x + d.x, y: p.y + d.y };
        if (!this.inside(n) || paths.has(key(n)) || this.tile(n).terrain === 'water' || this.at(n) || Math.abs(this.tile(n).height - this.tile(p).height) > 1) continue;
        paths.set(key(n), [...path, n]); queue.push(n);
      }
    }
    return paths;
  }
  moveTo(p: Point) {
    const u = this.actor;
    if (!this.canAct(u) || u.moved || key(p) === key(u)) return false;
    const path = this.paths(u).get(key(p));
    if (!path) return false;
    this.undo = { id: u.id, path }; this.lastEvent = { actorId: u.id, path, from: { x: u.x, y: u.y }, to: p, text: '', kind: 'move' };
    this.facings[u.id] = { x: p.x - path[path.length - 2].x, y: p.y - path[path.length - 2].y };
    u.x = p.x; u.y = p.y; u.moved = true; return true;
  }
  undoMove() {
    const u = this.actor;
    if (!this.canUndo()) return false;
    const p = this.undo!.path[0]; u.x = p.x; u.y = p.y; u.moved = false; this.undo = null; this.lastEvent = null; return true;
  }
  canUndo() { return this.canAct() && !!this.undo && !this.at(this.undo.path[0]); }
  skill(mode: Mode, u = this.actor) { return mode === 'skill0' || mode === 'skill1' ? SKILLS[u.role][mode === 'skill0' ? 0 : 1] : undefined; }
  attackRange(u: Unit) { return u.role === 'archer' ? 4 : u.role === 'spear' ? 2 : 1; }
  area(p: Point, mode: Mode, u = this.actor): Point[] {
    const skill = this.skill(mode, u);
    if (!skill || skill.shape === 'single') return [p];
    if (skill.shape === 'cross') return [p, ...directions.map(d => ({ x: p.x + d.x, y: p.y + d.y }))].filter(q => this.inside(q));
    const dx = Math.sign(p.x - u.x), dy = Math.sign(p.y - u.y);
    if (distance(p, u) !== 1) return [];
    return Array.from({ length: u.role === 'spear' ? 3 : 2 }, (_, i) => ({ x: u.x + dx * (i + 1), y: u.y + dy * (i + 1) })).filter(q => this.inside(q));
  }
  targets(mode: Mode, u = this.actor): Tile[] {
    if(mode==='chest')return this.treasures.filter(t=>!this.opened.includes(t.id)&&distance(u,t)<=1).map(t=>this.tile(t));
    if (mode === 'move') return this.tiles.filter(t => this.paths(u).has(key(t)) && key(t) !== key(u));
    const skill = this.skill(mode, u);
    const range = skill?.range ?? this.attackRange(u);
    return this.tiles.filter(t => t.terrain !== 'water' && distance(u, t) <= range && (skill?.shape === 'line' ? distance(u, t) === 1 : true));
  }
  affected(p: Point, mode: Mode, u = this.actor) {
    const skill = this.skill(mode, u), friendly = skill?.effect === 'heal' || skill?.effect === 'ward';
    const cells = new Set(this.area(p, mode, u).map(key));
    return this.units.filter(v => v.hp > 0 && cells.has(key(v)) && (friendly ? v.team === u.team : v.team !== u.team));
  }
  isDash(u: Unit, target: Point) {
    if (!['sword', 'spear'].includes(u.role) || !this.routes[u.id] || distance(u, target) !== 1) return false;
    const path = this.routes[u.id];
    if (path.length < 4) return false;
    const dx = target.x - u.x, dy = target.y - u.y;
    return path.slice(-4).every((p, i, tail) => i === 0 || (p.x - tail[i - 1].x === dx && p.y - tail[i - 1].y === dy && this.tile(p).height === this.tile(tail[i - 1]).height));
  }
  damage(u: Unit, v: Unit, mode: Mode = 'attack') {
    const skill = this.skill(mode, u), magic = u.role === 'mage' && !!skill;
    const elevation = this.tile(u).height - this.tile(v).height;
    const dash = mode === 'attack' && this.isDash(u, v);
    const raw = (this.stats(u).attack * (skill?.power ?? 1) - this.stats(v).defense * (magic ? 0.35 : 1)) * (1 + Math.max(-2, Math.min(2, elevation)) * 0.12) * (dash ? 1.5+this.stats(u).dash : 1) * (v.ward > 0 ? 0.65 : 1);
    return Math.max(1, Math.round(raw));
  }
  preview(p: Point, mode: Mode) {
    const u = this.actor, skill = this.skill(mode, u), affected = this.affected(p, mode);
    if (!this.targets(mode).some(t => key(t) === key(p))) return '사거리 밖';
    if(mode==='chest')return this.treasures.find(t=>key(t)===key(p))?.name??'보물상자가 없는 칸';
    return affected.map(v => `${v.name} ${skill?.effect === 'heal' ? `+${Math.min(skill.power+this.stats(u).healing, v.maxHp - v.hp)} HP` : skill?.effect === 'ward' ? '보호' : `−${this.damage(u, v, mode)} HP${mode === 'attack' && this.isDash(u, v) ? ' · 돌진' : ''}`}`).join(' / ') || '대상이 없는 칸';
  }
  act(p: Point, mode: Mode) {
    const u = this.actor;
    if (mode === 'move') return this.moveTo(p);
    if(mode==='chest') { const t=this.treasures.find(v=>key(v)===key(p));return t?this.openChest(t.id):false; }
    if (!this.canAct(u) || !this.inside(p) || !this.targets(mode).some(t => key(t) === key(p))) return false;
    const skill = this.skill(mode, u), victims = this.affected(p, mode, u);
    if (!victims.length || (skill && u.mp < this.skillCost(mode))) return false;
    if (skill?.effect === 'heal' && victims.every(v => v.hp === v.maxHp)) return false;
    if (skill?.effect === 'ward' && victims.every(v => v.ward >= 2)) return false;
    if (skill) u.mp -= this.skillCost(mode);
    let xp = 0;
    const hits: NonNullable<BattleEvent['hits']> = [];
    this.facings[u.id] = { x: p.x - u.x, y: p.y - u.y };
    for (const v of victims) {
      if (skill?.effect === 'heal') {
        const amount = Math.min(skill.power+this.stats(u).healing, v.maxHp - v.hp); v.hp += amount;
        if (amount > 0) xp += 15;
        this.note(`${u.name}의 ${skill.name} → ${v.name} +${amount} HP`);
        this.lastEvent = { actorId: u.id, mode, from: { x: u.x, y: u.y }, to: p, text: `+${amount}`, kind: 'heal' };
      } else if (skill?.effect === 'ward') {
        if (v.ward < 2) xp += 10;
        v.ward = 2; this.note(`${v.name}에게 빛의 보호가 깃듭니다.`);
        this.lastEvent = { actorId: u.id, mode, from: { x: u.x, y: u.y }, to: p, text: '수호', kind: 'ward' };
      } else {
        const amount = this.damage(u, v, mode); v.hp = Math.max(0, v.hp - amount); xp += v.hp === 0 ? 35 : 15;
        this.note(`${u.name}${mode === 'attack' && this.isDash(u, v) ? '의 돌진' : skill ? `의 ${skill.name}` : '의 공격'} → ${v.name} −${amount} HP${v.hp === 0 ? ' · 쓰러짐' : ''}`);
        this.lastEvent = { actorId: u.id, mode, from: { x: u.x, y: u.y }, to: p, text: `−${amount}`, kind: 'damage' };
      }
      hits.push({ id: v.id, at: { x: v.x, y: v.y }, text: this.lastEvent!.text });
    }
    this.lastEvent!.hits = hits;
    this.gainXp(u, xp); u.acted = true; this.undo = null; this.checkResult(); this.autoEnd(); return true;
  }
  gainXp(u: Unit, amount: number) {
    u.xp += amount;
    while (u.xp >= 80) {
      u.xp -= 80; u.level++; u.maxHp += 5; u.hp = Math.min(u.maxHp, u.hp + 5); u.maxMp += 2; u.mp = Math.min(u.maxMp, u.mp + 2); u.attack += 2; u.defense++;
      this.note(`${u.name} 레벨 ${u.level}! 체력과 능력이 올랐습니다.`);
    }
  }
  potion() {
    const u = this.actor;
    if (!this.canAct(u) || this.potions === 0 || u.hp === u.maxHp) return false;
    const amount = Math.min(30, u.maxHp - u.hp); u.hp += amount; this.potions--; u.acted = true; this.undo = null;
    this.note(`${u.name} 회복약 사용 · +${amount} HP`); this.lastEvent = { actorId: u.id, from: { x: u.x, y: u.y }, to: { x: u.x, y: u.y }, text: `+${amount}`, kind: 'heal' }; this.gainXp(u, 10); this.autoEnd(); return true;
  }
  wait() { if (!this.canAct()) return false; this.actor.acted = true; this.undo = null; this.autoEnd(); return true; }
  autoEnd() { if (this.phase === 'player' && this.allies.every(u => u.hp === 0 || u.acted)) this.endTurn(); }
  endTurn() {
    if (this.phase !== 'player') return false;
    this.routes = {}; this.phase = 'enemy';
    this.units.filter(u => u.team === 'enemy').forEach(u => { u.acted = false; u.moved = false; });
    this.note('적의 차례입니다.'); return true;
  }
  checkResult() {
    if(['won','camp','ending','lost'].includes(this.phase))return;
    if (this.allies.every(u => u.hp === 0)) { this.phase = 'lost'; this.routes = {}; this.note('원정대가 쓰러졌습니다. 다시 도전할 수 있어요.'); }
    else if (STAGES[this.stage].boss ? this.units.find(u => u.role === 'boss')?.hp === 0 : this.units.filter(u => u.team === 'enemy').every(u => u.hp === 0)) {
      this.phase = 'won'; this.routes = {}; this.allies.forEach(u => this.gainXp(u, 25)); this.note('전투 승리! 동료 모두 경험치 +25.');
      if(!this.rewarded.includes(this.stage)){this.rewarded.push(this.stage);const id=this.stage===0?'acc-focus':this.stage===2?'armor-star':null;if(id){this.inventory=[...new Set([...this.inventory,id])];this.note(`승리 보상 · ${GEAR[id].name} 획득`);}}
    }
  }
  aiStep() {
    if (this.phase !== 'enemy') return false;
    const u = this.units.find(v => v.team === 'enemy' && v.hp > 0 && !v.acted);
    if (!u) {
      this.round++; this.phase = 'player'; this.allies.forEach(v => { v.moved = false; v.acted = false; v.ward = Math.max(0, v.ward - 1); });
      this.selected = this.allies.find(v => v.hp > 0)!.id; this.note('아군의 차례입니다.'); this.lastEvent = null; return false;
    }
    const targets = this.allies.filter(v => v.hp > 0), paths = this.paths(u);
    let best = { p: { x: u.x, y: u.y }, score: -Infinity };
    for (const path of paths.values()) {
      const p = path[path.length - 1], near = Math.min(...targets.map(v => distance(p, v)));
      const attackable = targets.filter(v => distance(p, v) <= this.attackRange(u));
      const score = (attackable.length ? 100 + Math.max(...attackable.map(v => (v.maxHp - v.hp) * 0.25)) : 0) - near * 3 - (path.length - 1) * 0.4 + this.tile(p).height;
      if (score > best.score) best = { p, score };
    }
    const from = { x: u.x, y: u.y }; u.x = best.p.x; u.y = best.p.y;
    const victim = targets.filter(v => distance(u, v) <= this.attackRange(u)).sort((a, b) => a.hp - b.hp)[0];
    if (victim) {
      const amount = this.damage(u, victim); victim.hp = Math.max(0, victim.hp - amount);
      this.note(`${u.name}의 공격 → ${victim.name} −${amount} HP${victim.hp === 0 ? ' · 쓰러짐' : ''}`);
      this.lastEvent = { actorId: u.id, path: paths.get(key(best.p)), mode: 'attack', from: { x: u.x, y: u.y }, to: { x: victim.x, y: victim.y }, text: `−${amount}`, kind: 'damage', hits: [{ id: victim.id, at: { x: victim.x, y: victim.y }, text: `−${amount}` }] };
      this.facings[u.id] = { x: victim.x - u.x, y: victim.y - u.y };
    } else { this.note(`${u.name}이 다가옵니다.`); this.lastEvent = { actorId: u.id, path: paths.get(key(best.p)), from, to: best.p, text: '', kind: 'move' };
      const path = this.lastEvent.path!; const previous = path[Math.max(0,path.length-2)]; this.facings[u.id] = { x: u.x-previous.x, y: u.y-previous.y };
    }
    u.acted = true; this.checkResult(); return true;
  }
  enterCamp() {
    if (this.phase !== 'won' || this.stage >= 2) return false;
    this.phase = 'camp'; this.camp = newCamp(); this.routes = {}; this.lastEvent = null; this.potions = Math.max(3,this.potions);
    this.allies.forEach((u, i) => { Object.assign(u, starts[i], { hp: u.maxHp, mp: u.maxMp, ward: 0, moved: false, acted: false }); });
    this.note('야영지에서 동료 모두 HP·MP를 회복하고 회복약을 보충했습니다.'); return true;
  }
  talkCamp(topic: CampTopic) {
    if (this.phase !== 'camp' || !this.camp || !CAMP_TOPICS.includes(topic)) return false;
    this.camp.topic = topic; this.camp.line = 0;
    if (topic === 'route') this.camp.mapSeen = true;
    return true;
  }
  advanceCamp() {
    if (this.phase !== 'camp' || !this.camp?.topic) return false;
    const topic = this.camp.topic, lines = CAMPS[this.stage].talks[topic];
    if (this.camp.line < lines.length - 1) this.camp.line++;
    else { if (!this.camp.heard.includes(topic)) this.camp.heard.push(topic); this.camp.topic = null; this.camp.line = 0; }
    return true;
  }
  nextStage() { return this.phase === 'camp' && this.stage < STAGES.length - 1 ? this.carryTo(new Battle(this.stage + 1, this.allies)) : null; }
}

const unitSchema = z.object({
  id: z.string(), name: z.string(), role: z.enum(['sword', 'spear', 'mage', 'healer', 'goblin', 'archer', 'boss']), team: z.enum(['ally', 'enemy']),
  x: z.number().int().min(0).max(WIDTH - 1), y: z.number().int().min(0).max(HEIGHT - 1), hp: z.number().int().min(0).max(999), maxHp: z.number().int().positive().max(999), mp: z.number().int().min(0).max(999), maxMp: z.number().int().min(0).max(999),
  attack: z.number().int().positive().max(999), defense: z.number().int().min(0).max(999), move: z.number().int().min(1).max(6), level: z.number().int().min(1).max(100), xp: z.number().int().min(0).max(79), moved: z.boolean(), acted: z.boolean(), ward: z.number().int().min(0).max(2),
}).refine(u => u.hp <= u.maxHp && u.mp <= u.maxMp);
const pointSchema = z.object({ x: z.number().int().min(0).max(WIDTH - 1), y: z.number().int().min(0).max(HEIGHT - 1) });
const pathSchema = z.array(pointSchema).min(2).max(7);
const campSchema = z.object({ topic: z.enum(CAMP_TOPICS).nullable(), line: z.number().int().min(0).max(2), heard: z.array(z.enum(CAMP_TOPICS)).max(6), mapSeen: z.boolean() });
const gearFields = { inventory: z.array(z.string()).max(24).default(()=>[...START_GEAR]), loadouts: z.record(z.string(),z.object({weapon:z.string().optional(),armor:z.string().optional(),accessory:z.string().optional()}).strict()).default({arin:{weapon:'sword-start'},theo:{weapon:'spear-start'},ria:{weapon:'mage-start'},noah:{weapon:'healer-start'}}), opened: z.array(z.string()).max(9).default([]), rewarded: z.array(z.number().int().min(0).max(2)).max(3).default([]) };
const saveSchema = z.object({ ...gearFields, version: z.literal(1), stage: z.number().int().min(0).max(2), round: z.number().int().min(1).max(9999), phase: z.enum(['intro', 'player', 'enemy', 'won', 'camp', 'lost', 'ending']), dialogue: z.number().int().min(0).max(2), selected: z.string(), potions: z.number().int().min(0).max(6), units: z.array(unitSchema).min(8).max(9), camp: campSchema.nullable().default(null), routes: z.record(z.string(), pathSchema).default({}), undo: z.object({ id: z.string(), path: pathSchema }).nullable().default(null) });
export function serialize(b: Battle) { return JSON.stringify({ version: 1, stage: b.stage, round: b.round, phase: b.phase, dialogue: b.dialogue, selected: b.selected, potions: b.potions, units: b.units, routes: b.routes, camp: b.camp, inventory:b.inventory, loadouts:b.loadouts, opened:b.opened, rewarded:b.rewarded }); }
export function restore(raw: string): Battle | null {
  try {
    const source=JSON.parse(raw); const data = saveSchema.parse(source), battle = new Battle(data.stage);
    if (data.units.length !== battle.units.length) return null;
    if (!battle.units.every(expected => data.units.some(u => u.id === expected.id && u.role === expected.role && u.team === expected.team))) return null;
    if (!data.units.some(u => u.id === data.selected && u.team === 'ally')) return null;
    if(new Set(data.inventory).size!==data.inventory.length||data.inventory.some(id=>!GEAR[id])||new Set(data.opened).size!==data.opened.length||data.opened.some(id=>!ALL_CHEST_IDS.includes(id))||new Set(data.rewarded).size!==data.rewarded.length||data.rewarded.some(stage=>stage>data.stage))return null;
    const equipped: string[]=[];
    for(const [id,slots] of Object.entries(data.loadouts)) {
      const u=data.units.find(v=>v.id===id&&v.team==='ally');if(!u)return null;
      for(const [slot,gear] of Object.entries(slots)) if(gear){if(!data.inventory.includes(gear)||GEAR[gear]?.slot!==slot||!GEAR[gear].roles.includes(u.role)||equipped.includes(gear))return null;equipped.push(gear);}
    }
    if(!('inventory' in source)) {
      if(data.stage>0||['won','camp','ending'].includes(data.phase)){if(!data.inventory.includes('acc-focus'))data.inventory.push('acc-focus');if(!data.rewarded.includes(0))data.rewarded.push(0);}
      if(data.stage===2&&['won','ending'].includes(data.phase)){data.inventory.push('armor-star');if(!data.rewarded.includes(2))data.rewarded.push(2);}
    }
    if(data.opened.some(id=>!TREASURES.slice(0,data.stage+1).flat().some(t=>t.id===id)))return null;
    battle.inventory=data.inventory;battle.loadouts=data.loadouts;battle.opened=data.opened;battle.rewarded=data.rewarded;
    const alive = data.units.filter(u => u.hp > 0);
    if (new Set(alive.map(key)).size !== alive.length || alive.some(u => battle.tile(u).terrain === 'water')) return null;
    if ((data.phase === 'player' || data.phase === 'enemy') && !alive.some(u => u.team === 'ally')) return null;
    if (data.phase === 'camp') {
      if (data.stage >= 2 || !data.camp || alive.some(u=>u.team==='enemy') || !alive.some(u=>u.team==='ally')) return null;
      if (new Set(data.camp.heard).size !== data.camp.heard.length) return null;
      if (data.camp.topic ? data.camp.line >= CAMPS[data.stage].talks[data.camp.topic].length : data.camp.line !== 0) return null;
    } else if (data.camp) return null;
    if (data.phase === 'ending' && data.stage !== 2) return null;
    if (data.undo) data.routes[data.undo.id] = data.undo.path;
    for (const [id, path] of Object.entries(data.routes)) {
      const u = data.units.find(v => v.id === id);
      if (!u || u.team !== 'ally' || !u.moved || u.acted || data.phase !== 'player' || key(path[path.length - 1]) !== key(u) || path.length - 1 > battle.stats(u).move) return null;
      if (path.some((p, i) => battle.tile(p).terrain === 'water' || (i > 0 && (distance(p, path[i - 1]) !== 1 || Math.abs(battle.tile(p).height - battle.tile(path[i - 1]).height) > 1)))) return null;
      if (new Set(path.map(key)).size !== path.length) return null;
    }
    battle.round = data.round; battle.phase = data.phase; battle.dialogue = data.dialogue; battle.selected = data.selected; battle.potions = data.potions; battle.units = data.units;
    battle.routes = data.routes; battle.camp = data.camp;
    battle.note('저장한 원정을 이어갑니다.'); return battle;
  } catch { return null; }
}
