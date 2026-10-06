export type Point = { x: number; y: number };
export type Direction = 0 | 1 | 2 | 3;
import { ADVANCED_LEVELS } from './levels';
export type FurnitureKind = 'sofa' | 'fan' | 'fridge' | 'vacuum' | 'bed' | 'lamp' | 'cart';
export type Furniture = Point & { id: string; kind: FurnitureKind; direction: Direction };
export type Cargo = Point & { id: string; kind: 'box' | 'wardrobe'; delivered: boolean };
export type Goal = Point & { kind: Cargo['kind'] };
export type Level = { name: string; client: string; story: string; lesson: string; hint: string; width: number; height: number; budget: number; par: number; walls: Point[]; gates?:Point[]; furniture: Furniture[]; cargo: Cargo[]; goals: Goal[]; solution: string[] };
export const SAVE_KEY = 'gh-ghost-movers-v1';
export const DIRECTIONS: readonly Point[] = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
export const FURNITURE = {
  sofa: { name: '소파', ability: '쿵! 밀기', description: '상자를 밀며 이동해요. 능력으로 제자리에서 한 칸 밀어요.', color: '#e2a479' },
  fan: { name: '선풍기', ability: '바람 보내기', description: '앞쪽 5칸 안의 상자를 바람으로 밀어요. 가구와 벽은 바람을 막아요.', color: '#95cbbc' },
  fridge: { name: '냉장고', ability: '얼음길 만들기', description: '앞쪽 4칸을 얼려요. 얼음 위 옷장은 밀 수 있고, 짐은 쭉 미끄러져요.', color: '#b6c6e1' },
  vacuum: { name: '로봇청소기', ability: '짐 당기기', description: '앞쪽 4칸 안의 짐을 한 칸 당겨요. 바로 붙어 있는 짐은 당길 수 없어요.', color: '#d9a8d9' },
  bed: { name: '침대', ability: '스프링 점프', description: '바로 앞 상자를 두 칸 튕겨요. 낮은 파티션을 넘을 수 있지만 착지 칸은 비어야 해요.', color: '#a5b8ed' },
  lamp: { name: '스탠드', ability: '전동문 전환', description: '모든 노란 전동문을 열거나 닫아요. 문 위에 짐이나 가구가 있으면 닫을 수 없어요.', color: '#efd48e' },
  cart: { name: '이동식 책상', ability: '짐 싣고 내리기', description: '바로 앞의 짐을 실어 운반해요. 옷장도 실을 수 있어요. 다시 능력을 쓰면 앞 칸에 내려요.', color: '#e9ad91' },
} as const;
const item = (id:string,kind:FurnitureKind,x:number,y:number,direction:Direction=1):Furniture => ({id,kind,x,y,direction});
const cargo = (id:string,kind:Cargo['kind'],x:number,y:number):Cargo => ({id,kind,x,y,delivered:false});
const goal = (kind:Cargo['kind'],x:number,y:number):Goal => ({kind,x,y});
const walls = (...positions:number[][]):Point[] => positions.map(([x,y])=>({x,y}));
function level(data:Omit<Level,'width'|'height'|'walls'|'solution'> & {walls?:Point[];solution?:string[]}):Level { return {width:9,height:7,walls:[],solution:[],...data}; }
// Solutions use the same public commands as a player; the tests replay them.
export const LEVELS: readonly Level[] = [
  level({name:'첫 야간 이사',client:'달빛 빌라 101호',story:'집주인은 산책 중. 소파에 빙의해서 상자 하나만 먼저 옮겨 볼까요?',lesson:'소파를 누른 뒤 오른쪽으로 이동하세요. 상자가 초록 발판에 닿으면 배송 끝!',hint:'소파로 오른쪽을 네 번 누르면 상자가 출구에 도착해요.',budget:24,par:4,furniture:[item('sofa','sofa',2,3),item('fan','fan',1,1),item('fridge','fridge',6,1)],cargo:[cargo('a','box',4,3)],goals:[goal('box',7,3)],solution:['@sofa','R','R','R','R']}),
  level({name:'손대지 않고 배송',client:'달빛 빌라 202호',story:'새로 산 상자라 흠집이 나면 안 된대요. 바람이라면 괜찮겠죠?',lesson:'선풍기는 짐을 밀며 걸을 수 없어요. 오른쪽을 바라보고 능력을 쓰세요.',hint:'선풍기는 지금 오른쪽을 보고 있어요. 바람 보내기를 세 번 사용하세요.',budget:20,par:3,furniture:[item('fan','fan',2,3),item('sofa','sofa',1,5),item('fridge','fridge',7,5)],cargo:[cargo('a','box',4,3)],goals:[goal('box',7,3)],solution:['@fan','!','!','!']}),
  level({name:'거실의 작은 미로',client:'구름 주택 3층',story:'벽 사이로 짐을 돌아가며 옮겨야 해요. 구석에 몰아넣지 않도록 조심!',lesson:'소파는 짐을 당길 수 없어요. 막혔다면 한 수 되돌리기를 사용하세요.',hint:'아래 상자부터 오른쪽으로 옮겨요. 소파를 왼쪽으로 돌려 위쪽 상자 뒤로 이동하세요.',budget:42,par:14,walls:walls([3,3],[5,3]),furniture:[item('sofa','sofa',2,4),item('fan','fan',1,1),item('fridge','fridge',7,1)],cargo:[cargo('a','box',4,4),cargo('b','box',4,2)],goals:[goal('box',7,4),goal('box',7,2)],solution:['@sofa','R','R','R','R','L','L','L','L','U','U','R','R','R','R']}),
  level({name:'꿈쩍도 않는 옷장',client:'눈꽃 아파트 404호',story:'이 옷장에는 겨울 외투가 백 벌! 먼저 바닥을 얼리면 가볍게 미끄러져요.',lesson:'냉장고로 옷장 아래를 얼리고, 냉장고를 비킨 다음 선풍기로 밀어 보세요.',hint:'냉장고를 오른쪽, 아래로 이동 → 얼음길 → 위로 비켜요. 선풍기로 바람을 보내세요.',budget:30,par:5,furniture:[item('fridge','fridge',2,2),item('fan','fan',2,3)],cargo:[cargo('a','wardrobe',4,3)],goals:[goal('wardrobe',7,3)],solution:['@fridge','R','D','>1','!','U','@fan','!']}),
  level({name:'바람의 교차로',client:'바람 연립 5호',story:'가로로 한 상자, 세로로 한 상자. 선풍기도 오늘은 걸어 다녀야겠어요.',lesson:'방향 버튼으로 제자리 회전이 가능해요. 상자 뒤에 서서 바람을 보내세요.',hint:'가로 상자는 바람 두 번. 선풍기를 위쪽 상자 바로 위에 세워 아래로 바람 세 번!',budget:35,par:10,walls:walls([7,3]),furniture:[item('fan','fan',2,3),item('sofa','sofa',1,5),item('fridge','fridge',7,5)],cargo:[cargo('a','box',4,3),cargo('b','box',5,2)],goals:[goal('box',6,3),goal('box',5,5)],solution:['@fan','!','!','R','U','U','R','R','>2','!','!','!']}),
  level({name:'냉동실과 소파의 협업',client:'별무리 맨션 601호',story:'옷장은 너무 무겁고 상자는 너무 많아요. 둘이 힘을 합치면 되죠.',lesson:'소파도 얼음 위의 옷장을 밀 수 있어요. 얼음길 끝까지 한 번에 배송!',hint:'냉장고를 옷장 왼쪽에 세워 얼리고 비켜요. 소파로 옷장을 밀고 위층 상자를 옮겨요.',budget:46,par:15,walls:walls([5,3],[6,3]),furniture:[item('fridge','fridge',2,2),item('sofa','sofa',2,4)],cargo:[cargo('a','wardrobe',4,4),cargo('b','box',4,2)],goals:[goal('wardrobe',7,4),goal('box',7,2)],solution:['@fridge','R','D','D','>1','!','U','@sofa','R','R','L','L','U','U','R','R','R','R']}),
  level({name:'복도 끝의 겨울',client:'초승달 하우스 7호',story:'좁은 복도에는 한 명씩. 바람이 통할 자리를 남겨 두는 게 비결이에요.',lesson:'벽과 다른 가구는 능력을 막아요. 냉장고가 바람 길을 막고 있지 않은지 확인하세요.',hint:'먼저 위쪽 상자를 바람으로 배송. 냉장고를 옷장 왼쪽으로 옮겨 얼린 뒤 위로 비켜요.',budget:50,par:11,walls:walls([4,4],[5,4]),furniture:[item('fan','fan',2,2),item('fridge','fridge',2,4)],cargo:[cargo('a','wardrobe',5,3),cargo('b','box',4,2)],goals:[goal('wardrobe',7,3),goal('box',7,2)],solution:['@fan','!','!','!','@fridge','R','U','R','!','U','@fan','D','R','>1','!']}),
  level({name:'마지막 짐, 첫 햇살',client:'새벽 저택 8호',story:'해 뜨기 전 마지막 의뢰. 세 가구가 힘을 합쳐 모든 짐을 실어 주세요!',lesson:'상자는 소파와 바람, 옷장은 얼음길. 배운 능력을 모두 활용해요.',hint:'위쪽과 아래쪽 상자를 먼저 배송하세요. 가운데 옷장은 냉장고로 얼리고 바람으로 밀어요.',budget:64,par:14,walls:walls([5,1],[5,5]),furniture:[item('sofa','sofa',2,4),item('fan','fan',2,2),item('fridge','fridge',2,3)],cargo:[cargo('a','box',4,2),cargo('b','box',4,4),cargo('c','wardrobe',5,3)],goals:[goal('box',7,2),goal('box',7,4),goal('wardrobe',7,3)],solution:['@fan','!','!','!','@sofa','R','R','R','R','@fridge','R','R','!','U','@fan','D','R','>1','!']}),
  ...ADVANCED_LEVELS,
];
export const CHAPTERS = [{name:'신입 야간조',description:'빙의와 밀기, 바람과 얼음길을 익히는 여덟 집.',start:0,end:8,color:'#9fdccb'},{name:'이상한 가구 연구소',description:'네 가지 새 능력과 전동문, 파티션을 연결하는 실험.',start:8,end:16,color:'#aab9f0'},{name:'한밤의 대형 이사',description:'여러 방과 여섯 개의 짐. 능력을 조합하는 긴 의뢰.',start:16,end:24,color:'#efba91'}] as const;
export const chapterOf = (index:number) => CHAPTERS[Math.min(2,Math.floor(index/8))];
export type Snapshot = { furniture:Furniture[]; cargo:Cargo[]; ghost:Point; active:string|null; ice:string[]; powered:boolean; carry:{cargoId:string;furnitureId:string}|null; steps:number; status:'playing'|'won'|'lost'; message:string };
export type State = Snapshot & { levelIndex:number; relaxed:boolean; history:Snapshot[]; undos:number; hints:number; effect:{id:number;kind:'wind'|'ice'|'push'|'pull'|'jump'|'light'|'carry';origin:Point;direction:Direction}|null };
export type Command = {type:'move';direction:Direction}|{type:'navigate';point:Point}|{type:'target';id:string}|{type:'face';direction:Direction}|{type:'possess';id:string}|{type:'ability'}|{type:'release'}|{type:'undo'}|{type:'hint'};
export const key = (p:Point) => `${p.x},${p.y}`;
export const same = (a:Point,b:Point) => a.x===b.x&&a.y===b.y;
export function createState(levelIndex=0,relaxed=false):State {
  const index=Number.isInteger(levelIndex)&&levelIndex>=0&&levelIndex<LEVELS.length?levelIndex:0,l=LEVELS[index];
  return {levelIndex:index,relaxed,furniture:l.furniture.map(f=>({...f})),cargo:l.cargo.map(c=>({...c})),ghost:{x:1,y:4},active:null,ice:[],powered:false,carry:null,steps:0,status:'playing',message:l.lesson,history:[],undos:0,hints:0,effect:null};
}
function snapshot(s:State):Snapshot {return {furniture:s.furniture.map(f=>({...f})),cargo:s.cargo.map(c=>({...c})),ghost:{...s.ghost},active:s.active,ice:[...s.ice],powered:s.powered,carry:s.carry?{...s.carry}:null,steps:s.steps,status:s.status,message:s.message};}
function wall(l:Level,p:Point,powered=false) {return p.x<=0||p.y<=0||p.x>=l.width-1||p.y>=l.height-1||l.walls.some(w=>same(w,p))||!powered&&!!l.gates?.some(g=>same(g,p));}
function shifted(p:Point,d:Point):Point {return {x:p.x+d.x,y:p.y+d.y};}
function obstacle(s:State,p:Point,ignore?:string) {return wall(LEVELS[s.levelIndex],p,s.powered)||s.furniture.some(f=>f.id!==ignore&&same(f,p))||s.cargo.some(c=>!c.delivered&&c.id!==ignore&&c.id!==s.carry?.cargoId&&same(c,p));}
// Click-to-walk only crosses empty cells. It never pushes a parcel by accident.
export function routeTo(s:State,point:Point):Direction[]|null {
  const f=s.furniture.find(f=>f.id===s.active);
  if(!f||!Number.isInteger(point.x)||!Number.isInteger(point.y)||obstacle(s,point,f.id))return null;
  const queue:{point:Point;route:Direction[]}[]=[{point:f,route:[]}],seen=new Set([key(f)]);
  for(let i=0;i<queue.length;i++){
    const node=queue[i];if(same(node.point,point))return node.route;
    for(let d=0;d<4;d++){const next=shifted(node.point,DIRECTIONS[d]);if(seen.has(key(next))||obstacle(s,next,f.id))continue;seen.add(key(next));queue.push({point:next,route:[...node.route,d as Direction]});}
  }
  return null;
}
function walkRoute(s:State,route:Direction[]) {for(const direction of route){if(s.status!=='playing')break;s=act(s,{type:'move',direction});}return s;}
function targetCargo(s:State,id:string):State {
  const f=s.furniture.find(f=>f.id===s.active),c=s.cargo.find(c=>c.id===id&&!c.delivered&&c.id!==s.carry?.cargoId);
  if(!f)return {...s,message:'가구를 먼저 눌러 빙의하세요. 짐은 가구 앞에서 능력으로 옮겨요.'};
  if(!c)return s;
  if(f.kind==='lamp')return {...s,message:'스탠드는 짐 대신 전동문을 조작해요. 능력 버튼이나 Space를 누르세요.'};
  if(s.carry?.furnitureId===f.id)return {...s,message:'이미 짐을 실었어요. 빈 바닥으로 이동한 뒤 원하는 방향으로 내려놓으세요.'};
  const range=f.kind==='fan'?5:f.kind==='vacuum'||f.kind==='fridge'?4:1,min=f.kind==='vacuum'?2:1;
  const options:{route:Direction[];direction:Direction;distance:number}[]=[];
  for(let d=0;d<4;d++)for(let distance=min;distance<=range;distance++){
    const delta=DIRECTIONS[d],point={x:c.x-delta.x*distance,y:c.y-delta.y*distance},route=routeTo(s,point);if(!route)continue;
    let clear=true;for(let n=1;n<distance;n++){const p={x:point.x+delta.x*n,y:point.y+delta.y*n};if(wall(LEVELS[s.levelIndex],p,s.powered)||s.furniture.some(o=>o.id!==f.id&&same(o,p))||f.kind!=='fridge'&&s.cargo.some(o=>!o.delivered&&o.id!==s.carry?.cargoId&&same(o,p))){clear=false;break;}}
    if(clear)options.push({route,direction:d as Direction,distance});
  }
  options.sort((a,b)=>a.route.length-b.route.length||a.distance-b.distance);
  const best=options[0];if(!best)return {...s,message:'이 짐에 다가갈 길이 없어요. 문을 열거나 다른 가구를 먼저 옮겨 보세요.'};
  const moved=walkRoute(s,best.route);if(moved.status!=='playing')return moved;
  return {...act(moved,{type:'face',direction:best.direction}),message:`짐을 바라보고 있어요. ${FURNITURE[f.kind].ability}: 능력 버튼 또는 Space를 누르세요.`};
}
function deliver(s:State,c:Cargo) {
  const l=LEVELS[s.levelIndex];
  if(l.goals.some(g=>g.kind===c.kind&&same(g,c))&&!s.cargo.some(other=>other.id!==c.id&&other.delivered&&same(other,c))){c.delivered=true;s.message=c.kind==='wardrobe'?'옷장 배송 완료! 얼음길의 힘이에요.':'상자 배송 완료! 짐 하나 줄었어요.';}
}
function push(s:State,c:Cargo,d:Point) {
  if(c.kind==='wardrobe'&&!s.ice.includes(key(c))) {s.message='옷장이 너무 무거워요. 냉장고로 옷장 아래를 먼저 얼리세요.';return false;}
  let p=shifted(c,d);if(obstacle(s,p,c.id)){s.message='짐 앞이 막혔어요. 다른 쪽에서 밀거나 한 수 되돌려 보세요.';return false;}
  s.message='짐을 한 칸 밀었어요.';Object.assign(c,p);deliver(s,c);
  while(!c.delivered&&s.ice.includes(key(c))) {p=shifted(c,d);if(obstacle(s,p,c.id))break;Object.assign(c,p);deliver(s,c);}
  return true;
}
export function act(state:State,command:Command):State {
  if(command.type==='undo') {
    const previous=state.history.at(-1);if(!previous)return state;
    return {...state,...previous,history:state.history.slice(0,-1),undos:state.undos+1,effect:null,message:'한 수 되돌렸어요. 다른 방법으로 해 볼까요?'};
  }
  if(state.status!=='playing')return state;
  if(command.type==='navigate') {
    if(!state.active)return {...state,message:'움직일 가구를 먼저 눌러 빙의하세요.'};
    const route=routeTo(state,command.point);
    if(!route)return {...state,message:'그 칸으로 가는 빈 길이 없어요. 짐을 누르면 능력을 쓸 위치를 찾아요.'};
    return walkRoute(state,route);
  }
  if(command.type==='target')return targetCargo(state,command.id);
  if(command.type==='hint')return {...state,hints:state.hints+1,message:LEVELS[state.levelIndex].hint};
  if(command.type==='release')return {...state,active:null,ghost:{...(state.furniture.find(f=>f.id===state.active)??state.ghost)},effect:null,message:'자유로운 유령! 다른 가구를 눌러 빙의하세요.'};
  if(command.type==='possess') {
    const f=state.furniture.find(f=>f.id===command.id);if(!f)return state;
    return {...state,active:f.id,ghost:{x:f.x,y:f.y},effect:null,message:`${FURNITURE[f.kind].name}에 빙의했어요. ${FURNITURE[f.kind].description}`};
  }
  const s:State={...state,...snapshot(state),effect:null};
  const f=s.furniture.find(f=>f.id===s.active);
  if(command.type==='face') {if(!f)return state;f.direction=command.direction;return s;}
  let changed=false;
  if(command.type==='move') {
    const d=DIRECTIONS[command.direction];
    if(!f){const p=shifted(s.ghost,d);const l=LEVELS[s.levelIndex];if(p.x>0&&p.y>0&&p.x<l.width-1&&p.y<l.height-1){s.ghost=p;return s;}return state;}
    f.direction=command.direction;const p=shifted(f,d);
    const c=s.cargo.find(c=>!c.delivered&&c.id!==s.carry?.cargoId&&same(c,p));
    if(c) {
      if(f.kind!=='sofa')s.message='이 가구는 짐을 밀며 걸을 수 없어요. 능력을 쓰거나 소파로 바꾸세요.';
      else if(push(s,c,d)){Object.assign(f,p);changed=true;}
    } else if(!obstacle(s,p,f.id)){Object.assign(f,p);changed=true;s.message='조용조용… 이삿짐 앞으로 이동했어요.';}
    else s.message='벽이나 다른 가구가 막고 있어요. 방향만 바뀌었어요.';
  } else if(f) {
    const d=DIRECTIONS[f.direction];
    if(f.kind==='fridge') {
      let p={x:f.x,y:f.y};
      for(let i=0;i<4;i++){p=shifted(p,d);if(wall(LEVELS[s.levelIndex],p,s.powered)||s.furniture.some(other=>other.id!==f.id&&same(other,p)))break;if(!s.ice.includes(key(p))){s.ice.push(key(p));changed=true;}}
      s.message=changed?'찰칵! 얼음길 완성. 짐을 밀면 얼음 끝까지 미끄러져요.':'새로 얼릴 바닥이 없어요. 위치나 방향을 바꿔 보세요.';
    } else if(f.kind==='lamp') {
      const gates=LEVELS[s.levelIndex].gates??[];
      const occupied=gates.some(p=>s.furniture.some(o=>same(o,p))||s.cargo.some(c=>!c.delivered&&c.id!==s.carry?.cargoId&&same(c,p)));
      if(!gates.length)s.message='이 집에는 전동문이 없어요.';
      else if(s.powered&&occupied)s.message='문 위에 짐이나 가구가 있어 닫을 수 없어요.';
      else{s.powered=!s.powered;changed=true;s.message=s.powered?'불이 켜졌어요! 노란 전동문이 열렸어요.':'전동문을 닫았어요.';}
    } else if(f.kind==='cart') {
      const p=shifted(f,d);
      if(s.carry?.furnitureId===f.id){const c=s.cargo.find(c=>c.id===s.carry!.cargoId)!;if(obstacle(s,p,c.id))s.message='내려놓을 자리가 막혔어요. 빈 칸을 바라보세요.';else{Object.assign(c,p);s.carry=null;changed=true;s.message='짐을 내려놓았어요.';deliver(s,c);}}
      else if(s.carry)s.message='다른 책상이 이미 짐을 운반 중이에요.';
      else {const c=s.cargo.find(c=>!c.delivered&&same(c,p));if(c){s.carry={cargoId:c.id,furnitureId:f.id};Object.assign(c,{x:f.x,y:f.y});changed=true;s.message='짐을 실었어요! 원하는 자리까지 이동한 뒤 내려놓으세요.';}else s.message='바로 앞에 실을 짐이 없어요.';}
    } else if(f.kind==='bed') {
      const c=s.cargo.find(c=>!c.delivered&&c.id!==s.carry?.cargoId&&same(c,shifted(f,d)));
      if(!c)s.message='바로 앞에 튕길 상자가 없어요.';
      else if(c.kind==='wardrobe')s.message='옷장은 너무 무거워서 튕길 수 없어요.';
      else {const landing=shifted(shifted(c,d),d);if(obstacle(s,landing,c.id))s.message='두 칸 앞 착지 자리가 막혔어요.';else{Object.assign(c,landing);changed=true;s.message='통통! 파티션 너머로 상자를 튕겼어요.';deliver(s,c);}}
    } else {
      let p={x:f.x,y:f.y},found=false;const range=f.kind==='fan'?5:1;
      for(let i=0;i<(f.kind==='vacuum'?4:range);i++){p=shifted(p,d);if(wall(LEVELS[s.levelIndex],p,s.powered)||s.furniture.some(other=>other.id!==f.id&&same(other,p)))break;const c=s.cargo.find(c=>!c.delivered&&c.id!==s.carry?.cargoId&&same(c,p));if(c){found=true;changed=push(s,c,f.kind==='vacuum'?{x:-d.x,y:-d.y}:d);break;}}
      if(changed&&s.message===state.message)s.message=f.kind==='fan'?'후우! 바람으로 짐을 밀었어요.':'쿵! 소파가 짐을 밀었어요.';
      if(!found)s.message=f.kind==='vacuum'?'앞쪽에 당길 짐이 없어요. 짐을 눌러 다가가서 바라보세요.':'앞쪽에 밀 짐이 없어요. 짐을 눌러 다가가서 바라보세요.';
    }
    if(changed)s.effect={id:state.steps+1,kind:({sofa:'push',fan:'wind',fridge:'ice',vacuum:'pull',bed:'jump',lamp:'light',cart:'carry'} as const)[f.kind],origin:{x:f.x,y:f.y},direction:f.direction};
  } else s.message='먼저 방 안의 가구를 눌러 빙의하세요.';
  if(!changed)return s;
  s.steps++;
  if(s.carry?.furnitureId===f!.id){const c=s.cargo.find(c=>c.id===s.carry!.cargoId)!;Object.assign(c,{x:f!.x,y:f!.y});}
  s.history=[...state.history,snapshot(state)];
  s.ghost={x:f!.x,y:f!.y};
  if(s.cargo.every(c=>c.delivered)){s.status='won';s.message='이사 완료! 집주인이 오기 전에 깔끔하게 끝냈어요.';}
  else if(!s.relaxed&&s.steps>=LEVELS[s.levelIndex].budget){s.status='lost';s.message='집주인이 돌아왔어요! 되돌리거나 여유 모드로 다시 도전하세요.';}
  return s;
}
export function stars(s:State) {if(s.status!=='won')return 0;return s.hints===0&&s.steps<=LEVELS[s.levelIndex].par?3:s.steps<=LEVELS[s.levelIndex].par+10?2:1;}
export type Progress = { unlocked:number; best:Record<number,{stars:number;steps:number}> };
export function loadProgress(raw:string|null):Progress {
  const clean:Progress={unlocked:0,best:{}};
  try {const p=JSON.parse(raw??'null');if(!p||typeof p!=='object')return clean;
    for(let i=0;i<LEVELS.length;i++){const r=p.best?.[i];if(r&&Number.isInteger(r.stars)&&r.stars>=1&&r.stars<=3&&Number.isInteger(r.steps)&&r.steps>=1&&r.steps<10000)clean.best[i]={stars:r.stars,steps:r.steps};}
    while(clean.unlocked<LEVELS.length-1&&clean.best[clean.unlocked])clean.unlocked++;
  }catch{/* A broken save starts a fresh shift. */}return clean;
}
export function completeLevel(p:Progress,s:State):Progress {
  if(s.status!=='won')return p;
  const next:Progress={unlocked:Math.min(LEVELS.length-1,Math.max(p.unlocked,s.levelIndex+1)),best:{...p.best}},old=next.best[s.levelIndex],rating=stars(s);
  if(!old||rating>old.stars||rating===old.stars&&s.steps<old.steps)next.best[s.levelIndex]={stars:rating,steps:s.steps};
  return next;
}
