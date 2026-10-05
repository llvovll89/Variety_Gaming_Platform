export const TICK_RATE = 60;
export const LOOP_TICKS = TICK_RATE * 10;
export const MAX_ECHOES = 4;
export const MOVE_TICKS = 9;
export const SAVE_KEY = 'ten-seconds-progress-v1';
export type Point = { x: number; y: number };
export type Direction = 0 | 1 | 2 | 3;
export type Frame = Point & { direction: Direction };
export type Plate = Point & { id: string; color: string; echoOnly?:boolean; pulse?:number };
export type Gate = Point & { plates: string[]; crystal?: string; window?:[number,number]; blockedBy?:string[] };
export type Laser = { cells: Point[]; period: number; active: number; offset: number };
export type Crystal = Point & { id: string; volatile?:boolean };
export type Level = {
  name: string; subtitle: string; story: string; hint: string; start: Point; exit: Point;
  walls: Point[]; plates: Plate[]; gates: Gate[]; lasers: Laser[]; crystals: Crystal[]; par: number; echoLimit?:number; briefing?:string; memory?:string;
};
export const DIRECTIONS: Point[] = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
export const COLORS = ['#73ddd1','#b4a0ff','#ffbf78','#9dd886'];
export const key = (p: Point) => `${p.x},${p.y}`;
export const same = (a:Point,b:Point) => a.x===b.x&&a.y===b.y;
const partition = (x:number,door:number):Point[] => Array.from({length:7},(_,i)=>({x,y:i+1})).filter(p=>p.y!==door);
const plate = (id:string,x:number,y:number,index:number):Plate => ({id,x,y,color:COLORS[index]});
const beam = (x:number,offset=0):Laser => ({cells:[1,2,3,4,5,6,7].map(y=>({x,y})),period:180,active:90,offset});
export const LEVELS:Level[] = [
  {name:'처음 만나는 나',subtitle:'한 명의 잔상, 하나의 문',story:'시간 연구소의 시계가 멈췄다. 10초를 반복하는 작은 탐험가, 루프. 과거의 자신만이 이 문을 열어 줄 수 있다.',hint:'A 발판에 올라간 뒤 R로 되감으세요. 잔상이 A를 밟으면 문을 지나 출구로 갈 수 있어요.',start:{x:2,y:6},exit:{x:10,y:2},walls:partition(6,4),plates:[plate('A',3,3,0)],gates:[{x:6,y:4,plates:['A']}],lasers:[],crystals:[],par:1},
  {name:'릴레이 연구실',subtitle:'과거의 내가, 과거의 나를 돕는다',story:'문 뒤에는 또 다른 문. 첫 잔상이 길을 열면, 두 번째 잔상은 더 멀리 갈 수 있다.',hint:'먼저 A에 잔상을 남기세요. 열린 문을 지나 B에 두 번째 잔상을 남긴 뒤, 두 문을 차례로 통과하세요.',start:{x:2,y:6},exit:{x:11,y:2},walls:[...partition(5,4),...partition(9,3)],plates:[plate('A',3,2,0),plate('B',7,6,1)],gates:[{x:5,y:4,plates:['A']},{x:9,y:3,plates:['B']}],lasers:[],crystals:[],par:2},
  {name:'두 개의 심장',subtitle:'동시에 서야 열리는 문',story:'두 발판의 맥박이 겹칠 때만 시간의 문이 열린다. 붉은 빛이 꺼지는 순간을 기다려라.',hint:'A와 B에 각각 잔상을 남겨 동시에 활성화하세요. 레이저는 1.5초마다 켜지고 꺼집니다. 안전 칸에서 기다렸다가 건너세요.',start:{x:2,y:4},exit:{x:10,y:4},walls:partition(6,4),plates:[plate('A',3,2,0),plate('B',3,6,1)],gates:[{x:6,y:4,plates:['A','B']}],lasers:[beam(8)],crystals:[],par:2},
  {name:'기억의 조각',subtitle:'시간이 돌아가도 기억은 남는다',story:'깨진 시계에서 떨어져 나온 기억 결정. 손에 닿은 조각은 시간이 돌아가도 사라지지 않는다.',hint:'왼쪽 결정을 먼저 수집하고 A에 잔상을 남기세요. 문을 지나 오른쪽 결정도 모으면 출구가 켜집니다. 결정은 되감아도 유지돼요.',start:{x:2,y:4},exit:{x:10,y:2},walls:partition(6,5),plates:[plate('A',3,6,0)],gates:[{x:6,y:5,plates:['A'],crystal:'left'}],lasers:[beam(8,60)],crystals:[{id:'left',x:3,y:2},{id:'right',x:10,y:6}],par:1},
  {name:'세 번의 약속',subtitle:'세 잔상이 만드는 한 길',story:'서로 다른 10초가 같은 순간에 만난다. 혼자였던 발걸음이 작은 원정대가 된다.',hint:'A → B → C 순서로 잔상을 남기세요. 이전 잔상이 발판에 도착하기 전에는 문이 닫혀 있으니 잠깐 기다려 주세요.',start:{x:2,y:5},exit:{x:11,y:2},walls:[...partition(4,5),...partition(7,3),...partition(10,5)],plates:[plate('A',2,2,0),plate('B',5,6,1),plate('C',8,2,2)],gates:[{x:4,y:5,plates:['A']},{x:7,y:3,plates:['B']},{x:10,y:5,plates:['C']}],lasers:[],crystals:[],par:3},
  {name:'다시 흐르는 시간',subtitle:'우리의 모든 순간이 모이는 곳',story:'연구소의 마지막 시계. 세 번의 발자국과 하나의 기억이, 멈춘 세계를 다시 움직인다.',hint:'A·B·C에 잔상을 남겨 문을 열고, 결정을 모아 출구로 가세요. 실패해도 잔상과 결정은 남습니다. 레이저 앞에서 호흡을 고르세요.',start:{x:2,y:4},exit:{x:11,y:4},walls:partition(6,4),plates:[plate('A',2,2,0),plate('B',4,4,1),plate('C',2,6,2)],gates:[{x:6,y:4,plates:['A','B','C']}],lasers:[beam(8),{...beam(10,90),cells:[{x:10,y:3},{x:10,y:4},{x:10,y:5}]}],crystals:[{id:'heart',x:9,y:6}],par:3},
];

