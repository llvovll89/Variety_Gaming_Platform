import { DEFAULT_LOADOUT, enemyShotCount, HEIGHT, UNIT_SCALE, WIDTH, type Loadout, type Kind, type World } from './world';
import { drawTerrain } from './terrain';
import { drawHeroBody, drawHeroWeapon, drawGoblin, drawCreature } from './models';
import { HERO_VISUALS } from './heroVisuals';
import { drawHeroAttack, drawHeroShot } from './heroEffects';
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
  } else if(path==='shadowblade'||path==='reaper') {
    for(const side of [-1,1])poly(c,[side*12,-27,side*27,-32,side*30,-20,side*18,-12],'#635971',color);
    poly(c,[-7,-32,8,-33,6,-24,-6,-24],'#34303f',metal);
    poly(c,[-26,5,-34,19,-40,29,-33,25,-22,11],metal,color);
    if(tier>=2)poly(c,[-15,-23,-33,-17,-43,-28,-33,-9,-16,-13],color,'#4b3a5d');
  } else if(path==='stormcaller'||path==='dragoon') {
    for(const side of [-1,1])poly(c,[side*12,-28,side*25,-38,side*33,-26,side*26,-14,side*14,-15],metal,'#5e7c97');
    poly(c,[-5,-23,5,-23,8,-10,0,-4,-8,-10],color,metal);
    if(path==='dragoon')for(const side of [-1,1])poly(c,[side*7,-46,side*18,-61,side*16,-43,side*9,-36],metal);
    else for(const side of [-1,1])poly(c,[side*17,-22,side*30,-30,side*35,-16,side*24,-9],color,metal);
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
  const hero=kind==='hero';
  ellipse(c,0,18,25,10,'#00000050');
  c.translate(0,Math.sin(time*6+x)*1.4);
  if(hero&&appearance)careerEquipment(c,appearance,true);
  if(kind==='slime'||kind==='bat'||kind==='golem') {
    drawCreature(c,kind,time);c.restore();return;
  }
  if(hero) {
    drawHeroBody(c,loadout,time);
    if(appearance)careerEquipment(c,appearance,false);
    drawHeroWeapon(c,loadout,aim,rank);
  } else drawGoblin(c,kind);
  c.restore();
}

export interface View { scale: number; x: number; y: number; width: number; height: number }
export function viewFor(width:number,height:number,w:World):View {
  const scale=Math.max(width/WIDTH,height/HEIGHT);
  return { scale, x: Math.min(0, Math.max(width-WIDTH*scale, width/2-w.player.x*scale)), y: Math.min(0, Math.max(height-HEIGHT*scale,height/2-w.player.y*scale)), width,height };
}
export function renderWorld(c:Ctx,w:World,width:number,height:number):View {
  const v=viewFor(width,height,w), heroColor=HERO_VISUALS[w.loadout.hero].color;
  c.clearRect(0,0,width,height); c.save(); c.translate(v.x,v.y); c.scale(v.scale,v.scale);
  drawTerrain(c,w.stage);
  for(const g of w.gems) { ellipse(c,g.x,g.y+4,8,3,'#191b2330'); poly(c,[g.x,g.y-7,g.x+5,g.y,g.x,g.y+7,g.x-5,g.y],'#d5b579','#fff0c6'); }
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
      c.strokeStyle=heroColor+'70'; c.lineWidth=2; c.beginPath(); c.ellipse(w.player.x,w.player.y+18*UNIT_SCALE,30*UNIT_SCALE,13*UNIT_SCALE,0,0,Math.PI*2); c.stroke();
      c.globalAlpha=w.player.invincible>0?.55+.45*Math.sin(w.time*35)**2:1;
      drawUnit(c,'hero',w.player.x,w.player.y,1.2*UNIT_SCALE,w.time,w.player.angle,w.upgrades.damage+w.upgrades.multishot,w.loadout,w.job.history.at(-1)); c.globalAlpha=1;
      if(w.job.path){
        const tier=w.job.history.length,color=PATHS[w.job.path].color;
        c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.ellipse(w.player.x,w.player.y+14,23+tier*4,10+tier*2,0,0,Math.PI*2);c.stroke();
        for(let i=0;i<tier;i++){const x=w.player.x+(i-(tier-1)/2)*10,y=w.player.y-44;poly(c,[x,y-4,x+3,y,x,y+4,x-3,y],color);}
        if(w.job.path==='artillery'||w.job.path==='engineer')for(let i=0;i<2;i++){const a=w.time*1.5+i*Math.PI,x=w.player.x+Math.cos(a)*32,y=w.player.y+Math.sin(a)*20;rect(c,x-5,y-4,10,8,'#809ca6');ellipse(c,x,y,3,2,color);}
      }
      if(w.job.shield>0){c.strokeStyle=heroColor+'99';c.lineWidth=3;c.beginPath();c.arc(w.player.x,w.player.y-9,33,0,Math.PI*2);c.stroke();}
    }
  }
  for(const a of w.attacks)drawHeroAttack(c,a,w.time);
  for(const s of w.shots)drawHeroShot(c,s);
  c.font='bold 15px Pretendard, sans-serif'; c.textAlign='center';
  for(const e of w.effects) { c.globalAlpha=Math.min(1,e.life*3); c.fillStyle=e.color; c.fillText(e.text,e.x,e.y); } c.globalAlpha=1;
  c.restore();
  const gradient=c.createRadialGradient(width/2,height/2,height*.15,width/2,height/2,Math.max(width,height)*.7); gradient.addColorStop(0,'#19182200'); gradient.addColorStop(1,'#19182288'); c.fillStyle=gradient; c.fillRect(0,0,width,height);
  return v;
}
