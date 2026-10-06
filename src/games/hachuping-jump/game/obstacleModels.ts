import { cloudPuffs, mushroomCap, pillarPolygon, pillarRadius } from './obstacleShapes';
import type { ObstacleKind } from './types';
import { PIPE_WIDTH } from './constants';

function disk(c: CanvasRenderingContext2D,x:number,y:number,r:number,color:string|CanvasGradient){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill()}
function smile(c:CanvasRenderingContext2D,x:number,y:number){
  c.fillStyle='#586268';for(const dx of [-8,8]){c.beginPath();c.ellipse(x+dx,y,2.2,3.2,0,0,Math.PI*2);c.fill()}
  c.fillStyle='#f1a8b1';for(const dx of [-15,15]){c.beginPath();c.ellipse(x+dx,y+6,4.5,2.5,0,0,Math.PI*2);c.fill()}
  c.strokeStyle='#586268';c.lineWidth=1.4;c.beginPath();c.arc(x,y+3,4,.2,Math.PI-.2);c.stroke();
}
function roundBox(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,color:string){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill()}
function material(c:CanvasRenderingContext2D,x:number,y:number,size:number,hue:number){
  const g=c.createRadialGradient(x-size*.3,y-size*.35,2,x,y,size);
  g.addColorStop(0,`hsl(${hue} 65% 97%)`);g.addColorStop(.65,`hsl(${hue} 55% 84%)`);g.addColorStop(1,`hsl(${hue} 38% 68%)`);return g;
}