LEVELS[2].briefing='레이저는 벽 끝까지 이어집니다. 안전한 칸에서 빛이 꺼지는 순간을 기다리세요.';
LEVELS[3].memory='기억 01 · 연구소의 시간은 고장이 아니라, 누군가를 지키기 위해 멈춰 있었다.';
LEVELS[4].lasers=[{...beam(8),period:150,active:90}];
LEVELS[4].gates[2].window=[240,480];
LEVELS[4].hint='A → B → C에 잔상을 남기세요. 마지막 문은 4~8초에만 열립니다. 세 번째 잔상의 도착과 레이저가 꺼지는 순간을 맞추세요.';
LEVELS[4].briefing='마지막 문: 4~8초 / 레이저: 1.5초 켜짐, 1초 꺼짐.';
LEVELS[5].gates[0].window=[180,360];
LEVELS[5].hint='A·B·C에 잔상을 남기세요. 중앙 문은 3~6초에만 열립니다. 두 레이저 사이의 안전 칸에서 기다리며 결정을 모으세요.';
LEVELS[5].memory='기억 02 · 루프는 자신이 남긴 잔상에서, 사라진 연구원의 걸음을 알아보았다.';
LEVELS[5].name='재가동 관문';
LEVELS.push(
  {name:'찰나의 발판',subtitle:'멈춰 있는 유령으로는 부족하다',story:'문은 이제 긴 기다림을 허락하지 않는다. 발판의 빛이 사라지기 전에 다음 구역을 연결해야 한다.',hint:'A와 B는 유령만 활성화할 수 있고 도착 후 2초면 꺼져요. A 잔상을 만든 뒤, 첫 문을 지나 B까지 가는 경로를 녹화하세요. 두 잔상의 도착 순서를 맞춰 마지막 문을 통과하세요.',start:{x:2,y:6},exit:{x:11,y:2},walls:[...partition(5,4),...partition(9,3)],plates:[{...plate('A',3,2,0),echoOnly:true,pulse:120},{...plate('B',7,6,1),echoOnly:true,pulse:120}],gates:[{x:5,y:4,plates:['A']},{x:9,y:3,plates:['B']}],lasers:[{...beam(10),period:120,active:60}],crystals:[],par:2,echoLimit:2,briefing:'유령 전용 발판 · 활성화 2초 · 잔상 최대 2명',memory:'기억 03 · 멈춰 있던 연구소가 과거를 놓아주기 시작했다. 이제 잔상도 계속 움직여야 한다.'},
  {name:'간섭하는 기억',subtitle:'열어야 할 문, 꺼야 할 발판',story:'모든 기억이 도움이 되는 것은 아니다. 붉은 발판을 지키는 잔상은 출구를 잠가 버린다.',hint:'A는 유령에게 맡기세요. 붉은 B는 아무도 밟지 않아야 첫 문이 열립니다. C 잔상을 남기고, 한 번의 10초 안에 불안정 결정을 수집해 6~9초에 출구 문을 통과하세요.',start:{x:2,y:6},exit:{x:11,y:4},walls:[...partition(5,4),...partition(10,4)],plates:[{...plate('A',3,2,0),echoOnly:true},plate('B',4,4,2),{...plate('C',7,2,1),echoOnly:true}],gates:[{x:5,y:4,plates:['A'],blockedBy:['B']},{x:10,y:4,plates:['C'],window:[360,540]}],lasers:[{...beam(8),period:120,active:70}],crystals:[{id:'unstable',x:9,y:6,volatile:true}],par:2,echoLimit:2,briefing:'붉은 B: 문 잠금 · 출구 문: 6~9초 · 결정은 매번 초기화',memory:'기억 04 · 그는 시간을 돌려 동료를 구하려 했다. 그러나 같은 순간에 머무르면 미래는 열리지 않았다.'},
  {name:'마지막 10초',subtitle:'세 잔상과 함께 완성하는 미래',story:'연구소의 중심 시계에 도착했다. 과거의 세 발자국을 같은 순간에 맞추고, 이번 10초 안에 미래의 조각을 모아라.',hint:'A·B·C는 유령 전용이며 도착 후 2초만 켜집니다. 발판 옆에서 기다렸다가 약 4초에 들어가는 경로를 각각 녹화하세요. 4.5~5.5초 중앙 문을 통과하고, 두 불안정 결정을 모아 8~9.5초 마지막 문으로 탈출하세요.',start:{x:2,y:4},exit:{x:11,y:4},walls:[...partition(6,4),...partition(10,4)],plates:[{...plate('A',2,2,0),echoOnly:true,pulse:120},{...plate('B',4,2,1),echoOnly:true,pulse:120},{...plate('C',2,6,2),echoOnly:true,pulse:120}],gates:[{x:6,y:4,plates:['A','B','C'],window:[270,330]},{x:10,y:4,plates:[],window:[480,570]}],lasers:[{...beam(8,30),period:120,active:60}],crystals:[{id:'dawn',x:9,y:2,volatile:true},{id:'future',x:9,y:6,volatile:true}],par:3,echoLimit:3,briefing:'중앙 문 4.5~5.5초 / 출구 문 8~9.5초 / 결정 2개는 이번 루프 안에',memory:'루프는 과거의 자신들에게 마지막 인사를 건넸다. 시계는 열한 번째 초를 향해 움직이기 시작했다.'},
);
LEVELS[7].plates.find(p=>p.id==='B')!.x=3;
LEVELS[7].plates.find(p=>p.id==='B')!.color='#ff8e79';

