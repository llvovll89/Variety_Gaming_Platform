import type { Cargo, Direction, Furniture, FurnitureKind, Goal, Level, Point } from './engine';
const f=(id:string,kind:FurnitureKind,x:number,y:number,direction:Direction=1):Furniture=>({id,kind,x,y,direction});
const c=(id:string,kind:Cargo['kind'],x:number,y:number):Cargo=>({id,kind,x,y,delivered:false});
const g=(kind:Cargo['kind'],x:number,y:number):Goal=>({kind,x,y});
const repeat=(token:string,n:number)=>Array.from({length:n},()=>token);
const points=(...pairs:number[][]):Point[]=>pairs.map(([x,y])=>({x,y}));
type Plan=Omit<Level,'width'|'height'|'budget'|'par'> & {width?:number;height?:number};
function house(plan:Plan):Level {
  const par=plan.solution.filter(t=>['U','R','D','L','!'].includes(t)).length;
  return {width:11,height:9,...plan,par,budget:par+Math.max(16,Math.ceil(par*.55))};
}
const lab:Level[]=[
  house({name:'구석의 짐을 꺼내라',client:'가구 연구소 A동',story:'벽에 붙은 상자는 밀 수 없어요. 새 동료 로봇청소기가 구석의 짐을 꺼내 줄 거예요.',lesson:'로봇청소기로 상자를 당겨 왼쪽 배송 칸에 옮기세요. 오른쪽 짐은 선풍기가 맡아요.',hint:'청소기 바람을 세 번 쓰고 아래로 네 칸 이동하세요. 선풍기는 아래를 보고 세 번 밀어요.',walls:points([6,3],[6,5]),furniture:[f('vacuum','vacuum',1,2),f('fan','fan',8,1,2),f('sofa','sofa',3,7)],cargo:[c('a','box',5,2),c('b','box',5,6),c('c','box',8,4)],goals:[g('box',2,2),g('box',2,6),g('box',8,7)],solution:['@vacuum','!','!','!',...repeat('D',4),'>1','!','!','!','@fan','!','!','!']}),
  house({name:'통통, 파티션 넘기',client:'가구 연구소 B동',story:'길을 막은 낮은 파티션. 돌아갈 수 없다면 상자를 튕겨 보내요.',lesson:'침대 스프링은 바로 앞 상자를 두 칸 튕겨요. 착지 칸이 비었는지 확인하세요.',hint:'오른쪽 상자를 튕긴 뒤 침대를 아래로 두 칸씩 이동해 나머지 짐도 보내세요.',walls:points([4,2],[4,4],[4,6]),furniture:[f('bed','bed',2,2),f('lamp','lamp',8,3),f('vacuum','vacuum',7,6)],cargo:[c('a','box',3,2),c('b','box',3,4),c('c','box',3,6)],goals:[g('box',5,2),g('box',5,4),g('box',5,6)],solution:['@bed','!','D','D','>1','!','D','D','>1','!']}),
  house({name:'불을 켜면 길이 열린다',client:'전동문 실험실',story:'두 방 사이의 전동문이 닫혀 있어요. 스탠드의 전원을 켜야 이사를 계속할 수 있어요.',lesson:'스탠드 능력으로 노란 문을 열고 소파로 두 방의 짐을 옮기세요.',hint:'스탠드를 켜고 위쪽 상자를 오른쪽으로 여섯 번 옮겨요. 왼쪽으로 돌아와 아래쪽도 옮겨요.',walls:points([6,1],[6,3],[6,4],[6,5],[6,7]),gates:points([6,2],[6,6]),furniture:[f('lamp','lamp',1,4),f('sofa','sofa',2,2),f('fridge','fridge',1,7),f('fan','fan',9,7)],cargo:[c('a','box',4,2),c('b','box',4,6)],goals:[g('box',9,2),g('box',9,6)],solution:['@lamp','!','@sofa',...repeat('R',6),...repeat('L',6),...repeat('D',4),...repeat('R',6)]}),
  house({name:'옷장도 싣습니다',client:'이동식 가구 창고',story:'옷장을 책상 위에 실으면 얼음 없이도 운반할 수 있어요. 도착 후 내려놓는 것까지가 배송!',lesson:'이동식 책상으로 앞의 짐을 실으세요. 짐을 실은 채 방향을 바꿔 운반할 수 있어요.',hint:'옷장을 실어 오른쪽 네 칸, 아래 네 칸 이동해 내려요. 다시 왼쪽과 위로 돌아와 상자를 실어요.',walls:points([5,5]),furniture:[f('cart','cart',3,2),f('lamp','lamp',1,5),f('fridge','fridge',9,5),f('sofa','sofa',2,7)],cargo:[c('a','wardrobe',4,2),c('b','box',4,4)],goals:[g('wardrobe',8,6),g('box',8,2)],solution:['@cart','!',...repeat('R',4),...repeat('D',4),'>1','!',...repeat('L',4),'U','U','>1','!',...repeat('R',4),'U','U','>1','!']}),
  house({name:'당기고 튕기고 밀고',client:'협업 실험실 1호',story:'하나의 짐을 세 가구가 이어받아요. 구석에서 꺼내 파티션을 넘기고 출구까지 밀어 주세요.',lesson:'로봇청소기 → 침대 → 소파 순서로 왼쪽 짐을 옮겨 보세요.',hint:'청소기로 두 번 당긴 상자를 침대로 아래로 튕겨요. 소파로 여섯 번 밀면 배송돼요.',walls:points([3,3],[4,5]),furniture:[f('vacuum','vacuum',1,2),f('bed','bed',3,1,2),f('sofa','sofa',2,4),f('fan','fan',2,6)],cargo:[c('a','box',5,2),c('b','box',5,6)],goals:[g('box',9,4),g('box',9,6)],solution:['@vacuum','!','!','@bed','!','@sofa',...repeat('R',6),'@fan','!','!','!','R','!']}),
  house({name:'겨울 창고 운송전',client:'냉동 가구 연구실',story:'위아래 옷장은 얼음길, 가운데 상자는 책상. 좁은 복도에서 서로 길을 비켜 주세요.',lesson:'냉장고를 두 옷장 옆으로 이동시켜 얼리세요. 가운데 상자는 책상으로 운반해요.',hint:'위쪽 옷장을 먼저 얼리고 냉장고를 위로 비켜요. 아래쪽은 냉장고를 다섯 칸 내려 같은 방법으로!',walls:points([6,3],[6,5]),furniture:[f('fridge','fridge',4,2),f('fan','fan',2,2),f('cart','cart',3,4)],cargo:[c('a','wardrobe',5,2),c('b','wardrobe',5,6),c('c','box',4,4)],goals:[g('wardrobe',9,2),g('wardrobe',9,6),g('box',9,4)],solution:['@cart','!',...repeat('R',5),'>1','!','@fridge','!','U','@fan','!','@fridge',...repeat('D',5),'>1','!','U','@fan',...repeat('D',4),'>1','!']}),
  house({name:'전동문 너머의 착지',client:'협업 실험실 2호',story:'문을 열고, 상자를 튕기고, 바람으로 마무리. 배송 순서를 잘 정해 주세요.',lesson:'침대가 넘긴 짐을 선풍기가 이어받아요. 침대가 바람 길을 막지 않게 비켜 주세요.',hint:'문을 켜고 위쪽 짐을 튕겨요. 침대를 아래로 비킨 뒤 선풍기로 밀고, 선풍기를 한 칸 옮겨 마무리해요.',walls:points([4,3],[4,7]),height:11,gates:points([6,2],[6,6]),furniture:[f('lamp','lamp',1,7),f('bed','bed',2,2),f('fan','fan',1,2),f('vacuum','vacuum',9,8,0)],cargo:[c('a','box',3,2),c('b','box',3,6),c('c','box',9,4)],goals:[g('box',8,2),g('box',8,6),g('box',9,7)],solution:['@lamp','!','@bed','!','D','@fan','!','!','R','!','@bed','D','D','D','>1','!','U','@fan','L',...repeat('D',4),'>1','!','!','R','!','@vacuum','!','!','!']}),
  mixed('일곱 가구의 첫 합동 작전','가구 연구소 최종 실험',false),
];
function mixed(name:string,client:string,large:boolean,variant=0):Level {
  const furniture=[f('lamp','lamp',1,4),f('fan','fan',2,2),f('fridge','fridge',4,3),f('vacuum','vacuum',1,6),f('bed','bed',8,3),f('cart','cart',3,4),f('sofa','sofa',3,8)];
  const cargo=[c('a','wardrobe',5,2),c('b','box',5,6),c('c','box',9,3),c('d','wardrobe',4,4),c('e','box',5,8)];
  const goals=[g('wardrobe',9,2),g('box',2,6),g('box',11,3),g('wardrobe',10,7),g('box',11,8)];
  const solution=['@lamp','!','@fridge','U','>1','!','U','@fan','!','@vacuum','!','!','!','@bed','!','@cart','!',...repeat('R',6),...repeat('D',3),'>1','!','@sofa',...repeat('R',7)];
  if(large){cargo.push(c('f','wardrobe',4,10));goals.push(g('wardrobe',10,10));solution.push('@cart',...repeat('L',6),...repeat('D',3),'>1','!',...repeat('R',6),'>1','!');}
  if(variant){cargo.push(c('g','box',9,9));goals.push(g('box',9,6));furniture.push(f('vacuum2','vacuum',10,5,2));solution.unshift('@vacuum2','R');solution.push('@vacuum2','L','L','>2','!','!','!');}
  return house({name,client,width:13,height:large?13:11,story:'모든 가구가 출동하는 큰 집. 한 방의 배송을 마치고 다른 방의 짐까지 이어서 옮겨야 해요.',lesson:'문을 열어 옷장을 얼리고, 당기기와 점프로 작은 짐을 보내세요. 책상 운반은 마지막까지 이어집니다.',hint:'스탠드로 문을 연 다음 위쪽 옷장을 얼려 배송해요. 왼쪽 상자는 청소기, 오른쪽 상자는 침대, 아래쪽은 소파가 맡아요.',walls:points([10,3],[6,5],[7,5],[5,9]),gates:points([7,2],[7,4]),furniture,cargo,goals,solution});
}
function freight(name:string,rows:number[],gated:boolean):Level {
  const furniture=[f('cart','cart',2,rows[0]),f('lamp','lamp',1,1),f('sofa','sofa',10,1),f('fan','fan',11,9),f('fridge','fridge',2,9),f('bed','bed',4,9),f('vacuum','vacuum',8,9)];
  const cargo=rows.map((y,i)=>c(String(i),i%2?'box':'wardrobe',3,y)),goals=rows.map((y,i)=>g(i%2?'box':'wardrobe',10,y));
  const solution:string[]=gated?['@lamp','!','@cart']:['@cart'];let previous=rows[0];
  rows.forEach((y,i)=>{if(i){solution.push(...repeat('L',7),...repeat(y>previous?'D':'U',Math.abs(y-previous)));}solution.push('>1','!',...repeat('R',7),'>1','!');previous=y;});
  return house({name,client:'심야 가구 호텔',width:13,height:11,story:'객실마다 짐 종류가 달라요. 책상에 싣고 복도를 건너 정확한 객실에 내려놓아 주세요.',lesson:'책상으로 짐을 운반하세요. 복귀할 때는 왼쪽 복도를 이용하면 다른 짐을 피할 수 있어요.',hint:'책상으로 바로 앞의 짐을 싣고 오른쪽으로 일곱 칸 이동한 뒤 내려요. 왼쪽으로 돌아와 다음 객실로 이동하세요.',walls:gated?points([6,1],[6,9]):points([5,1],[7,9]),gates:gated?points(...Array.from({length:7},(_,i)=>[6,i+2])):[],furniture,cargo,goals,solution});
}
function springHouse(name:string,rows:number[],gated:boolean):Level {
  const furniture=[f('bed','bed',3,rows[0]),f('cart','cart',6,rows[0]+1,0),f('lamp','lamp',1,1),f('sofa','sofa',2,9),f('fan','fan',10,1),f('fridge','fridge',10,9),f('vacuum','vacuum',1,6)];
  const solution:string[]=gated?['@lamp','!']:[];let previous=rows[0];
  rows.forEach((y,i)=>{if(i)solution.push('@cart',...repeat('L',3),...repeat('D',y-previous+1),'@bed',...repeat('D',y-previous));solution.push('@bed','>1','!','@cart','>0','!',...repeat('R',3),'U','>1','!');previous=y;});
  return house({name,client:'스프링 복층 주택',width:13,height:11,story:'파티션 밖으로 튕긴 짐을 책상이 이어받아요. 배송 후 두 가구를 다음 방으로 옮겨야 해요.',lesson:'침대가 튕긴 짐을 아래 칸의 책상으로 받아 오른쪽 배송 칸까지 운반하세요.',hint:'침대로 튕긴 상자는 책상에서 위를 보고 실어요. 오른쪽 세 칸, 위 한 칸 이동하고 오른쪽으로 내려요.',walls:rows.map(y=>({x:5,y})),gates:gated?rows.map(y=>({x:8,y:y+1})):[],furniture,cargo:rows.map((y,i)=>c(String(i),'box',4,y)),goals:rows.map(y=>g('box',10,y)),solution});
}
function twinWing(name:string,winter:boolean):Level {
  const rows=winter?[2,5,8]:[2,4,6,8],rightRows=winter?[3,6,9]:rows;
  const furniture=[f('vacuum','vacuum',1,rows[0]),f('sofa','sofa',8,rightRows[0]),f('fridge','fridge',6,rows[0],3),f('lamp','lamp',1,9),f('bed','bed',10,1),f('cart','cart',3,9),f('fan','fan',11,1)];
  const cargo=[...rows.map((y,i)=>c(`l${i}`,winter?'wardrobe':'box',5,y)),...rightRows.map((y,i)=>c(`r${i}`,'box',9,y))];
  const goals=[...rows.map(y=>g(winter?'wardrobe':'box',2,y)),...rightRows.map(y=>g('box',11,y))];
  const solution:string[]=['@lamp','!'];let previous=rows[0];
  rows.forEach((y,i)=>{if(winter){solution.push('@fridge');if(i)solution.push(...repeat('D',y-previous));solution.push('>3','!');}solution.push('@vacuum');if(i)solution.push(...repeat('D',y-previous));solution.push('>1',...repeat('!',winter?1:3));previous=y;});
  previous=rightRows[0];solution.push('@sofa');rightRows.forEach((y,i)=>{if(i)solution.push('L','L',...repeat('D',y-previous));solution.push('R','R');previous=y;});
  return house({name,client:winter?'겨울밤 대형 저택':'양쪽 날개의 이사',width:13,height:11,story:'왼쪽은 당겨서, 오른쪽은 밀어서 배송하는 두 날개의 큰 저택. 팀을 번갈아 지휘하세요.',lesson:winter?'왼쪽 옷장을 얼리고 청소기로 당겨요. 오른쪽 상자는 소파가 직접 옮깁니다.':'왼쪽 짐은 청소기로, 오른쪽 짐은 소파로. 문부터 열어야 배송 길이 연결돼요.',hint:'문을 켜고 왼쪽 방부터 위에서 아래로 배송하세요. 오른쪽 소파는 두 칸씩 밀고 다시 왼쪽으로 돌아와 아래로 이동해요.',walls:points([7,3],[7,5],[7,7]),gates:rows.map(y=>({x:3,y})),furniture,cargo,goals,solution});
}
export const ADVANCED_LEVELS:readonly Level[]=[...lab,
  freight('객실 네 곳, 한 번의 야근',[2,4,6,8],true),
  twinWing('왼쪽은 당기고 오른쪽은 밀고',false),
  springHouse('파티션 운송 릴레이',[2,4,6,8],false),
  twinWing('겨울 저택의 두 날개',true),
  freight('헷갈리는 객실 배송표',[2,6,4,8,3,7],true),
  springHouse('전동문과 스프링의 밤',[2,4,6,8],true),
  mixed('전원 출동! 대저택 이사','한밤 저택 동관',true),
  mixed('마지막 열쇠가 돌아가기 전에','한밤 저택 최종 의뢰',true,1),
];
