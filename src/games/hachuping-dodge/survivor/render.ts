import { enemyShotCount, HEIGHT, STAGES, UNIT_SCALE, WIDTH, type Kind, type World } from './world';
type Ctx = CanvasRenderingContext2D;
function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  c.fillStyle = fill; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill();
}
function poly(c: Ctx, points: number[], fill: string, stroke?: string) {
  c.beginPath(); c.moveTo(points[0],points[1]); for(let i=2;i<points.length;i+=2) c.lineTo(points[i],points[i+1]); c.closePath(); c.fillStyle=fill; c.fill();
  if(stroke) { c.strokeStyle=stroke; c.lineWidth=1.5; c.stroke(); }
}
function rect(c: Ctx, x: number,y:number,w:number,h:number,fill:string) { c.fillStyle=fill; c.fillRect(x,y,w,h); }
export function drawUnit(c: Ctx, kind: Kind | 'hero', x: number, y: number, scale=1, time=0, aim=0, rank=0) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  const hero=kind==='hero', boss=kind==='boss', elite=kind==='elite', mage=kind==='mage';
  ellipse(c,0,18,25,10,'#00000050');
  c.translate(0,Math.sin(time*6+x)*1.4);
  const cloth=hero?'#468b82':boss?'#633946':mage?'#54537f':elite?'#994c43':'#9c4d51';
  const light=hero?'#90c3ae':boss?'#bd7d76':mage?'#a59bcc':'#d7897e';
  // Boots and layered cloak give the small silhouettes a readable volume.
  rect(c,-15,12,11,11,'#17202a'); rect(c,5,12,11,11,'#17202a');
  poly(c,[-16,-15,14,-15,24,18,8,24,-4,18,-24,21],cloth,'#15201f');
  poly(c,[-16,-15,-5,-8,-10,17,-24,21],hero?'#2e625e':'#653943');
  poly(c,[-12,-10,13,-10,16,12,0,19,-15,10],hero?'#b7bdac':'#898d95','#303638');
  poly(c,[-12,-10,0,-5,0,16,-15,10],hero?'#6f8e8b':'#595d6a');
  rect(c,-14,7,29,5,'#413b34'); rect(c,-3,7,7,6,'#ddbb75');
  poly(c,[-19,-16,-9,-12,-15,-2,-24,-6],light,'#353637');
  poly(c,[13,-15,23,-8,19,0,10,-4],light,'#353637');
  // Pointed hood, recessed face, and bright eyes.
  poly(c,[-17,-18,-12,-32,2,-42,16,-29,20,-14,11,-4,-10,-5],cloth,'#20262a');
  poly(c,[-12,-23,1,-32,13,-23,11,-10,-9,-10],'#19232c');
  poly(c,[-17,-18,-12,-32,2,-42,0,-33,-9,-24,-10,-5],light);
  rect(c,-7,-21,5,3,hero?'#b9ffee':'#ffc37b'); rect(c,4,-21,5,3,hero?'#b9ffee':'#ffc37b');
  if(hero) {
    poly(c,[-8,-9,12,-9,6,-1,-7,-3],'#c9d1b7');
    c.save(); c.translate(6,0); c.rotate(aim);
    rect(c,1,-6,30,11,'#27363c'); rect(c,13,-5,25,7,rank>2?'#dfb75e':'#adc5b9');
    rect(c,20,-2,20,3,'#e5d49f'); rect(c,8,3,9,8,'#4a4741'); rect(c,31,-8,5,5,'#70f0ce');
    if(rank>0) { rect(c,19,-9,13,3,'#d9b563'); }
    if(rank>4) { rect(c,19,5,20,3,'#d9b563'); }
    c.restore();
  } else if(mage) {
    rect(c,25,-27,4,48,'#aa8260'); poly(c,[27,-40,35,-30,27,-18,19,-30],'#c7b0ed','#eee0ff');
  } else {
    poly(c,[-29,-5,-13,-3,-15,15,-24,21,-33,10],boss?'#c19b67':'#626975','#c1b39a');
    poly(c,[-25,-1,-19,1,-21,13,-25,16,-29,9],cloth);
    rect(c,23,-6,4,23,'#a58865');
    poly(c,[22,-7,20,-33,26,-42,31,-31,28,-7],boss?'#e8b96e':'#c9d0ce','#4c5659');
    rect(c,17,-7,16,4,'#c0a56c');
  }
  if(boss || elite) {
    poly(c,[-17,-28,-23,-47,-10,-37,0,-50,9,-36,23,-45,17,-25],boss?'#d6af69':'#9baaba','#544633');
    ellipse(c,0,-35,3,4,'#ef876f');
  }
  c.restore();
}
export interface View { scale: number; x: number; y: number; width: number; height: number }
export function viewFor(width:number,height:number,w:World):View {
  const scale=Math.max(width/WIDTH,height/HEIGHT);
  return { scale, x: Math.min(0, Math.max(width-WIDTH*scale, width/2-w.player.x*scale)), y: Math.min(0, Math.max(height-HEIGHT*scale,height/2-w.player.y*scale)), width,height };
}
export function renderWorld(c:Ctx,w:World,width:number,height:number):View {
  const v=viewFor(width,height,w), stage=STAGES[w.stage];
  c.clearRect(0,0,width,height); c.save(); c.translate(v.x,v.y); c.scale(v.scale,v.scale);
  rect(c,0,0,WIDTH,HEIGHT,stage.floor);
  // Deterministic paving, moss, and chips; no image downloads or random per-frame flicker.
  for(let row=0;row<14;row++) for(let col=0;col<18;col++) {
    const seed=(row*73+col*137)%101, x=col*76-(row%2)*38,y=row*64;
    c.globalAlpha=.13+seed/1500;
    poly(c,[x+3,y+3,x+71,y+3,x+73,y+57,x+6,y+60],seed%3===0?'#829383':'#536d62','#0b1515');
    if(seed%4===0) { c.globalAlpha=.18; ellipse(c,x+18,y+45,15,5,stage.color); }
    c.globalAlpha=1;
    if(seed%7===0) { poly(c,[x+30,y+14,x+35,y+11,x+40,y+17,x+32,y+20],'#82918435'); }
  }
  c.strokeStyle=stage.color+'24'; c.lineWidth=2; c.beginPath(); c.arc(600,400,172,0,Math.PI*2); c.stroke();
  c.beginPath(); c.arc(600,400,156,0,Math.PI*2); c.stroke();
  for(let i=0;i<8;i++) { const a=i*Math.PI/4; poly(c,[600+Math.cos(a)*163,400+Math.sin(a)*163,600+Math.cos(a+.025)*171,400+Math.sin(a+.025)*171,600+Math.cos(a)*179,400+Math.sin(a)*179,600+Math.cos(a-.025)*171,400+Math.sin(a-.025)*171],stage.color+'55'); }
  c.strokeStyle='#0a171d'; c.lineWidth=18; c.strokeRect(9,9,WIDTH-18,HEIGHT-18);
  for(const x of [48,WIDTH-48]) for(const y of [70,HEIGHT-70]) {
    ellipse(c,x,y+15,33,12,'#00000040');
    poly(c,[x-20,y-24,x+16,y-24,x+23,y+16,x-25,y+16],'#424e4b','#718278');
    poly(c,[x-20,y-24,x-10,y-35,x+25,y-34,x+16,y-24],'#849086');
    ellipse(c,x,y-28,10,5,'#182a2b'); ellipse(c,x,y-36,5,12,stage.color);
  }
  for(const g of w.gems) { ellipse(c,g.x,g.y+4,8,3,'#00000030'); poly(c,[g.x,g.y-7,g.x+5,g.y,g.x,g.y+7,g.x-5,g.y],'#82efc4','#d0ffe8'); }
  for(const e of w.enemies) if(e.charge>0) {
    c.strokeStyle='#ff9b78'; c.lineWidth=2; c.setLineDash([7,8]); c.beginPath(); c.arc(e.x,e.y,e.radius+25+e.charge*30,0,Math.PI*2); c.stroke(); c.setLineDash([]);
    const count=enemyShotCount(w,e.kind);
    c.globalAlpha=e.charge*.65;
    for(let i=0;i<count;i++) { const a=e.angle+i*Math.PI*2/count; c.beginPath(); c.moveTo(e.x+Math.cos(a)*60,e.y+Math.sin(a)*60); c.lineTo(e.x+Math.cos(a)*200,e.y+Math.sin(a)*200); c.stroke(); } c.globalAlpha=1;
  }
  const units=[...w.enemies.map(e=>({y:e.y,e})),{y:w.player.y,e:null}].sort((a,b)=>a.y-b.y);
  for(const {e} of units) {
    if(e) {
      if(e.flash>0) c.globalAlpha=.55;
      drawUnit(c,e.kind,e.x,e.y,e.radius/20,w.time,e.angle); c.globalAlpha=1;
      if(e.hp<e.maxHp) { rect(c,e.x-e.radius,e.y-e.radius*2.4,e.radius*2,4,'#10191d'); rect(c,e.x-e.radius,e.y-e.radius*2.4,e.radius*2*Math.max(0,e.hp/e.maxHp),4,'#edaa82'); }
    } else {
      c.strokeStyle=stage.color+'55'; c.lineWidth=2; c.beginPath(); c.ellipse(w.player.x,w.player.y+18*UNIT_SCALE,30*UNIT_SCALE,13*UNIT_SCALE,0,0,Math.PI*2); c.stroke();
      c.globalAlpha=w.player.invincible>0?.55+.45*Math.sin(w.time*35)**2:1;
      drawUnit(c,'hero',w.player.x,w.player.y,1.2*UNIT_SCALE,w.time,w.player.angle,w.upgrades.damage+w.upgrades.multishot); c.globalAlpha=1;
    }
  }
  for(const s of w.shots) {
    c.strokeStyle=s.hostile?'#ff9e7d':'#d4ffe0'; c.lineWidth=s.hostile?5:4; c.lineCap='round';
    c.beginPath(); c.moveTo(s.x-s.vx*.018,s.y-s.vy*.018); c.lineTo(s.x,s.y); c.stroke();
    ellipse(c,s.x,s.y,s.hostile?4:3,s.hostile?4:3,s.hostile?'#ffe1b3':'#ffffff');
  }
  c.font='bold 15px Pretendard, sans-serif'; c.textAlign='center';
  for(const e of w.effects) { c.globalAlpha=Math.min(1,e.life*3); c.fillStyle=e.color; c.fillText(e.text,e.x,e.y); } c.globalAlpha=1;
  c.restore();
  const gradient=c.createRadialGradient(width/2,height/2,height*.15,width/2,height/2,Math.max(width,height)*.7); gradient.addColorStop(0,'#07131400'); gradient.addColorStop(1,'#07131488'); c.fillStyle=gradient; c.fillRect(0,0,width,height);
  return v;
}