/** Native canvas toy models. Shared outlines keep visible tips and collisions aligned. */
export function drawObstacleModel(c:CanvasRenderingContext2D,x:number,y:number,h:number,hue:number,top:boolean,kind:ObstacleKind){
  if(h<=0)return;
  const w=PIPE_WIDTH,cx=x+w/2,tip=top?y+h-35:y+35;
  c.save();c.shadowColor='#83a3ad40';c.shadowBlur=7;c.shadowOffsetX=4;c.shadowOffsetY=5;
  if(kind==='mushroom'||kind==='flower'){
    roundBox(c,x+22,y+35,26,Math.max(1,h-35),8,kind==='flower'?'#b8d8ac':'#fff2d8');
    c.shadowColor='transparent';roundBox(c,x+40,y+40,7,Math.max(1,h-40),3,kind==='flower'?'#96bd94':'#e6cda6');
    if(kind==='mushroom'){
      const cap=mushroomCap(x,y);c.beginPath();cap.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=material(c,cx,y+28,40,hue);c.fill();
      disk(c,x+22,y+17,7,'#fff8e9');disk(c,x+48,y+25,6,'#fff8e9');smile(c,cx,y+55);
    }else{
      disk(c,cx,y+35,35,material(c,cx,y+35,35,hue));
      for(let i=0;i<6;i++){const a=i*Math.PI/3;disk(c,cx+Math.cos(a)*20,y+35+Math.sin(a)*20,14,material(c,cx+Math.cos(a)*20,y+35+Math.sin(a)*20,14,hue))}
      disk(c,cx,y+35,17,'#ffe6a8');smile(c,cx,y+33);
      c.fillStyle='#a1cd9d';c.beginPath();c.ellipse(x+19,y+99,14,7,-.5,0,Math.PI*2);c.fill();
    }
    c.restore();return;
  }
  if(kind==='cloud'){
    for(const p of cloudPuffs(x,y,h)){
      const fluff=c.createRadialGradient(p.x-10,p.y-13,2,p.x,p.y,p.radius);fluff.addColorStop(0,'#fffdf7');fluff.addColorStop(.65,'#eff9fa');fluff.addColorStop(1,'#c1e3e9');
      disk(c,p.x,p.y,p.radius,fluff);c.shadowColor='transparent';disk(c,p.x-12,p.y-9,16,'#fffdf7c9');disk(c,p.x+10,p.y-12,18,'#fffdf7a6');
    }
    smile(c,cx,tip+2);c.restore();return;
  }
  const outline=new Path2D(),points=pillarPolygon(kind,x,y,h,top);
  if(points){points.forEach((p,i)=>i?outline.lineTo(p.x,p.y):outline.moveTo(p.x,p.y));outline.closePath()}
  else outline.roundRect(x,y,w,h,pillarRadius(kind));
  if(kind === 'candy' || kind === 'waffle'){
    const rock=c.createLinearGradient(x,y,x+w,y);rock.addColorStop(0,'#80735f');rock.addColorStop(.3,'#c9b48d');rock.addColorStop(.7,'#ae9672');rock.addColorStop(1,'#726750');
    c.fillStyle=rock;c.fill(outline);c.shadowColor='transparent';c.clip(outline);
    for(let row=0;row<Math.ceil(h/38);row++){const sy=y+row*38,offset=row%2*20;c.fillStyle=row%3?'#dbc39b55':'#68594433';c.beginPath();c.moveTo(x+offset,sy+3);c.lineTo(x+w-6,sy+7);c.lineTo(x+w-10,sy+28);c.lineTo(x+7,sy+35);c.closePath();c.fill();c.strokeStyle='#5e533c70';c.lineWidth=1.5;c.beginPath();c.moveTo(x,sy+36);c.lineTo(x+w*.48,sy+32);c.lineTo(x+w,sy+38);c.moveTo(x+18+offset,sy+2);c.lineTo(x+24+offset,sy+34);c.stroke();}
    const edge=top?y+h-15:y;
    c.fillStyle='#719446';c.fillRect(x,edge,w,15);c.fillStyle='#acc976';c.fillRect(x+4,edge+3,w-8,4);
    for(let j=0;j<5;j++){const vx=x+8+j*12,vy=top?y+h-22-j%2*8:y+15+j%2*8;c.strokeStyle='#66843b';c.lineWidth=2;c.beginPath();c.moveTo(vx,top?y+h:y);c.lineTo(vx+2,vy);c.stroke();c.fillStyle='#97b762';c.beginPath();c.ellipse(vx+3,vy,5,2.5,-.5,0,Math.PI*2);c.fill();if(j===1||j===4){disk(c,vx,edge+9,2.5,'#fff7d2');disk(c,vx,edge+9,1,'#e5bd50');}}
    c.restore();return;
  }
  const g=c.createLinearGradient(x,y,x+w,y);
  g.addColorStop(0,`hsl(${hue} 42% 73%)`);g.addColorStop(.3,`hsl(${hue} 70% 93%)`);g.addColorStop(1,`hsl(${hue} 48% 78%)`);
  c.fillStyle=g;c.fill(outline);c.shadowColor='transparent';c.strokeStyle=`hsl(${hue} 30% 63%)`;c.lineWidth=1.6;c.stroke(outline);c.clip(outline);
  c.fillStyle=`hsl(${hue} 32% 58% / .16)`;c.fillRect(x+w-11,y,11,h);
  if(kind==='toy'){
    const hues=[hue,165,18,42];let row=0;
    for(let sy=y;sy<y+h;sy+=54,row++){
      const color=`hsl(${hues[row%4]} 52% 85%)`;roundBox(c,x+2,sy+2,w-4,50,8,color);
      c.fillStyle='#fffaf48c';c.fillRect(x+8,sy+5,w-16,3);c.fillStyle='#9db6b340';c.fillRect(x+7,sy+46,w-14,4);
      disk(c,cx,sy+26,14,'#fffaf4a6');c.fillStyle='#647376';c.font='800 17px Pretendard, sans-serif';c.textAlign='center';c.fillText(['A','B','C'][row%3],cx,sy+32);
    }
  }else if(kind==='crystal'){
    c.fillStyle='#fffaf495';c.beginPath();c.moveTo(cx,y);c.lineTo(x+20,y+30);c.lineTo(x+20,y+h-30);c.lineTo(cx,y+h);c.lineTo(x+46,y+h-30);c.lineTo(x+46,y+30);c.closePath();c.fill();
    c.strokeStyle='#fffaf4b3';c.lineWidth=2;c.beginPath();c.moveTo(cx,y+15);c.lineTo(cx,y+h-15);c.stroke();
    for(let sy=y+65;sy<y+h-25;sy+=90){c.beginPath();c.moveTo(cx-7,sy);c.lineTo(cx+7,sy);c.moveTo(cx,sy-7);c.lineTo(cx,sy+7);c.stroke()}
  }else if(kind==='castle'){
    const roof=top?y+h-42:y+42;
    c.fillStyle=`hsl(${hue} 50% 72%)`;c.fillRect(x,top?roof:y,w,42);
    for(let sy=y+55;sy<y+h-15;sy+=50){
      roundBox(c,cx-8,sy,16,23,8,'#97bdcc');roundBox(c,cx-5,sy+3,7,15,4,'#ecf8fa');
      c.strokeStyle='#bfcfd04d';c.lineWidth=1;c.beginPath();c.moveTo(x+10,sy+32);c.lineTo(x+w-10,sy+32);c.stroke();
    }
    disk(c,cx,top?y+h-26:y+26,6,'#fff0ae');
  }
  if(kind!=='toy'){c.fillStyle='#fffaf478';c.beginPath();c.roundRect(x+8,y+35,4,Math.max(1,h-70),2);c.fill()}
  c.restore();
}
