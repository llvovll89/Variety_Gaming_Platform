import { z } from 'zod';
import { CAMPS, CAMP_TOPICS, newCamp, type CampState, type CampTopic } from './camp';
import { ALL_CHEST_IDS, GEAR, SLOTS, START_GEAR, TREASURES, type GearStats, type Loadout, type Slot } from './equipment';
import { HIDDEN_LEVEL, JOBS, PROMOTION_LEVEL } from './progression';
import { SEA_ENEMIES, SEA_STAGES, seaTile } from './sea-campaign';

export type Point = { x: number; y: number };
export type Role = 'sword' | 'spear' | 'mage' | 'healer' | 'ranger' | 'rogue' | 'shield' | 'watermage' | 'shaman' | 'goblin' | 'archer' | 'boss';
export type Phase = 'intro' | 'player' | 'enemy' | 'won' | 'camp' | 'lost' | 'ending';
export type Mode = 'move' | 'attack' | 'skill0' | 'skill1' | 'skill2' | 'chest' | 'rescue' | 'push' | 'cut' | 'ignite';
export interface Tile extends Point { height: number; terrain: 'grass' | 'water' | 'bridge' | 'stone'; }
export interface BattleEvent {
  from: Point; to: Point; text: string; kind: 'move' | 'damage' | 'heal' | 'ward';
  actorId: string; path?: Point[]; mode?: Mode; hits?: { id: string; at: Point; text: string }[];
}
export interface Unit extends Point {
  id: string; name: string; role: Role; team: 'ally' | 'enemy';
  hp: number; maxHp: number; mp: number; maxMp: number; attack: number; defense: number;
  move: number; level: number; xp: number; moved: boolean; acted: boolean; ward: number;
  promoted?: boolean; training?: 'power' | 'reach'; revived?: boolean; banished?: boolean;
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
  ranger: [{name:'덫 설치',cost:4,range:3,shape:'single',effect:'ward',power:18,description:'빈 칸에 덫을 설치한다. 적이 밟으면 18 피해를 받고 행동을 마친다.'},{name:'정밀 사격',cost:3,range:5,shape:'single',effect:'damage',power:1.4,description:'멀리 있는 적을 정확히 맞힌다.'}],
  rogue: [{name:'그림자 도약',cost:5,range:4,shape:'single',effect:'damage',power:1.5,description:'적의 등 뒤 빈 칸으로 이동해 공격한다. 착지할 곳이 있어야 한다.'},{name:'쌍검 베기',cost:3,range:1,shape:'single',effect:'damage',power:1.6,description:'인접한 적을 연속으로 벤다.'}],
  shield: [], watermage: [], shaman: [], goblin: [], archer: [], boss: [],
};
export const ROLE_LABEL: Record<Role, string> = { ranger:'숲의 궁수', rogue:'그림자 도적', shield:'방패병 · 정면 방어', watermage:'물 마법사 · 불길 진화', shaman:'주술사 · 부활 1회', sword: '별의 검사', spear: '왕국의 창병', mage: '불꽃 마법사', healer: '빛의 치유사', goblin: '숲의 약탈자', archer: '산적 궁수', boss: '검은 기사' };
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
  ...SEA_STAGES,
] as const;
export const FINAL_STAGE = STAGES.length - 1;
export const WIDTH = 12, HEIGHT = 10;
export const key = (p: Point) => `${p.x},${p.y}`;
export const distance = (a: Point, b: Point) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const directions = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
export function makeMap(stage: number): Tile[] {
  return Array.from({ length: WIDTH * HEIGHT }, (_, i) => {
    const x = i % WIDTH, y = Math.floor(i / WIDTH);
    if(stage>=3)return seaTile(stage,{x,y});
    const river = stage === 0 && x === 5;
    const bridge = river && (y === 5 || y === 6);
    const height = stage === 0 ? (x >= 8 && y <= 4 ? 1 : 0) : stage === 1 ? (x >= 7 ? (y <= 4 ? 2 : 1) : x >= 5 ? 1 : 0) : (x >= 7 && y >= 2 && y <= 6 ? 1 : 0);
    return { x, y, height, terrain: bridge ? 'bridge' : river ? 'water' : stage === 2 && x >= 6 ? 'stone' : 'grass' };
  });
}
function createUnit(id: string, name: string, role: Role, team: Unit['team'], x: number, y: number, stage = 0): Unit {
  const stats: Record<Role, [number, number, number, number, number]> = {
    ranger:[44,22,18,4,4], rogue:[48,20,20,4,5], shield:[65,0,16,7,3], watermage:[42,12,16,3,3], shaman:[46,4,14,3,3], sword: [58, 16, 19, 6, 4], spear: [66, 16, 18, 8, 4], mage: [40, 28, 17, 3, 4], healer: [46, 26, 12, 5, 4],
    goblin: [32 + stage * 9, 0, 12 + stage * 2, 3, 3], archer: [28 + stage * 8, 0, 11 + stage * 2, 2, 3], boss: [stage>=3?148+(stage-3)*20:112, 0, 22, 9, 3],
  };
  const [hp, mp, attack, defense, move] = stats[role];
  return { id, name, role, team, x, y, hp, maxHp: hp, mp, maxMp: mp, attack, defense, move, level: 1, xp: 0, moved: false, acted: false, ward: 0 };
}
const starts = [{ x: 2, y: 5 }, { x: 2, y: 6 }, { x: 1, y: 5 }, { x: 1, y: 6 }];
export class Battle {
  reserve: Unit[] = [];
  traps: {x:number;y:number;ownerId:string;power:number}[] = [];
  get roster() { return [...this.allies,...this.reserve]; }
  recruit(id: string) {
    if(this.phase!=='camp'||!(['sera','kai'].includes(id))||this.roster.some(u=>u.id===id)||this.stage<(id==='sera'?0:1))return false;
    const u=createUnit(id,id==='sera'?'세라':'카이',id==='sera'?'ranger':'rogue','ally',1,5);
    this.gainXp(u,(Math.max(1,Math.floor(this.roster.reduce((n,v)=>n+v.level,0)/this.roster.length))-1)*80);this.reserve.push(u);this.note(`${u.name}이 원정대에 합류했습니다! 출전 편성에서 교체하세요.`);return true;
  }
  swapParty(activeId:string,reserveId:string) {
    if(this.phase!=='camp')return false;const active=this.allies.find(u=>u.id===activeId),i=this.reserve.findIndex(u=>u.id===reserveId);if(!active||i<0)return false;
    const incoming=this.reserve[i];Object.assign(incoming,{x:active.x,y:active.y,hp:incoming.maxHp,mp:incoming.maxMp,moved:false,acted:false,ward:0});this.units[this.units.indexOf(active)]=incoming;this.reserve[i]=active;this.selected=this.allies[0].id;return true;
  }
  behind(v:Unit) { const f=this.facings[v.id]??{x:-1,y:0};const dx=Math.abs(f.x)>=Math.abs(f.y)?Math.sign(f.x)||-1:0,dy=dx?0:Math.sign(f.y)||1;const p={x:v.x-dx,y:v.y-dy};return this.inside(p)&&this.tile(p).terrain!=='water'&&!this.at(p)?p:null; }
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
  sideQuest = false;
  sideCompleted: number[] = [];
  rescued: string[] = [];
  bossPhase = 1;
  bossWarning: Point[] = [];
  cutBridges: Point[] = [];
  burning: {x:number;y:number;turns:number}[] = [];
  get bossName() { return this.units.find(u=>u.role==='boss')?.name ?? '모르덴'; }
  get environmentEnabled() { return this.stage >= 3 && !this.sideQuest; }
  get breakableBridges() { return this.environmentEnabled && this.stage<=4 ? [{x:5,y:5}] : []; }
  canCut(p:Point) { return this.canAct()&&this.breakableBridges.some(v=>key(v)===key(p))&&this.tile(p).terrain==='bridge'&&distance(this.actor,p)<=1&&!this.at(p); }
  pushDestination(p:Point) { const u=this.actor;return {x:p.x+Math.sign(p.x-u.x),y:p.y+Math.sign(p.y-u.y)}; }
  pushPreview(p:Point) {
    const v=this.at(p);if(!v||v.team!=='enemy'||distance(this.actor,p)!==1)return '인접한 적을 선택하세요';
    if(v.role==='boss')return '보스 · 밀어내기 면역';
    const dest=this.pushDestination(p);
    if(this.inside(dest)&&this.at(dest))return '뒤쪽 칸이 막혀 있어요';
    if(!this.inside(dest)||this.tile(dest).terrain==='water')return '바다·절벽 밖으로 추락 · 즉시 격파';
    const fall=this.tile(v).height-this.tile(dest).height;
    return `한 칸 밀기 · 피해 ${6+Math.max(0,fall)*10}${fall>0?' · 낙하':''}`;
  }
  environmentAction(p:Point,mode:Mode) {
    if(!this.environmentEnabled||!this.canAct()||!this.inside(p))return false;
    const u=this.actor;
    if(mode==='cut'){
      if(!this.canCut(p))return false;this.cutBridges.push({x:p.x,y:p.y});this.tile(p).terrain='water';
      for(const [id,path] of Object.entries(this.routes))if(path.some(v=>key(v)===key(p)))delete this.routes[id];
      this.note(`${u.name}이 낡은 다리를 끊었습니다. 남쪽의 튼튼한 다리로 우회할 수 있어요.`);this.lastEvent=null;
    }else if(mode==='ignite'){
      if(distance(u,p)>3||this.tile(p).terrain!=='grass'||this.burning.some(v=>key(v)===key(p)))return false;
      this.burning.push({x:p.x,y:p.y,turns:2});this.note(`${u.name}이 풀밭에 불을 붙였습니다. 아군 차례 종료마다 8 피해 · 2회.`);
      this.lastEvent={actorId:u.id,from:{x:u.x,y:u.y},to:p,kind:'damage',text:'점화',mode};
    }else if(mode==='push'){
      const v=this.at(p);if(!v||v.team!=='enemy'||v.role==='boss'||distance(u,v)!==1)return false;
      const dest=this.pushDestination(v);if(this.inside(dest)&&this.at(dest))return false;
      const from={x:v.x,y:v.y},fall=this.inside(dest)?Math.max(0,this.tile(v).height-this.tile(dest).height):0;
      const drowned=!this.inside(dest)||this.tile(dest).terrain==='water',amount=drowned?v.hp:6+fall*10;
      if(drowned)v.banished=true;v.hp=Math.max(0,v.hp-amount);if(!drowned){v.x=dest.x;v.y=dest.y;}
      this.facings[u.id]={x:from.x-u.x,y:from.y-u.y};
      this.lastEvent={actorId:u.id,from:{x:u.x,y:u.y},to:from,kind:'damage',text:drowned?'추락':`−${amount}`,mode,hits:[{id:v.id,at:from,text:drowned?'추락':`−${amount}`}]};
      this.note(`${u.name}이 ${v.name}을 밀었습니다.${drowned?' 추락으로 격파!':` 피해 ${amount}${fall?' · 낙하':''}`}`);this.gainXp(u,v.hp===0?35:15);
    }else return false;
    u.acted=true;this.undo=null;this.checkResult();this.autoEnd();return true;
  }
  tickFire() {
    for(const fire of this.burning){
      const v=this.at(fire);if(v){const amount=Math.round(8*(v.ward>0?0.65:1));v.hp=Math.max(0,v.hp-amount);if(v.hp===0)delete this.routes[v.id];this.note(`${v.name} · 불길 −${amount} HP${v.hp===0?' · 쓰러짐':''}`);}fire.turns--;
    }
    this.burning=this.burning.filter(f=>f.turns>0);this.checkResult();
  }
  continuePartTwo() { if(this.stage!==2||this.phase!=='ending')return false;this.phase='won';return this.enterCamp(); }
  get civilians() { return [{ id: 'elder', name: '길 잃은 노인', x: 4, y: 3 }, { id: 'child', name: '숲의 아이', x: 8, y: 6 }, { id: 'traveler', name: '다친 여행자', x: 9, y: 3 }]; }
  get objective() { return this.sideQuest ? `8턴 안에 주민 3명 구출 · ${this.rescued.length}/3 · 남은 ${Math.max(0, 9-this.round)}턴` : STAGES[this.stage].objective; }
  get victoryText() { return this.sideQuest ? '주민들이 안전한 숲길로 돌아갔습니다. 야영지로 돌아가 새 힘을 정비하세요.' : STAGES[this.stage].after; }
  promote(id: string, training: 'power' | 'reach') {
    const u = this.roster.find(v => v.id === id);
    if (this.phase !== 'camp' || !u || u.promoted || u.level < PROMOTION_LEVEL || !['power', 'reach'].includes(training)) return false;
    u.promoted = true; u.training = training;
    this.note(`${u.name} · ${JOBS[u.role]!.promoted} 전직! 외형과 첫 기술이 강화됩니다.`); return true;
  }
  skills(u = this.actor) {
    const skills = SKILLS[u.role].map((s, i) => i === 0 && u.promoted ? { ...s, power: u.training === 'power' ? s.power * (s.effect === 'damage' ? 1.25 : 1.3) : s.power, range: s.range + (u.training === 'reach' && s.shape !== 'line' ? 1 : 0), description: `${s.description} · ${u.training === 'power' ? '위력 강화' : s.shape === 'line' ? '관통 한 칸 추가' : '사거리 +1'}` } : s);
    if (u.promoted && u.level >= HIDDEN_LEVEL && JOBS[u.role]) skills.push(JOBS[u.role]!.hidden);
    return skills;
  }
  startSideQuest() {
    if (this.phase !== 'camp' || this.stage>=2 || this.sideCompleted.includes(this.stage)) return null;
    const next = this.carryTo(new Battle(this.stage, this.allies)); next.sideQuest = true;
    next.tiles = makeMap(1).map(t => ({ ...t, height: 0, terrain: 'grass' as const }));
    next.units.filter(u => u.team === 'enemy').forEach((u,i) => { u.x = 6 + i % 3; u.y = 1 + Math.floor(i/3) * 7; });
    return next;
  }
  rescue(id: string) {
    const p = this.civilians.find(v => v.id === id);
    if (!this.sideQuest || !this.canAct() || !p || this.rescued.includes(id) || distance(this.actor,p) > 1 || this.at(p)?.team === 'enemy') return false;
    this.rescued.push(id); this.actor.acted = true; this.undo = null; this.lastEvent = null;
    this.note(`${this.actor.name}이 ${p.name}을 안전한 길로 안내했습니다.`); this.gainXp(this.actor,25); this.checkResult(); this.autoEnd(); return true;
  }
  returnFromSideQuest() {
    if (!this.sideQuest || !['won','lost'].includes(this.phase)) return null;
    const next = this.carryTo(new Battle(this.stage,this.allies));
    next.units.filter(u => u.team === 'enemy').forEach(u => u.hp = 0);
    next.phase = 'won'; next.enterCamp(); return next;
  }
  prepareBossWarning() {
    const boss = this.units.find(u => u.role === 'boss' && u.hp > 0);
    if (!boss || this.sideQuest) { this.bossWarning = []; return; }
    const target = this.allies.filter(u => u.hp > 0).sort((a,b) => distance(boss,a)-distance(boss,b))[0];
    if (!target) return;
    this.bossWarning = this.tiles.filter(t => distance(t,target) <= (this.bossPhase === 2 ? 2 : 1)).map(t => ({x:t.x,y:t.y}));
    this.note(`${this.bossName} · ${this.bossPhase === 2 ? '암흑 폭풍' : '그림자 베기'} 예고! 붉은 칸에서 벗어나세요.`);
  }

