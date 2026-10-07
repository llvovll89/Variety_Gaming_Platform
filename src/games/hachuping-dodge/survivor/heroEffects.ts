import type { Attack, Shot } from './world';
import { HERO_VISUALS } from './heroVisuals';
type Ctx=CanvasRenderingContext2D;
function path(c:Ctx,p:number[],color:string,width=2) {c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function diamond(c:Ctx,x:number,y:number,r:number,color:string) {c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.6,y);c.lineTo(x,y+r);c.lineTo(x-r*.6,y);c.closePath();c.fillStyle=color;c.fill();}
function leaf(c:Ctx,x:number,y:number,color:string) {c.beginPath();c.moveTo(x-6,y);c.quadraticCurveTo(x,y-7,x+7,y);c.quadraticCurveTo(x,y+5,x-6,y);c.fillStyle=color;c.fill();}
function bolt(c:Ctx,length:number,color:string,width=3,phase=0) {
  const points=[0,0];const segments=Math.max(3,Math.ceil(length/22));
  for(let i=1;i<segments;i++)points.push(length*i/segments,Math.sin(i*2.4+phase)*7);
  points.push(length,0);path(c,points,color,width);
}
function glyph(c:Ctx,hero:Attack['hero'],x:number,y:number,size:number,color:string) {
  if(hero==='ranger')leaf(c,x,y,color);
  else if(hero==='witch') {diamond(c,x,y,size,color);path(c,[x-size,y,x+size,y],color,1);}
  else if(hero==='robot')path(c,[x-size,y-size,x+size,y+size],color,2);
  else if(hero==='storm')path(c,[x-3,y-size,x+3,y,x-3,y+size],color,1.6);
  else if(hero==='knight')path(c,[x-size,y-size,x+size,y-size,x+size,y+2,x,y+size,x-size,y+2,x-size,y-size],color,1.2);
  else {c.beginPath();c.arc(x,y,size,-1.5,1.5);c.strokeStyle=color;c.lineWidth=1.5;c.stroke();}
}

export function drawHeroAttack(c:Ctx,a:Attack,time:number) {
  const v=HERO_VISUALS[a.hero??'ranger'],color=a.color??v.color;
  c.save();c.translate(a.x,a.y);c.rotate(a.angle);c.lineCap='round';c.globalAlpha=Math.min(1,a.life*8);
  if(a.kind==='muzzle'||a.kind==='impact') {
    const r=a.range*(1-a.life*2),count=a.hero==='robot'?8:5;
    for(let i=0;i<count;i++){const angle=i*Math.PI*2/count;glyph(c,a.hero,Math.cos(angle)*r,Math.sin(angle)*r,3,color);}
    diamond(c,0,0,a.kind==='muzzle'?5:3,v.light);
  } else if(a.kind==='lightning'||(a.kind==='laser'&&a.hero==='storm')) {
    bolt(c,a.range,color,7,time*15);bolt(c,a.range,v.light,2,time*15);
    for(let i=1;i<5;i++) {c.save();c.translate(a.range*i/5,0);c.rotate((i%2?1:-1)*.65);bolt(c,20,color,1.5,time*12);c.restore();}
  } else if(a.kind==='laser') {
    path(c,[0,0,a.range,0],color,9);path(c,[0,0,a.range,0],v.light,2);
    if(a.hero==='witch') {
      for(const side of [-1,1])path(c,[0,side*7,a.range,side*7],color,1);
      for(let i=1;i<7;i++)diamond(c,a.range*i/7,0,5,v.light);
    } else if(a.hero==='robot')for(let i=0;i<8;i++)path(c,[a.range*i/8,-7,a.range*i/8+8,7],v.light,1.2);
    else if(a.hero==='assassin')path(c,[5,7,a.range*.9,7],color,1);
    else for(let i=1;i<5;i++)glyph(c,a.hero,a.range*i/5,0,4,v.light);
  } else if(a.kind==='sword'||a.kind==='shadow') {
    const circle=a.kind==='shadow',r=a.range*(.85+(1-a.life*3)*.15);
    const start=circle?-.6:-1.15,end=circle?Math.PI*1.7:1.15;
    c.beginPath();c.arc(0,0,r,start,end);c.strokeStyle=color+'40';c.lineWidth=18;c.stroke();
    c.beginPath();c.arc(0,0,r,start,end);c.strokeStyle=v.light;c.lineWidth=3;c.stroke();
    if(a.hero==='assassin') {c.beginPath();c.arc(0,0,r*.75,start+.25,end-.25);c.strokeStyle=color;c.lineWidth=3;c.stroke();}
    else if(a.hero==='storm')for(let i=0;i<6;i++){c.save();c.rotate(-1+i*.4);c.translate(r-10,0);bolt(c,17,color,2,time*9);c.restore();}
    for(let i=0;i<5;i++){const angle=start+(end-start)*i/5;glyph(c,a.hero,Math.cos(angle)*r,Math.sin(angle)*r,4,color);}
  } else {
    const r=a.range*(1-a.life*.8);
    c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=2;c.stroke();
    c.beginPath();c.arc(0,0,r*.85,0,Math.PI*2);c.strokeStyle=color+'50';c.lineWidth=7;c.stroke();
    for(let i=0;i<8;i++) {
      const angle=i*Math.PI/4,x=Math.cos(angle)*r*.7,y=Math.sin(angle)*r*.7;
      if(a.kind==='heal') {path(c,[x-5,y,x+5,y],color,2);path(c,[x,y-5,x,y+5],color,2);}
      else if(a.kind==='frost') {diamond(c,x,y,7,color);path(c,[x-5,y,x+5,y],color,1);}
      else glyph(c,a.hero,x,y,5,color);
    }
    if(a.hero==='witch'){c.beginPath();for(let i=0;i<=6;i++){const angle=i*Math.PI/3,x=Math.cos(angle)*r*.55,y=Math.sin(angle)*r*.55;if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.strokeStyle=color;c.lineWidth=1;c.stroke();}
  }
  c.restore();
}

export function drawHeroShot(c:Ctx,s:Shot) {
  c.save();c.translate(s.x,s.y);c.rotate(Math.atan2(s.vy,s.vx));c.lineCap='round';
  if(s.hostile){path(c,[-11,0,0,0],'#f09e7d',4);diamond(c,0,0,4,'#ffe2b8');}
  else {
    const hero=s.hero??'ranger',v=HERO_VISUALS[hero];
    path(c,[-24,0,0,0],v.color+'65',6);path(c,[-17,0,0,0],v.color,2);
    if(hero==='storm'){bolt(c,17,v.light,1.5);}
    else if(hero==='ranger'){leaf(c,-10,0,v.color);diamond(c,1,0,3,v.light);}
    else if(hero==='witch'){diamond(c,0,0,5,v.light);diamond(c,-13,0,3,v.color);}
    else if(hero==='robot'){path(c,[-8,-2,2,-2,2,2,-8,2,-8,-2],v.light,1.5);path(c,[-19,-4,-14,-4],v.color,1);}
    else if(hero==='knight'){diamond(c,0,0,5,v.light);path(c,[-15,-3,-4,-3],v.color,1);path(c,[-15,3,-4,3],v.color,1);}
    else {path(c,[-8,-4,2,0,-8,4],v.light,2);path(c,[-18,-3,-10,0,-18,3],v.color,1);}
  }
  c.restore();
}
