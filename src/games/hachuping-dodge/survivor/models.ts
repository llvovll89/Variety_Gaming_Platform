import type { Loadout, Kind } from './world';
import { drawHeroModel } from './heroModels';
import { HERO_VISUALS } from './heroVisuals';

type Ctx = CanvasRenderingContext2D;
function shape(c:Ctx, points:number[], fill:string, edge='#202921') {
  c.beginPath();c.moveTo(points[0],points[1]);
  for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=.8;c.stroke();
}
function line(c:Ctx, points:number[], color:string, width=1) {
  c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
  c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function gem(c:Ctx,x:number,y:number,size=4) {
  shape(c,[x,y-size,x+size,y,x,y+size,x-size,y],'#b9dc8f','#526c42');
  line(c,[x,y-size+1,x,y+size-1],'#e7f5c4');
}

export const drawHeroBody=drawHeroModel;

export function drawHeroWeapon(c:Ctx,loadout:Loadout,aim:number,rank:number) {
  const v=HERO_VISUALS[loadout.hero];
  c.save();c.translate(7,-5);c.rotate(aim);
  if(loadout.hero==='witch'&&loadout.weapon==='laser') {
    line(c,[-16,0,49,0],'#b7aec4',4);line(c,[-13,-1,48,-1],'#e1d9ef');
    shape(c,[41,0,50,-13,59,-6,53,0,59,6,50,13],v.cloth,'#d5c7e6');
    shape(c,[48,0,54,-7,61,0,54,7],v.color,'#e8dcfa');
    line(c,[27,-4,29,4],'#d4bd7f',3);
  } else if(loadout.hero==='storm'&&loadout.weapon==='laser') {
    line(c,[-28,0,47,0],'#6d8ba5',4);line(c,[-25,-1,45,-1],'#cfdeea');
    shape(c,[40,-6,54,-9,69,0,54,9,40,6,48,0],'#ccdfed','#5a7a94');
    shape(c,[48,-3,63,0,48,3],v.color);line(c,[35,-10,35,10],'#ccbc8b',3);
    line(c,[14,-2,16,3,20,-2,22,3],v.color,1.5);
  } else
  if(loadout.weapon==='sword') {
    shape(c,[0,-3,14,-3,14,3,0,3],'#634c32');line(c,[13,-12,13,12],'#b4a178',4);
    if(loadout.hero==='assassin') {
      shape(c,[14,-4,37,-7,53,-3,42,3,29,5,14,3],'#c7bfd9');line(c,[21,-2,43,-3],v.color,1.3);
    } else {shape(c,[17,-6,53,-4,63,0,53,4,17,6],'#cbd1dc');line(c,[19,0,56,0],v.light,1.4);}
    shape(c,[22,-2,24,0,22,2,20,0],v.color);
  } else {
    shape(c,[-12,-4,5,-6,17,-3,17,5,0,7,-9,10],'#55412e');
    shape(c,[0,-7,29,-7,33,-3,31,6,0,6],'#49515e');
    shape(c,[4,-7,27,-7,27,-3,4,-3],'#b7bbc6');
    shape(c,[9,6,16,6,13,16,7,15],'#69533a');
    const laser=loadout.weapon==='laser',shotgun=loadout.weapon==='shotgun';
    shape(c,[27,-5,49,-5,52,-2,51,3,28,3],laser?'#8aab99':'#919aaa');
    line(c,[31,-3,48,-3],'#d2d8b9',1.5);
    if(shotgun)line(c,[29,5,50,5],'#5c6472',4);
    else {shape(c,[34,-8,42,-8,42,6,34,6],'#535564');shape(c,[38,-5,42,-1,38,3,34,-1],v.color);}
    shape(c,[12,-12,24,-12,26,-9,11,-9],'#555867');line(c,[15,-12,22,-12],'#b6a073');
    for(let i=0;i<Math.min(rank,3);i++)line(c,[4+i*5,-2,4+i*5,3],'#c5b273');
    // Gauntlet gripping the receiver.
    shape(c,[2,2,10,2,11,7,5,9,0,6],'#8b8c9b');line(c,[3,4,8,4],'#cbc6d3');
    line(c,[13,-4,26,-4],v.color,1.5);
  }
  c.restore();
}

export function drawGoblin(c:Ctx,kind:Kind) {
  const big=kind==='boss'||kind==='elite',mage=kind==='mage';
  const skin=big?'#7b8060':'#66794b',steel=big?'#9a9981':'#737b67';
  shape(c,[-14,5,-3,6,-7,24,-19,24,-17,19],'#433d2e');shape(c,[3,6,14,5,16,19,23,23,8,25],'#433d2e');
  shape(c,[-18,-17,14,-19,22,2,12,13,-13,10,-23,-2],mage?'#514b61':'#554c37');
  shape(c,[-13,-14,10,-17,16,-2,9,7,-12,4],steel);
  line(c,[-10,-10,11,1],'#393e32',3);
  shape(c,[-14,-34,10,-36,20,-26,12,-11,-10,-13,-21,-24],skin);
  shape(c,[-16,-29,-31,-36,-25,-23,-15,-20],skin);shape(c,[15,-29,31,-36,25,-23,16,-20],skin);
  shape(c,[-13,-27,0,-30,13,-27,8,-22,-9,-22],'#303c25');
  line(c,[-10,-26,-4,-25],'#d8d697',2);line(c,[4,-25,10,-26],'#d8d697',2);
  shape(c,[-9,-17,9,-17,6,-11,-7,-12],'#35402a');line(c,[-6,-16,-4,-11,0,-15,4,-11,6,-16],'#c5c5a0',1.2);
  shape(c,[-21,-16,-30,-11,-27,4,-17,2],steel);shape(c,[15,-17,25,-11,23,1,15,0],steel);
  if(mage){line(c,[26,-32,26,23],'#8c7856',3);gem(c,26,-35,7);}
  else {
    shape(c,[-32,-5,-17,-7,-16,10,-27,19,-37,8],'#544f3b',steel);gem(c,-27,3,3);
    line(c,[25,-8,25,20],'#8e7853',3);shape(c,[21,-8,20,-32,26,-41,30,-30,29,-8],steel);
  }
  if(big){shape(c,[-19,-30,-23,-46,-10,-39,0,-51,11,-39,23,-45,18,-29],'#948360');gem(c,0,-39,3);}
}

export function drawCreature(c:Ctx,kind:Kind,time:number) {
  if(kind==='slime') {
    const bounce=Math.sin(time*7)*2;
    shape(c,[-26,12,-24,-1,-16,-12,-4,-17-bounce,11,-14,22,-3,27,12,17,21,-13,22],'#4e6b39');
    shape(c,[-24,-1,-16,-12,-4,-17-bounce,11,-14,4,-6,-8,-4,-14,5],'#82975d');
    shape(c,[-24,12,-12,7,5,12,23,9,27,12,17,21,-13,22],'#384f2c');
    shape(c,[-12,-4,-6,-5,-5,1,-11,2],'#263c27');shape(c,[7,-4,12,-3,11,2,6,1],'#263c27');
    line(c,[-10,-3,-7,-3],'#cad1a1',1.4);line(c,[8,-2,10,-2],'#cad1a1',1.4);
    line(c,[-17,-5,-13,-9,-7,-10],'#b4c48b',1.2);line(c,[-3,14,5,15],'#728748');
  } else if(kind==='bat') {
    const flap=Math.sin(time*15)*9;
    for(const side of [-1,1]) {
      shape(c,[side*4,-10,side*18,-19+flap,side*42,-23+flap,side*32,-6,side*29,6,side*20,1,side*12,13,side*5,6],'#62594f');
      shape(c,[side*8,-7,side*18,-16+flap,side*36,-19+flap,side*23,-5,side*15,7],'#938574');
      line(c,[side*5,-7,side*18,-17+flap,side*31,-6],'#b5a48a',1.1);
      line(c,[side*18,-17+flap,side*20,1],'#4a4b3d',1.1);
    }
    shape(c,[-8,-13,-9,-27,-1,-19,8,-27,8,-11,12,-3,7,15,0,20,-8,11,-11,-3],'#424a3b');
    shape(c,[-6,-10,0,-14,6,-10,4,4,-4,4],'#797d62');
    line(c,[-5,-7,-2,-7],'#e1c799',1.7);line(c,[2,-7,5,-7],'#e1c799',1.7);
    line(c,[-3,2,-2,6,0,3,2,6,3,2],'#c1b69b');
  } else {
    // Broken masonry plates and an engraved core distinguish a golem from armor.
    shape(c,[-18,4,-5,7,-9,24,-22,22],'#566152');shape(c,[6,8,20,4,23,22,9,25],'#596453');
    shape(c,[-22,-24,6,-29,25,-16,21,10,0,21,-23,9],'#77806b');
    shape(c,[-22,-24,6,-29,25,-16,4,-16,-15,-10],'#a2a58a');
    shape(c,[-22,-24,-15,-10,-15,9,0,21,-23,9],'#4d604d');
    shape(c,[-25,-16,-36,-10,-40,8,-27,16,-20,6],'#69755f');
    shape(c,[23,-17,35,-12,41,9,28,17,20,5],'#8c9379');
    shape(c,[-17,-42,10,-45,20,-35,16,-19,-12,-18,-21,-30],'#939982');
    shape(c,[-17,-42,10,-45,20,-35,-2,-35,-21,-30],'#bec1a4');
    shape(c,[-15,-31,12,-33,11,-27,-13,-25],'#364b39');
    line(c,[-11,-29,-6,-29],'#cedca7',2);line(c,[4,-30,9,-30],'#cedca7',2);
    shape(c,[-5,-13,6,-14,13,-4,5,8,-5,5,-10,-4],'#394d38');gem(c,2,-3,6);
    line(c,[-8,-20,-3,-15,-6,-8],'#374e39',1.2);line(c,[13,8,9,14],'#3f533b',1.2);
    line(c,[-33,-3,-26,-5],'#a6ad8b',2);line(c,[28,-7,34,-4],'#c0c2a2',2);
  }
}
