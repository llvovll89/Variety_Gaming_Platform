import { WIDTH, HEIGHT, STAGES } from './world';

const fields=new Map<number,HTMLCanvasElement>();
function polygon(c:CanvasRenderingContext2D,p:number[],fill:string) {
  c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fillStyle=fill;c.fill();
}
function stone(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number) {
  polygon(c,[x,y,x+w,y-7,x+w+12,y+h-7,x+10,y+h],'#5a5860');
  polygon(c,[x,y,x+10,y+h,x-6,y+h-5,x-13,y-8],'#41404a');
  polygon(c,[x-13,y-8,x+w-12,y-15,x+w,y-7,x,y],'#959199');
  c.strokeStyle='#bdb7c155';c.lineWidth=1;c.beginPath();c.moveTo(x+1,y+1);c.lineTo(x+w,y-6);c.stroke();
}
/** Static paving is baked once per region instead of redrawn every combat frame. */
export function drawTerrain(c:CanvasRenderingContext2D,index:number) {
  let field=fields.get(index);
  if(!field) {
    field=document.createElement('canvas');field.width=WIDTH;field.height=HEIGHT;
    const ctx=field.getContext('2d');if(!ctx)return;
    const stage=STAGES[index];ctx.fillStyle=stage.floor;ctx.fillRect(0,0,WIDTH,HEIGHT);
    const light=ctx.createLinearGradient(0,HEIGHT,WIDTH,0);light.addColorStop(0,'#282830');light.addColorStop(1,index===0?'#817d80':'#777a83');
    ctx.globalAlpha=.66;ctx.fillStyle=light;ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.globalAlpha=1;
    for(let row=0;row<14;row++)for(let col=0;col<17;col++) {
      const seed=(row*73+col*137)%101,x=col*82-(row%2)*41,y=row*62;
      const tones=['#717079','#62616b','#86808a','#79747d','#5d5d68'];
      ctx.globalAlpha=.3+seed/500;
      polygon(ctx,[x+4,y+4,x+77,y+2,x+78,y+55,x+5,y+58],tones[seed%5]);
      ctx.globalAlpha=.5;ctx.strokeStyle='#b7b0bb';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(x+5,y+6);ctx.lineTo(x+76,y+4);ctx.stroke();
      ctx.strokeStyle='#30303b';ctx.beginPath();ctx.moveTo(x+5,y+58);ctx.lineTo(x+78,y+55);ctx.stroke();ctx.globalAlpha=1;
      if(seed%3===0) {
        ctx.strokeStyle='#3b374380';ctx.beginPath();ctx.moveTo(x+22,y+3);ctx.lineTo(x+30,y+22);ctx.lineTo(x+24,y+32);ctx.lineTo(x+39,y+54);ctx.stroke();
      }
      if(seed%11===0)for(let i=0;i<5;i++) {
        ctx.fillStyle=['#536d36','#6b7f43','#3c562d'][i%3];ctx.globalAlpha=.45;
        ctx.beginPath();ctx.ellipse(x+8+i*5,y+52-i%2*3,7,3, -.4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
      for(let i=0;i<3;i++){ctx.fillStyle='#c7bec918';ctx.fillRect(x+seed%48+i*9,y+12+(seed*i)%32,2,1);}
    }
    // Worn central seal etched into the paving.
    ctx.save();ctx.translate(600,400);ctx.scale(1,.68);ctx.strokeStyle='#b5aebc40';ctx.lineWidth=4;
    for(const r of [168,157,120]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}
    for(let i=0;i<8;i++){ctx.save();ctx.rotate(i*Math.PI/4);polygon(ctx,[-6,-158,0,-174,6,-158,0,-145],'#bdb2c745');ctx.restore();}ctx.restore();
    // Ruined columns and rubble stay at the edge, outside the clear fighting space.
    for(const x of [35,WIDTH-54])for(const y of [70,290,HEIGHT-88]) {
      polygon(ctx,[x-20,y+25,x+31,y+23,x+108,y+106,x+43,y+113],'#23233065');
      stone(ctx,x-18,y+5,53,25);stone(ctx,x-8,y-44,32,55);stone(ctx,x-17,y-55,48,14);
      polygon(ctx,[x+1,y-30,x+7,y-39,x+13,y-30,x+7,y-21],'#b9b9ca');
      polygon(ctx,[x+4,y-30,x+7,y-34,x+10,y-30,x+7,y-26],stage.color);
      for(let i=0;i<4;i++) {ctx.fillStyle='#687b3e';ctx.beginPath();ctx.ellipse(x+i*5-8,y-48,8,3, -.5,0,Math.PI*2);ctx.fill();}
      stone(ctx,x+34,y+27,16,8);
    }
    const sun=ctx.createRadialGradient(WIDTH-80,20,0,WIDTH-80,20,WIDTH*.8);sun.addColorStop(0,'#f2dfad26');sun.addColorStop(1,'#f2dfad00');ctx.fillStyle=sun;ctx.fillRect(0,0,WIDTH,HEIGHT);
    fields.set(index,field);
  }
  c.drawImage(field,0,0);
}
