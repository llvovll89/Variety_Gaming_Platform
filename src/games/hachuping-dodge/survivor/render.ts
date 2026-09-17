import { DEFAULT_LOADOUT, TINTS, enemyShotCount, HEIGHT, STAGES, UNIT_SCALE, WIDTH, type Loadout, type Kind, type World } from './world';
type Ctx = CanvasRenderingContext2D;
import { PATHS, type Promotion } from './classes';
function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, fill: string) {
  c.fillStyle = fill; c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2); c.fill();
}
function poly(c: Ctx, points: number[], fill: string, stroke?: string) {
  c.beginPath(); c.moveTo(points[0],points[1]); for(let i=2;i<points.length;i+=2) c.lineTo(points[i],points[i+1]); c.closePath(); c.fillStyle=fill; c.fill();
  if(stroke) { c.strokeStyle=stroke; c.lineWidth=1.5; c.stroke(); }
}
function rect(c: Ctx, x: number,y:number,w:number,h:number,fill:string) { c.fillStyle=fill; c.fillRect(x,y,w,h); }
type Appearance = Pick<Promotion,'path'|'tier'|'focus'>;
function careerEquipment(c:Ctx,job:Appearance,back:boolean) {
  const {path,tier,focus}=job,color=PATHS[path].color,metal=focus==='survival'?'#e0e9ed':'#d4b778';
  if(back){
    // Each tier extends the silhouette, while the original body and weapon stay readable.
    if(tier>=2)poly(c,[-18,-18,-31-tier*3,28,-12,23,0,32,14,24,32+tier*3,28,18,-18],color,'#22363c');
    if(tier===3){
      if(path==='paladin'||path==='sniper')for(const side of [-1,1])poly(c,[side*12,-15,side*48,-44,side*40,-14,side*31,-20,side*26,1],metal,'#566b70');
      else if(path==='pyromancer'||path==='cryomancer')for(const side of [-1,1])poly(c,[side*24,-17,side*44,-45,side*39,-10,side*47,5,side*29,0],color,'#d8e7d7');
      else if(path==='artillery'||path==='engineer')for(const side of [-1,1]){rect(c,side*34-7,-37,14,38,'#566e79');rect(c,side*34-5,-46,10,17,metal);rect(c,side*34-3,-31,6,11,color);}
      else for(const side of [-1,1])poly(c,[side*18,-23,side*43,-31,side*34,-8,side*44,13,side*24,5],color,'#374e42');
    }
    return;
  }
  // Career-specific helmets, armor, and equipment are actual model parts, not only an aura.
  if(path==='sniper'){
    poly(c,[-20,-29,-15,-43,13,-43,23,-30], '#435e4f',metal);
    rect(c,-15,-29,32,7,'#233e39');ellipse(c,9,-26,6,5,color);
    poly(c,[-24,-11,-13,-16,-6,-2,-18,7],metal);rect(c,-11,3,24,7,'#32483e');
  } else if(path==='hunter'){
    poly(c,[-22,-26,-16,-43,-7,-36,0,-48,12,-36,19,-42,23,-25], '#586645',color);
    for(const side of [-1,1])poly(c,[side*13,-37,side*23,-56,side*22,-42,side*33,-47,side*26,-32],metal);
    poly(c,[-25,-13,-10,-16,0,-6,13,-16,25,-13,15,0,0,-4,-16,1],color);
    ellipse(c,-25,8,8,11,'#685c40');rect(c,-28,4,6,6,metal);
  } else if(path==='berserker'){
    poly(c,[-18,-35,-11,-46,12,-46,20,-34,14,-10,-13,-10],'#5a4243',metal);
    rect(c,-11,-29,25,5,color);
    for(const side of [-1,1]){poly(c,[side*12,-36,side*27,-55,side*26,-34,side*17,-23],metal);poly(c,[side*13,-13,side*29,-22,side*33,-2,side*19,3], '#6b4a43',color);}
    poly(c,[-12,-6,0,0,12,-6,9,12,0,20,-10,12],metal);
  } else if(path==='paladin'){
    poly(c,[-20,-32,-12,-48,13,-48,21,-32,13,-10,-13,-10],metal,'#566775');
    rect(c,-12,-29,26,5,'#334c58');rect(c,-2,-44,4,32,color);
    for(const side of [-1,1])poly(c,[side*12,-16,side*28,-20,side*33,-5,side*17,2],metal,'#71868a');
    poly(c,[-36,-13,-17,-14,-15,12,-27,25,-40,10],metal,'#526a72');rect(c,-29,-8,4,25,color);rect(c,-35,-1,16,4,color);
  } else if(path==='pyromancer'||path==='cryomancer'){
    poly(c,[-19,-10,-26,24,0,30,25,24,17,-10],path==='pyromancer'?'#873f36':'#426d89',color);
    poly(c,[-30,-29,-15,-39,-5,-62,7,-73,17,-39,30,-29],color,'#e7e7ce');
    rect(c,-17,-36,36,6,metal);poly(c,[0,-19,7,-9,0,1,-7,-9],metal);
    if(tier>=2)for(const side of [-1,1])poly(c,[side*21,-20,side*32,-32,side*39,-17,side*29,-8],color,metal);
  } else {
    rect(c,-24,-44,48,33,'#536975');rect(c,-18,-36,36,14,'#193342');
    rect(c,-14,-32,28,6,color);rect(c,-18,-6,36,24,metal);ellipse(c,0,5,9,9,'#244653');ellipse(c,0,5,5,5,color);
    if(path==='artillery')for(const side of [-1,1]){rect(c,side*27-7,-27,14,23,'#3c525e');rect(c,side*27-5,-36,10,17,metal);}
    else {rect(c,-34,-18,12,29,'#6b8a87');rect(c,-31,-14,6,18,color);rect(c,-37,-8,18,5,color);rect(c,26,-25,5,34,metal);poly(c,[23,-25,23,-36,27,-31,34,-36,34,-25],metal);}
  }
  if(tier>=2){rect(c,-13,9,27,5,metal);for(const side of [-1,1])poly(c,[side*13,-10,side*24,-13,side*26,2,side*14,4],metal,color);}
  if(tier===3){
    poly(c,[-17,-43,-20,-57,-8,-51,0,-63,8,-51,20,-57,17,-43],metal,'#435b61');ellipse(c,0,-51,3,4,color);
    if(focus==='survival')ellipse(c,-27,3,7,9,color);
    else for(const side of [-1,1])poly(c,[side*22,-15,side*34,-26,side*31,-9],metal);
  }
}
export function drawUnit(c: Ctx, kind: Kind | 'hero', x: number, y: number, scale=1, time=0, aim=0, rank=0, loadout: Loadout = DEFAULT_LOADOUT, appearance?:Appearance) {
  c.save(); c.translate(x,y); c.scale(scale,scale);
  const hero=kind==='hero', boss=kind==='boss', elite=kind==='elite', mage=kind==='mage';
  ellipse(c,0,18,25,10,'#00000050');
  c.translate(0,Math.sin(time*6+x)*1.4);
  if(hero&&appearance)careerEquipment(c,appearance,true);
  if (kind==='slime' || kind==='bat' || kind==='golem') {
    if(kind==='slime') {
      const bounce=Math.sin(time*7+x)*3;
      ellipse(c,0,3,27,20+bounce,'#6ba557'); ellipse(c,-7,-4,14,10,'#aad773');
      ellipse(c,-8,0,3,4,'#1d3434'); ellipse(c,8,0,3,4,'#1d3434');
      poly(c,[-6,10,0,14,6,10],'#244635');
    } else if(kind==='bat') {
      const flap=Math.sin(time*15+x)*13;
      poly(c,[-5,-9,-39,-25+flap,-30,5,-19,0,-11,15,0,4],'#a185bd','#453554');
      poly(c,[5,-9,39,-25+flap,30,5,19,0,11,15,0,4],'#a185bd','#453554');
      ellipse(c,0,-2,10,17,'#584566'); poly(c,[-10,-10,-9,-28,0,-16,9,-28,10,-10],'#584566');
      rect(c,-6,-10,4,4,'#ffd598'); rect(c,3,-10,4,4,'#ffd598');
    } else {
      rect(c,-19,9,14,15,'#59676e');rect(c,6,9,14,15,'#59676e');
      poly(c,[-23,-24,16,-28,27,9,11,20,-20,14],'#7c9198','#34464d');
      poly(c,[-25,-18,-39,-10,-35,13,-23,9],'#9ba9a5');poly(c,[23,-18,36,-10,38,13,24,9],'#9ba9a5');
      rect(c,-14,-41,29,24,'#afbbb0');rect(c,-10,-33,7,4,'#9af4e5');rect(c,4,-33,7,4,'#9af4e5');
      poly(c,[0,-15,8,-3,0,9,-8,-3],'#9af4e5');
    }
    c.restore(); return;
  }
  const cloth=hero?TINTS[loadout.tint]:boss?'#633946':mage?'#54537f':elite?'#994c43':'#9c4d51';
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
    if(loadout.hero==='knight') {
      poly(c,[-19,-30,-12,-44,14,-44,21,-29,15,-7,-14,-7],'#c4cdd1','#566776');
      rect(c,-13,-26,29,6,'#273640');rect(c,-2,-41,4,32,'#e2d29e');
      poly(c,[-3,-44,-8,-57,7,-53,12,-44],cloth);
      poly(c,[-34,-9,-17,-13,-14,13,-26,22,-38,9],cloth,'#dbe1c3');
    } else if(loadout.hero==='witch') {
      poly(c,[-28,-28,-11,-37,1,-66,17,-36,29,-28],cloth,'#dec8ef');
      rect(c,-15,-35,32,5,'#e0c47d');ellipse(c,0,-33,3,3,'#efffe3');
    } else if(loadout.hero==='robot') {
      rect(c,-21,-42,42,32,'#879da1');rect(c,-16,-35,32,13,'#203940');
      rect(c,-12,-31,24,5,TINTS[loadout.tint]);rect(c,-3,-53,5,12,'#b8cdcb');ellipse(c,0,-55,4,4,cloth);
      rect(c,-14,-6,29,16,'#536d75');ellipse(c,0,2,6,6,cloth);
    }
    poly(c,[-8,-9,12,-9,6,-1,-7,-3],'#c9d1b7');
    if(appearance)careerEquipment(c,appearance,false);
    c.save(); c.translate(6,0); c.rotate(aim);
    if(loadout.weapon==='sword') {
      rect(c,0,-3,18,6,'#84684c');rect(c,12,-12,5,24,'#e8c782');
      poly(c,[17,-7,53,-5,65,0,53,5,17,7],'#daf6ed','#8dbbb7');rect(c,20,-1,32,2,'#78dec5');
    } else if(loadout.weapon==='laser') {
      rect(c,0,-8,37,16,'#536577');rect(c,10,-5,32,10,'#99d5e7');rect(c,20,-3,27,6,'#dcffff');rect(c,5,8,9,8,'#344851');
    } else if(loadout.weapon==='shotgun') {
      rect(c,0,-7,23,16,'#996f4e');rect(c,16,-8,30,7,'#aab7bd');rect(c,16,1,30,7,'#74858f');rect(c,6,7,10,9,'#5d4638');
    } else {
    rect(c,1,-6,30,11,'#27363c'); rect(c,13,-5,25,7,rank>2?'#dfb75e':'#adc5b9');
    rect(c,20,-2,20,3,'#e5d49f'); rect(c,8,3,9,8,'#4a4741'); rect(c,31,-8,5,5,'#70f0ce');
    if(rank>0) { rect(c,19,-9,13,3,'#d9b563'); }
    if(rank>4) { rect(c,19,5,20,3,'#d9b563'); }
    }
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
      if(w.job.slow[e.id]){c.strokeStyle='#a6e6ff';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y+10,e.radius+4,7,0,0,Math.PI*2);c.stroke();}
      if(e.hp<e.maxHp) { rect(c,e.x-e.radius,e.y-e.radius*2.4,e.radius*2,4,'#10191d'); rect(c,e.x-e.radius,e.y-e.radius*2.4,e.radius*2*Math.max(0,e.hp/e.maxHp),4,'#edaa82'); }
    } else {
      c.strokeStyle=stage.color+'55'; c.lineWidth=2; c.beginPath(); c.ellipse(w.player.x,w.player.y+18*UNIT_SCALE,30*UNIT_SCALE,13*UNIT_SCALE,0,0,Math.PI*2); c.stroke();
      c.globalAlpha=w.player.invincible>0?.55+.45*Math.sin(w.time*35)**2:1;
      drawUnit(c,'hero',w.player.x,w.player.y,1.2*UNIT_SCALE,w.time,w.player.angle,w.upgrades.damage+w.upgrades.multishot,w.loadout,w.job.history.at(-1)); c.globalAlpha=1;
      if(w.job.path){
        const tier=w.job.history.length,color=PATHS[w.job.path].color;
        c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.ellipse(w.player.x,w.player.y+14,23+tier*4,10+tier*2,0,0,Math.PI*2);c.stroke();
        for(let i=0;i<tier;i++){const x=w.player.x+(i-(tier-1)/2)*10,y=w.player.y-44;poly(c,[x,y-4,x+3,y,x,y+4,x-3,y],color);}
        if(w.job.path==='artillery'||w.job.path==='engineer')for(let i=0;i<2;i++){const a=w.time*1.5+i*Math.PI,x=w.player.x+Math.cos(a)*32,y=w.player.y+Math.sin(a)*20;rect(c,x-5,y-4,10,8,'#809ca6');ellipse(c,x,y,3,2,color);}
      }
      if(w.job.shield>0){c.strokeStyle='#f1dd9b99';c.lineWidth=3;c.beginPath();c.arc(w.player.x,w.player.y-9,33,0,Math.PI*2);c.stroke();}
    }
  }
  for(const a of w.attacks) {
    c.save();c.translate(a.x,a.y);c.rotate(a.angle);c.globalAlpha=Math.min(1,a.life*6);
    if(a.kind==='sword') {
      c.beginPath();c.moveTo(0,0);c.arc(0,0,a.range,-1.25,1.25);c.closePath();c.fillStyle='#c7ffe632';c.fill();
      c.beginPath();c.arc(0,0,a.range,-1.25,1.25);c.strokeStyle='#d0fff0';c.lineWidth=5;c.stroke();
    } else if(a.kind==='laser') {
      c.shadowColor=a.color??'#70edff';c.shadowBlur=18;c.strokeStyle=a.color??'#72e6ff';c.lineWidth=12;c.beginPath();c.moveTo(0,0);c.lineTo(a.range,0);c.stroke();
      c.strokeStyle='#efffff';c.lineWidth=3;c.stroke();
    } else {
      const radius=a.range*(1-a.life*.8),color=a.color??'#b7efdb';
      c.fillStyle=color+'18';c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.fill();c.stroke();
      for(let i=0;i<8;i++){const angle=i*Math.PI/4,x=Math.cos(angle)*radius*.7,y=Math.sin(angle)*radius*.7;
        if(a.kind==='heal'){rect(c,x-2,y-7,4,14,color);rect(c,x-7,y-2,14,4,color);}
        else poly(c,[x,y-7,x+4,y,x,y+7,x-4,y],color);
      }
    }
    c.restore();
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