export class TimeRun {
  readonly level:Level;
  player:Frame;
  tick=0;
  totalTicks=0;
  accumulator=0;
  cooldown=0;
  route:Direction[]=[];
  practice=false;
  echoes:Frame[][]=[];
  recording:Frame[]=[];
  collected:string[]=[];
  loops=0;
  deaths=0;
  hintsUsed=0;
  status:'ready'|'playing'|'paused'|'won'='ready';
  notice='A 발판으로 이동해 첫 번째 잔상을 남겨 보세요.';
  event=0;
  constructor(readonly levelIndex=0) {
    if(!Number.isInteger(levelIndex)||!LEVELS[levelIndex])throw new Error('Unknown time room');
    this.level=LEVELS[levelIndex];this.player={...this.level.start,direction:0};
    this.notice=this.level.hint;
  }
  get secondsLeft(){return (LOOP_TICKS-this.tick)/TICK_RATE;}
  get echoLimit(){return this.level.echoLimit??MAX_ECHOES;}
  get ghostFrames(){return this.echoes.map(e=>e[Math.min(this.tick,e.length-1)]);}
  plateRemaining(p:Plate){
    let remaining=!p.echoOnly&&same(this.player,p)?Infinity:0;
    this.echoes.forEach(trace=>{const index=Math.min(this.tick,trace.length-1);if(!trace[index]||!same(trace[index],p))return;if(!p.pulse){remaining=Infinity;return;}let duration=1;for(let i=index-1;i>=0&&duration<=p.pulse&&same(trace[i],p);i--)duration++;remaining=Math.max(remaining,Math.max(0,p.pulse-duration+1));});return remaining;
  }
  get occupiedPlates(){return this.level.plates.filter(p=>this.plateRemaining(p)>0).map(p=>p.id);}
  gateOpen(g:Gate){return g.plates.every(id=>this.occupiedPlates.includes(id))&&!(g.blockedBy??[]).some(id=>this.occupiedPlates.includes(id))&&(!g.crystal||this.collected.includes(g.crystal))&&(!g.window||this.tick>=g.window[0]&&this.tick<g.window[1]);}
  laserActive(l:Laser){return (this.tick+l.offset)%l.period<l.active;}
  get exitOpen(){return this.level.crystals.every(c=>this.collected.includes(c.id));}
  get stars(){return this.deaths===0&&this.loops<=this.level.par&&this.hintsUsed===0?3:this.deaths<=2&&this.loops<=this.level.par+2?2:1;}
  walkable(p:Point){return p.x>=1&&p.x<=11&&p.y>=1&&p.y<=7&&!this.level.walls.some(w=>same(w,p))&&!this.level.gates.some(g=>same(g,p)&&!this.gateOpen(g));}
  start(){if(this.status==='ready'||this.status==='paused')this.status='playing';}
  pause(){if(this.status==='playing')this.status='paused';}
  navigateTo(target:Point){
    if(this.status!=='playing'||!Number.isInteger(target.x)||!Number.isInteger(target.y)||!this.walkable(target))return false;
    const canReach=(p:Point)=>p.x>=1&&p.x<=11&&p.y>=1&&p.y<=7&&!this.level.walls.some(w=>same(w,p))&&!this.level.gates.some(g=>same(g,p)&&!this.gateOpen(g)&&!( (!g.crystal||this.collected.includes(g.crystal))&&g.plates.every(id=>{const plate=this.level.plates.find(p=>p.id===id);return !!plate&&this.echoes.some(trace=>trace.some(frame=>same(frame,plate)));}) ));
    const queue=[{p:{x:this.player.x,y:this.player.y},path:[] as Direction[]}],seen=new Set<string>();
    for(let i=0;i<queue.length;i++){const {p,path}=queue[i];if(same(p,target)){this.route=path;return true;}if(seen.has(key(p)))continue;seen.add(key(p));
      DIRECTIONS.forEach((d,index)=>{const next={x:p.x+d.x,y:p.y+d.y};if(canReach(next)&&!seen.has(key(next))&&!this.level.lasers.some(l=>this.laserActive(l)&&l.cells.some(c=>same(c,next))))queue.push({p:next,path:[...path,index as Direction]});});
    }
    this.route=[];return false;
  }
  move(direction:Direction){
    if(this.status!=='playing'||this.cooldown>0||!DIRECTIONS[direction])return false;
    const d=DIRECTIONS[direction],p={x:this.player.x+d.x,y:this.player.y+d.y};this.player.direction=direction;
    if(!this.walkable(p))return false;
    Object.assign(this.player,p);this.cooldown=MOVE_TICKS;this.checkPosition();return true;
  }
  checkPosition(){
    if(this.level.lasers.some(l=>this.laserActive(l)&&l.cells.some(p=>same(p,this.player)))){this.deaths++;this.resetLoop();this.notice=this.level.crystals.some(c=>c.volatile)?'레이저에 닿았어요. 잔상은 유지되지만 불안정 결정은 초기화됩니다. 빛이 꺼진 뒤 건너세요.':'레이저에 닿았어요. 잔상과 결정은 유지됩니다. 빛이 꺼진 뒤 건너세요.';return;}
    for(const c of this.level.crystals)if(same(c,this.player)&&!this.collected.includes(c.id)){this.collected.push(c.id);this.notice=c.volatile?'불안정 결정 수집! 이번 10초 안에 탈출해야 해요. 되감거나 레이저에 닿으면 사라집니다.':'기억 결정 수집! 되감아도 이 기억은 남아요.';this.event++;}
    if(same(this.player,this.level.exit)&&this.exitOpen){this.status='won';this.notice='시간의 연결이 완성되었습니다.';this.event++;}
  }
  advance(seconds:number,direction?:Direction){
    if(this.status!=='playing'||!Number.isFinite(seconds)||seconds<0)return;
    if(this.practice&&!this.echoes.length&&direction===undefined&&!this.route.length&&this.cooldown===0)return;
    this.accumulator+=Math.min(seconds,0.1)*TICK_RATE;
    while(this.accumulator>=1&&this.status==='playing'){
      this.accumulator--;this.cooldown=Math.max(0,this.cooldown-1);
      if(direction!==undefined){this.route=[];this.move(direction);}else if(this.route.length&&this.cooldown===0){const next=this.route[0];if(this.move(next))this.route.shift();else{const d=DIRECTIONS[next],p={x:this.player.x+d.x,y:this.player.y+d.y};if(this.level.gates.some(g=>same(g,p)&&!this.gateOpen(g)))this.notice='문 앞에서 기다리는 중이에요. 유령이 발판을 밟으면 자동으로 이어서 이동합니다.';else this.route=[];}}
      if(this.status!=='playing')break;
      this.checkPosition();
      if(this.status!=='playing')break;
      if(this.recording.length<LOOP_TICKS)this.recording.push({...this.player});this.tick++;this.totalTicks++;
      if(this.tick>=LOOP_TICKS){if(this.practice)this.tick=LOOP_TICKS-1;else this.rewind();}
    }
  }
  resetLoop(){this.tick=0;this.collected=this.collected.filter(id=>!this.level.crystals.some(c=>c.id===id&&c.volatile));this.recording=[];this.route=[];this.cooldown=0;this.player={...this.level.start,direction:0};this.event++;}
  rewind(){
    if(this.status!=='playing'||this.tick===0&&this.recording.length===0&&same(this.player,this.level.start))return false;
    if(this.echoes.length>=this.echoLimit){this.pause();this.notice=`이 방의 잔상 ${this.echoLimit}개가 가득 찼어요. 마지막 잔상을 지우거나 방을 다시 시작하세요.`;return false;}
    const recording=this.recording.map(f=>({...f}));
    if(this.practice&&recording.length>=LOOP_TICKS)recording[LOOP_TICKS-1]={...this.player};
    if(!recording.length)recording.push({...this.player});
    while(recording.length<LOOP_TICKS)recording.push({...this.player});
    this.echoes.push(recording.slice(0,LOOP_TICKS));this.loops++;this.resetLoop();
    this.notice=`잔상 ${this.echoes.length}이 이전 행동을 반복합니다. 일찍 되감은 뒤의 시간에는 마지막 위치에 머물러요.`;return true;
  }
  removeLastEcho(){if(this.status==='won'||this.echoes.length===0)return false;this.echoes.pop();this.resetLoop();this.notice='마지막 잔상을 지웠어요. 다시 경로를 만들어 보세요.';return true;}
}