  constructor(stage = 0, party?: Unit[]) {
    this.stage = stage; this.tiles = makeMap(stage);
    this.units = party ? party.map((u, i) => ({ ...u, ...starts[i], hp: u.maxHp, mp: u.maxMp, moved: false, acted: false, ward: 0 })) : [
      createUnit('arin', '아린', 'sword', 'ally', 2, 5), createUnit('theo', '테오', 'spear', 'ally', 2, 6),
      createUnit('ria', '리아', 'mage', 'ally', 1, 5), createUnit('noah', '노아', 'healer', 'ally', 1, 6),
    ];
    this.selected=this.allies[0].id;
    const enemies: [Role, number, number][] = stage>=3 ? SEA_ENEMIES[stage-3].map(v=>[...v] as [Role,number,number]) : stage === 0 ? [['goblin', 6, 5], ['goblin', 7, 6], ['archer', 9, 3], ['goblin', 9, 6]] : stage === 1 ? [['goblin', 5, 5], ['goblin', 6, 7], ['archer', 8, 3], ['archer', 9, 4], ['goblin', 9, 7]] : [['goblin', 5, 4], ['goblin', 6, 7], ['archer', 8, 2], ['archer', 9, 7], ['boss', 9, 4]];
    if(stage>=3){enemies.forEach((entry,i)=>{ const roles:Role[]=['shield','watermage','shaman'];if([0,1,5].includes(i)&&entry[0]!=='boss')entry[0]=roles[[0,1,5].indexOf(i)]; });}
    this.units.push(...enemies.map(([role, x, y], i) => createUnit(`enemy-${i}`, ['shield','watermage','shaman'].includes(role)?ROLE_LABEL[role]:role === 'boss' ? stage===4?'레벤':stage===5?'아스트라':'모르덴' : `${role === 'archer' ? stage>=3?'검은 돛 궁수':'산적 궁수' : stage>=3?'별빛 약탈자':'숲 고블린'} ${i + 1}`, role, 'enemy', x, y, stage)));
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
    const u=this.roster.find(v=>v.id===id);
    if(this.phase!=='camp'||!u||!SLOTS.includes(slot))return false;
    if(gear && (!this.inventory.includes(gear)||GEAR[gear]?.slot!==slot||!GEAR[gear].roles.includes(u.role)||Object.entries(this.loadouts).some(([owner,slots])=>owner!==id&&Object.values(slots).includes(gear))))return false;
    this.loadouts[id]??={};if(gear)this.loadouts[id][slot]=gear;else delete this.loadouts[id][slot];return true;
  }
  get treasures() { return this.sideQuest ? [] : TREASURES[this.stage]; }
  canOpen(id: string) { const t=this.treasures.find(v=>v.id===id);return !!t&&this.canAct()&&!this.opened.includes(id)&&distance(this.actor,t)<=1&&this.at(t)?.team!=='enemy'; }
  openChest(id: string) {
    if(!this.canOpen(id))return false;const t=this.treasures.find(v=>v.id===id)!;
    this.opened.push(id);this.inventory=[...new Set([...this.inventory,...t.items])];this.potions=Math.min(6,this.potions+t.potions);
    this.actor.acted=true;this.undo=null;this.lastEvent=null;
    this.note(`${this.actor.name} · ${t.name} 개봉 · ${t.items.map(v=>GEAR[v].name).join(', ')}${t.potions?' · 회복약 +1':''}`);this.autoEnd();return true;
  }
  carryTo(next: Battle) { next.reserve=structuredClone(this.reserve);next.sideCompleted=[...this.sideCompleted];next.inventory=[...this.inventory];next.loadouts=structuredClone(this.loadouts);next.opened=[...this.opened];next.rewarded=[...this.rewarded];next.potions=Math.max(3,this.potions);return next; }
  retryStage() { if(this.sideQuest) { const base=this.carryTo(new Battle(this.stage,this.allies));base.phase='camp';return base.startSideQuest()!; } return this.carryTo(new Battle(this.stage,this.allies)); }
  tile(p: Point) { return this.tiles[p.y * WIDTH + p.x]; }
  inside(p: Point) { return Number.isInteger(p.x) && Number.isInteger(p.y) && p.x >= 0 && p.y >= 0 && p.x < WIDTH && p.y < HEIGHT; }
  at(p: Point) { return this.units.find(u => u.hp > 0 && u.x === p.x && u.y === p.y); }
  note(message: string) { this.log = [...this.log.slice(-7), message]; }
  canAct(u = this.actor) { return this.phase === 'player' && u.team === 'ally' && u.hp > 0 && !u.acted; }
  advanceDialogue() {
    if (this.phase !== 'intro') return;
    if (this.dialogue < STAGES[this.stage].dialogue.length - 1) this.dialogue++;
    else { this.phase = 'player'; this.note('동료를 선택하고 파란 칸으로 이동하세요.'); this.prepareBossWarning(); }
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
  skill(mode: Mode, u = this.actor) { return mode.startsWith('skill') ? this.skills(u)[Number(mode.slice(5))] : undefined; }
  attackRange(u: Unit) { return ['archer','ranger','watermage','shaman'].includes(u.role) ? 4 : u.role === 'spear' ? 2 : 1; }
  area(p: Point, mode: Mode, u = this.actor): Point[] {
    const skill = this.skill(mode, u);
    if (!skill || skill.shape === 'single') return [p];
    if (skill.shape === 'cross') return [p, ...directions.map(d => ({ x: p.x + d.x, y: p.y + d.y }))].filter(q => this.inside(q));
    const dx = Math.sign(p.x - u.x), dy = Math.sign(p.y - u.y);
    if (distance(p, u) !== 1) return [];
    return Array.from({ length: (u.role === 'spear' ? 3 : 2) + (u.promoted && u.training === 'reach' ? 1 : 0) }, (_, i) => ({ x: u.x + dx * (i + 1), y: u.y + dy * (i + 1) })).filter(q => this.inside(q));
  }
  targets(mode: Mode, u = this.actor): Tile[] {
    if(mode==='cut')return this.environmentEnabled?this.breakableBridges.filter(p=>this.tile(p).terrain==='bridge'&&!this.at(p)&&distance(u,p)<=1).map(p=>this.tile(p)):[];
    if(mode==='ignite')return this.environmentEnabled?this.tiles.filter(t=>t.terrain==='grass'&&distance(u,t)<=3&&!this.burning.some(v=>key(v)===key(t))):[];
    if(mode==='push')return this.environmentEnabled?this.units.filter(v=>v.team==='enemy'&&v.hp>0&&v.role!=='boss'&&distance(u,v)===1).filter(v=>{const dest={x:v.x+Math.sign(v.x-u.x),y:v.y+Math.sign(v.y-u.y)};return !this.inside(dest)||!this.at(dest);}).map(v=>this.tile(v)):[];
    if(mode==='rescue')return this.sideQuest ? this.civilians.filter(v=>!this.rescued.includes(v.id)&&distance(u,v)<=1).map(v=>this.tile(v)) : [];
    if(mode.startsWith('skill')&&!this.skill(mode,u))return [];
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
    const skill = this.skill(mode, u), magic = ['watermage','shaman'].includes(u.role) || u.role === 'mage' && !!skill;
    const elevation = this.tile(u).height - this.tile(v).height;
    const dash = mode === 'attack' && this.isDash(u, v);
    const raw = (this.stats(u).attack * (skill?.power ?? 1) - this.stats(v).defense * (magic ? 0.35 : 1)) * (1 + Math.max(-2, Math.min(2, elevation)) * 0.12) * (dash ? 1.5+this.stats(u).dash : 1) * (v.ward > 0 ? 0.65 : 1);
    const f=this.facings[v.id]??{x:-1,y:0},dx=u.x-v.x,dy=u.y-v.y;const frontal=Math.abs(f.x)>=Math.abs(f.y)?dx*Math.sign(f.x||-1)>0&&Math.abs(dy)<=Math.abs(dx):dy*Math.sign(f.y)>0&&Math.abs(dx)<=Math.abs(dy);return Math.max(1,Math.round(raw*(v.role==='shield'&&frontal&&!magic?0.45:1)));
  }
  preview(p: Point, mode: Mode) {
    const u = this.actor, skill = this.skill(mode, u), affected = this.affected(p, mode);
    if(u.role==='ranger'&&mode==='skill0')return this.targets(mode).some(t=>key(t)===key(p))?'덫 설치 · 적에게 피해 + 행동 종료':'설치할 수 없는 칸';
    if(u.role==='rogue'&&mode==='skill0'){const v=this.at(p),dest=v&&this.behind(v);return v&&dest&&this.targets(mode).some(t=>key(t)===key(p))?`뒤로 도약 · −${this.damage({...u,...dest},v,mode)} HP`:'착지할 뒤쪽 칸이 필요해요';}
    if(mode==='push')return this.pushPreview(p);
    if (!this.targets(mode).some(t => key(t) === key(p))) return '사거리 밖';
    if(mode==='cut')return '다리 끊기 · 행동 1회 · 남쪽 다리는 유지';
    if(mode==='ignite')return '점화 · 차례 종료마다 8 피해 · 아군도 피해 · 2회';
    if(mode==='rescue')return this.civilians.find(v=>key(v)===key(p))?.name+' · 구출';
    if(mode==='chest')return this.treasures.find(t=>key(t)===key(p))?.name??'보물상자가 없는 칸';
    return affected.map(v => `${v.name} ${skill?.effect === 'heal' ? `+${Math.min(skill.power+this.stats(u).healing, v.maxHp - v.hp)} HP` : skill?.effect === 'ward' ? '보호' : `−${this.damage(u, v, mode)} HP${mode === 'attack' && this.isDash(u, v) ? ' · 돌진' : ''}`}`).join(' / ') || '대상이 없는 칸';
  }
  act(p: Point, mode: Mode) {
    const u = this.actor;
    if(['cut','push','ignite'].includes(mode))return this.environmentAction(p,mode);
    if (mode === 'move') return this.moveTo(p);
    if(mode==='rescue'){const v=this.civilians.find(v=>key(v)===key(p));return v?this.rescue(v.id):false;}
    if(mode==='chest') { const t=this.treasures.find(v=>key(v)===key(p));return t?this.openChest(t.id):false; }
    if (!this.canAct(u) || !this.inside(p) || !this.targets(mode).some(t => key(t) === key(p))) return false;
    if(u.role==='ranger'&&mode==='skill0'){if(u.mp<this.skillCost(mode))return false;u.mp-=this.skillCost(mode);this.traps.push({x:p.x,y:p.y,ownerId:u.id,power:Math.round(this.skills(u)[0].power)});u.acted=true;this.undo=null;this.lastEvent={actorId:u.id,from:{x:u.x,y:u.y},to:p,text:'덫',kind:'ward',mode};this.note(`${u.name}이 덫을 설치했습니다.`);this.gainXp(u,10);this.autoEnd();return true;}
    const skill = this.skill(mode, u), victims = this.affected(p, mode, u);
    if (!victims.length || (skill && u.mp < this.skillCost(mode))) return false;
    if (skill?.effect === 'heal' && victims.every(v => v.hp === v.maxHp)) return false;
    if (skill?.effect === 'ward' && victims.every(v => v.ward >= 2)) return false;
    if(u.role==='rogue'&&mode==='skill0'){const dest=this.behind(victims[0]);if(!dest)return false;Object.assign(u,dest,{moved:true});}
    if (skill) u.mp -= this.skillCost(mode);
    let xp = 0;
    const hits: NonNullable<BattleEvent['hits']> = [];
    this.facings[u.id] = { x: p.x - u.x, y: p.y - u.y };
    for (const v of victims) {
      if (skill?.effect === 'heal') {
        const amount = Math.min(Math.round(skill.power+this.stats(u).healing), v.maxHp - v.hp); v.hp += amount;
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
    if(this.environmentEnabled&&u.role==='mage'&&(mode==='skill0'||mode==='skill2')){
      for(const q of this.area(p,mode,u))if(this.tile(q).terrain==='grass'&&!this.burning.some(f=>key(f)===key(q)))this.burning.push({x:q.x,y:q.y,turns:2});
      if(this.area(p,mode,u).some(q=>this.tile(q).terrain==='grass'))this.note('불꽃 마법이 풀밭을 태웠습니다. 아군도 불길을 피하세요.');
    }
    this.gainXp(u, xp); u.acted = true; this.undo = null; this.checkResult(); this.autoEnd(); return true;
  }
  gainXp(u: Unit, amount: number) {
    u.xp += amount;
    while (u.xp >= 80) {
      u.xp -= 80; u.level++; u.maxHp += 5; u.hp = Math.min(u.maxHp, u.hp + 5); u.maxMp += 2; u.mp = Math.min(u.maxMp, u.mp + 2); u.attack += 2; u.defense++;
      this.note(`${u.name} 레벨 ${u.level}! 체력과 능력이 올랐습니다.`);
      if(u.level===PROMOTION_LEVEL)this.note(`${u.name} · 야영지에서 전직 가능!`);
      if(u.level===HIDDEN_LEVEL)this.note(`${u.name} · ${u.promoted ? JOBS[u.role]?.hidden.name+' 해금!' : '전직하면 히든스킬을 사용할 수 있어요.'}`);
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
    this.tickFire();if(this.phase!=='player')return true;
    this.routes = {}; this.phase = 'enemy';
    this.units.filter(u => u.team === 'enemy').forEach(u => { u.acted = false; u.moved = false; });
    this.note('적의 차례입니다.'); return true;
  }
  checkResult() {
    if(['won','camp','ending','lost'].includes(this.phase))return;
    const boss=this.units.find(u=>u.role==='boss');
    if(!this.sideQuest&&boss&&boss.hp>0&&boss.hp<=boss.maxHp/2&&this.bossPhase===1){this.bossPhase=2;this.note(`${this.bossName} 2페이즈 · 봉인 해방! 다음 예고부터 범위와 피해가 커집니다.`);}
    if (this.allies.every(u => u.hp === 0)) { this.phase = 'lost'; this.routes = {}; this.note('원정대가 쓰러졌습니다. 다시 도전할 수 있어요.'); }
    else if (this.sideQuest ? this.rescued.length===3 : STAGES[this.stage].boss ? this.units.find(u => u.role === 'boss')?.hp === 0 : this.units.filter(u => u.team === 'enemy').every(u => u.hp === 0)) {
      if(this.sideQuest){this.phase='won';this.routes={};if(!this.sideCompleted.includes(this.stage)){this.sideCompleted.push(this.stage);const reward=this.stage===0?120:160;this.roster.forEach(u=>this.gainXp(u,reward));this.note(`주민 구출 완료! 동료 모두 경험치 +${reward}.`);}return;}
      this.phase = 'won'; this.routes = {}; this.roster.forEach(u => this.gainXp(u, 25)); this.note('전투 승리! 동료 모두 경험치 +25.');
      if(!this.rewarded.includes(this.stage)){this.rewarded.push(this.stage);const id=this.stage===0?'acc-focus':this.stage===2?'armor-star':null;if(id){this.inventory=[...new Set([...this.inventory,id])];this.note(`승리 보상 · ${GEAR[id].name} 획득`);}}
    }
  }
  aiStep() {
    if (this.phase !== 'enemy') return false;
    const u = this.units.find(v => v.team === 'enemy' && v.hp > 0 && !v.acted);
    if (!u) {
      this.round++; this.phase = 'player'; this.allies.forEach(v => { v.moved = false; v.acted = false; v.ward = Math.max(0, v.ward - 1); });
      if(this.sideQuest&&this.round>8){this.phase='lost';this.lastEvent=null;this.note('구출 시간이 지났습니다. 야영지에서 다시 도전하세요.');return false;}
      this.prepareBossWarning();
      this.selected = this.allies.find(v => v.hp > 0)!.id; this.note('아군의 차례입니다.'); this.lastEvent = null; return false;
    }
    if(u.role==='boss'&&!this.sideQuest){
      const victims=this.allies.filter(v=>v.hp>0&&this.bossWarning.some(p=>key(p)===key(v)));
      const hits=victims.map(v=>{const amount=Math.round((this.bossPhase===2?32:22)*(v.ward?0.65:1));v.hp=Math.max(0,v.hp-amount);return {id:v.id,at:{x:v.x,y:v.y},text:`−${amount}`};});
      this.lastEvent={actorId:u.id,from:{x:u.x,y:u.y},to:this.bossWarning[0]??{x:u.x,y:u.y},kind:'damage',text:'암흑',hits};
      this.note(`${this.bossName}의 예고 공격 · ${hits.length ? hits.length+'명 명중' : '원정대가 모두 피했습니다!'}`);this.bossWarning=[];u.acted=true;this.checkResult();return true;
    }
    const targets = this.allies.filter(v => v.hp > 0), paths = this.paths(u);
    if((u.role==='watermage'&&u.mp>=3)||(u.role==='shaman'&&u.mp>=4)){
      const options=u.role==='watermage'?this.burning:this.units.filter(v=>v.team==='enemy'&&v.hp===0&&!v.revived&&!v.banished&&v.role!=='boss'&&v.role!=='shaman'&&!this.at(v)&&this.tile(v).terrain!=='water');
      for(const goal of options){const path=[...paths.values()].filter(path=>distance(path[path.length-1],goal)<=3&&(u.role!=='shaman'||key(path[path.length-1])!==key(goal))).sort((a,b)=>a.length-b.length)[0];if(!path)continue;
        if(this.springTrap(u,path))return true;const from={x:u.x,y:u.y};Object.assign(u,path[path.length-1]);
        if(u.role==='watermage'){this.burning=this.burning.filter(f=>distance(f,goal)>1);u.mp-=3;this.note('물 마법사가 불길을 껐습니다.');this.lastEvent={actorId:u.id,from,to:goal,path,kind:'ward',text:'진화'};}
        else{const v=goal as Unit;v.hp=Math.ceil(v.maxHp/2);v.revived=true;v.acted=true;u.mp-=4;this.note('주술사가 '+v.name+'을 부활시켰습니다! 부활은 1회뿐입니다.');this.lastEvent={actorId:u.id,from,to:{x:v.x,y:v.y},path,kind:'heal',text:'부활'};}u.acted=true;return true;
      }
    }
    let best = { p: { x: u.x, y: u.y }, score: -Infinity };
    for (const path of paths.values()) {
      const p = path[path.length - 1], near = Math.min(...targets.map(v => distance(p, v)));
      const attackable = targets.filter(v => distance(p, v) <= this.attackRange(u));
      const score = (attackable.length ? 100 + Math.max(...attackable.map(v => (v.maxHp - v.hp) * 0.25)) : 0) - near * 3 - (path.length - 1) * 0.4 + this.tile(p).height - (this.burning.some(f=>key(f)===key(p))?18:0);
      if (score > best.score) best = { p, score };
    }
    if(this.springTrap(u,paths.get(key(best.p))??[u]))return true;
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
  springTrap(u:Unit,path:Point[]) {
    const index=path.findIndex(p=>this.traps.some(t=>key(t)===key(p)));if(index<0)return false;const p=path[index],trap=this.traps.find(t=>key(t)===key(p))!;this.traps=this.traps.filter(t=>t!==trap);Object.assign(u,p,{acted:true});u.hp=Math.max(0,u.hp-trap.power);this.lastEvent={actorId:u.id,from:path[0],to:p,path:path.slice(0,index+1),kind:'damage',text:'덫',hits:[{id:u.id,at:p,text:'−'+trap.power}]};this.note(u.name+'이 덫에 걸렸습니다. 피해 '+trap.power+' · 행동 종료');this.checkResult();return true;
  }
  enterCamp() {
    if (this.phase !== 'won' || this.stage >= FINAL_STAGE) return false;
    this.phase = 'camp'; this.camp = newCamp(); this.routes = {}; this.lastEvent = null; this.potions = Math.max(3,this.potions);
    this.units.filter(u=>u.team==='enemy').forEach(u=>u.hp=0);this.bossWarning=[];this.burning=[];this.traps=[];this.reserve.forEach(u=>{u.hp=u.maxHp;u.mp=u.maxMp;});
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
  id: z.string(), name: z.string(), role: z.enum(['sword', 'spear', 'mage', 'healer', 'ranger','rogue','shield','watermage','shaman','goblin', 'archer', 'boss']), team: z.enum(['ally', 'enemy']),
  x: z.number().int().min(0).max(WIDTH - 1), y: z.number().int().min(0).max(HEIGHT - 1), hp: z.number().int().min(0).max(999), maxHp: z.number().int().positive().max(999), mp: z.number().int().min(0).max(999), maxMp: z.number().int().min(0).max(999),
  attack: z.number().int().positive().max(999), defense: z.number().int().min(0).max(999), move: z.number().int().min(1).max(6), level: z.number().int().min(1).max(100), xp: z.number().int().min(0).max(79), moved: z.boolean(), acted: z.boolean(), ward: z.number().int().min(0).max(2),
  revived:z.boolean().optional(),banished:z.boolean().optional(), promoted: z.boolean().default(false), training: z.enum(['power','reach']).optional(),
}).refine(u => u.hp <= u.maxHp && u.mp <= u.maxMp && (!u.promoted || (u.team==='ally' && u.level>=3 && !!u.training)) && (u.promoted || !u.training));
const pointSchema = z.object({ x: z.number().int().min(0).max(WIDTH - 1), y: z.number().int().min(0).max(HEIGHT - 1) });
const pathSchema = z.array(pointSchema).min(2).max(7);
const campSchema = z.object({ topic: z.enum(CAMP_TOPICS).nullable(), line: z.number().int().min(0).max(2), heard: z.array(z.enum(CAMP_TOPICS)).max(6), mapSeen: z.boolean() });
const gearFields = { inventory: z.array(z.string()).max(24).default(()=>[...START_GEAR]), loadouts: z.record(z.string(),z.object({weapon:z.string().optional(),armor:z.string().optional(),accessory:z.string().optional()}).strict()).default({arin:{weapon:'sword-start'},theo:{weapon:'spear-start'},ria:{weapon:'mage-start'},noah:{weapon:'healer-start'}}), opened: z.array(z.string()).max(ALL_CHEST_IDS.length).default([]), rewarded: z.array(z.number().int().min(0).max(FINAL_STAGE)).max(STAGES.length).default([]) };
const saveSchema = z.object({ ...gearFields, reserve:z.array(unitSchema).max(2).default([]), facings:z.record(z.string(),z.object({x:z.number().int().min(-11).max(11),y:z.number().int().min(-9).max(9)})).default({}), traps:z.array(pointSchema.extend({ownerId:z.string(),power:z.number().int().min(1).max(100)})).max(120).default([]), version: z.literal(1), stage: z.number().int().min(0).max(FINAL_STAGE), round: z.number().int().min(1).max(9999), phase: z.enum(['intro', 'player', 'enemy', 'won', 'camp', 'lost', 'ending']), dialogue: z.number().int().min(0).max(2), selected: z.string(), potions: z.number().int().min(0).max(6), units: z.array(unitSchema).min(8).max(10), camp: campSchema.nullable().default(null), routes: z.record(z.string(), pathSchema).default({}), undo: z.object({ id: z.string(), path: pathSchema }).nullable().default(null) });
const adventureSchema = z.object({sideQuest:z.boolean().default(false),sideCompleted:z.array(z.number().int().min(0).max(1)).max(2).default([]),rescued:z.array(z.enum(['elder','child','traveler'])).max(3).default([]),bossPhase:z.number().int().min(1).max(2).default(1),bossWarning:z.array(pointSchema).max(13).default([])});
const environmentSchema=z.object({cutBridges:z.array(pointSchema).max(1).default([]),burning:z.array(pointSchema.extend({turns:z.number().int().min(1).max(2)})).max(WIDTH*HEIGHT).default([])});
export function serialize(b: Battle) { return JSON.stringify({reserve:b.reserve,facings:b.facings,traps:b.traps,cutBridges:b.cutBridges,burning:b.burning, sideQuest:b.sideQuest,sideCompleted:b.sideCompleted,rescued:b.rescued,bossPhase:b.bossPhase,bossWarning:b.bossWarning,version: 1, stage: b.stage, round: b.round, phase: b.phase, dialogue: b.dialogue, selected: b.selected, potions: b.potions, units: b.units, routes: b.routes, camp: b.camp, inventory:b.inventory, loadouts:b.loadouts, opened:b.opened, rewarded:b.rewarded }); }
export function restore(raw: string): Battle | null {
  try {
    const source=JSON.parse(raw); const data = saveSchema.parse(source), battle = new Battle(data.stage);
    const adventure=adventureSchema.parse(source);
    if(new Set(adventure.rescued).size!==adventure.rescued.length||new Set(adventure.sideCompleted).size!==adventure.sideCompleted.length||adventure.sideCompleted.some(s=>s>data.stage))return null;
    if(adventure.sideQuest&&(data.stage>=2||['camp','ending'].includes(data.phase)||data.camp))return null;
    if(!adventure.sideQuest&&adventure.rescued.length)return null;
    if(adventure.sideQuest&&data.phase==='won'&&adventure.rescued.length!==3)return null;
    if((!STAGES[data.stage].boss||adventure.sideQuest)&&(adventure.bossWarning.length||adventure.bossPhase!==1))return null;
    if(new Set(adventure.bossWarning.map(key)).size!==adventure.bossWarning.length)return null;
    Object.assign(battle,adventure);
    if(adventure.sideQuest)battle.tiles=makeMap(1).map(t=>({...t,height:0,terrain:'grass' as const}));
    const environment=environmentSchema.parse(source);
    if(!battle.environmentEnabled&&(environment.cutBridges.length||environment.burning.length))return null;
    for(const p of environment.cutBridges){if(!battle.breakableBridges.some(v=>key(v)===key(p)))return null;battle.tile(p).terrain='water';}
    if(new Set(environment.burning.map(key)).size!==environment.burning.length||environment.burning.some(p=>battle.tile(p).terrain!=='grass'))return null;
    Object.assign(battle,environment);
    if (data.units.length !== battle.units.length) return null;
    const heroRoles:Record<string,Role>={arin:'sword',theo:'spear',ria:'mage',noah:'healer',sera:'ranger',kai:'rogue'};const roster=[...data.units.filter(u=>u.team==='ally'),...data.reserve];
    if(roster.length<4||new Set(roster.map(u=>u.id)).size!==roster.length||data.units.filter(u=>u.team==='ally').length!==4||roster.some(u=>u.team!=='ally'||heroRoles[u.id]!==u.role||u.id==='kai'&&data.stage<1)||['arin','theo','ria','noah'].some(id=>!roster.some(u=>u.id===id)))return null;
    if (!battle.units.filter(u=>u.team==='enemy').every(expected => data.units.some(u => u.id === expected.id && u.team==='enemy' && (u.role === expected.role || data.stage>=3&&['goblin','archer'].includes(u.role)&&['shield','watermage','shaman'].includes(expected.role))))) return null;
    if(new Set(data.traps.map(key)).size!==data.traps.length||data.traps.some(t=>!roster.some(u=>u.id===t.ownerId&&u.role==='ranger')||battle.tile(t).terrain==='water')||Object.keys(data.facings).some(id=>!data.units.some(u=>u.id===id)))return null;
    battle.reserve=data.reserve;battle.traps=data.traps;battle.facings=data.facings;
    if (!data.units.some(u => u.id === data.selected && u.team === 'ally')) return null;
    if(new Set(data.inventory).size!==data.inventory.length||data.inventory.some(id=>!GEAR[id])||new Set(data.opened).size!==data.opened.length||data.opened.some(id=>!ALL_CHEST_IDS.includes(id))||new Set(data.rewarded).size!==data.rewarded.length||data.rewarded.some(stage=>stage>data.stage))return null;
    const equipped: string[]=[];
    for(const [id,slots] of Object.entries(data.loadouts)) {
      const u=roster.find(v=>v.id===id&&v.team==='ally');if(!u)return null;
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
      if (data.stage >= FINAL_STAGE || !data.camp || alive.some(u=>u.team==='enemy') || !alive.some(u=>u.team==='ally')) return null;
      if (new Set(data.camp.heard).size !== data.camp.heard.length) return null;
      if (data.camp.topic ? data.camp.line >= CAMPS[data.stage].talks[data.camp.topic].length : data.camp.line !== 0) return null;
    } else if (data.camp) return null;
    if (data.phase === 'ending' && data.stage !== 2 && data.stage !== FINAL_STAGE) return null;
    if (data.undo) data.routes[data.undo.id] = data.undo.path;
    for (const [id, path] of Object.entries(data.routes)) {
      const u = data.units.find(v => v.id === id);
      if (!u || u.team !== 'ally' || !u.moved || u.acted || data.phase !== 'player' || key(path[path.length - 1]) !== key(u) || path.length - 1 > battle.stats(u).move) return null;
      if (path.some((p, i) => battle.tile(p).terrain === 'water' || (i > 0 && (distance(p, path[i - 1]) !== 1 || Math.abs(battle.tile(p).height - battle.tile(path[i - 1]).height) > 1)))) return null;
      if (new Set(path.map(key)).size !== path.length) return null;
    }
    battle.round = data.round; battle.phase = data.phase; battle.dialogue = data.dialogue; battle.selected = data.selected; battle.potions = data.potions; battle.units = data.units;
    battle.routes = data.routes; battle.camp = data.camp;
    if(STAGES[data.stage].boss&&!('bossWarning' in source)&&['player','enemy'].includes(data.phase))battle.prepareBossWarning();
    battle.note('저장한 원정을 이어갑니다.'); return battle;
  } catch { return null; }
}