export type Progress={unlocked:number;best:Record<string,{stars:number;loops:number;deaths:number}>};
export const emptyProgress=():Progress=>({unlocked:0,best:{}});
export function loadProgress(raw:string|null):Progress {
  if(!raw)return emptyProgress();
  try{const p=JSON.parse(raw);if(!Number.isInteger(p.unlocked)||p.unlocked<0||p.unlocked>=LEVELS.length||!p.best||typeof p.best!=='object'||Array.isArray(p.best))return emptyProgress();
    const best:Progress['best']={};for(const [id,v] of Object.entries(p.best)){const score=v as Progress['best'][string];if(!/^\d+$/.test(id)||Number(id)>=LEVELS.length||!score||![score.stars,score.loops,score.deaths].every(Number.isInteger)||score.stars<1||score.stars>3||score.loops<0||score.deaths<0)return emptyProgress();best[id]={stars:score.stars,loops:score.loops,deaths:score.deaths};}return{unlocked:p.unlocked===5&&best[5]?6:p.unlocked,best};
  }catch{return emptyProgress();}
}
export function completeRoom(progress:Progress,run:TimeRun):Progress {
  if(run.status!=='won')return progress;const best={...progress.best},previous=best[run.levelIndex];
  if(!previous||run.stars>previous.stars||run.stars===previous.stars&&run.loops<previous.loops)best[run.levelIndex]={stars:run.stars,loops:run.loops,deaths:run.deaths};
  return {unlocked:Math.max(progress.unlocked,Math.min(LEVELS.length-1,run.levelIndex+1)),best};
}
