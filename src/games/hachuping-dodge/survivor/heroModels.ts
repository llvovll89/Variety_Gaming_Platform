import type { Loadout } from './world';
import { HERO_VISUALS } from './heroVisuals';

type Ctx=CanvasRenderingContext2D;
function plate(c:Ctx,p:number[],fill:string|CanvasGradient,edge='#20212a') {
  c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.closePath();c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=.65;c.stroke();
}
function seam(c:Ctx,p:number[],color:string,width=1) {
  c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.strokeStyle=color;c.lineWidth=width;c.stroke();
}
function jewel(c:Ctx,x:number,y:number,color:string,r=3) {plate(c,[x,y-r,x+r,y,x,y+r,x-r,y],color,'#d7d9df');}
function metal(c:Ctx,light='#d0d4db',dark='#596577') {
  const g=c.createLinearGradient(-24,-30,20,14);g.addColorStop(0,light);g.addColorStop(.45,'#8d96a5');g.addColorStop(1,dark);return g;
}
function boots(c:Ctx,time:number,heavy=false) {
  const step=Math.sin(time*6)*1.4;
  for(const side of [-1,1]) {
    const x=side*9,dy=side*step;
    plate(c,[x-6,1,x+6,1,x+8,14+dy,x+5,29+dy,x-7,29+dy,x-8,19],'#31343e');
    if(heavy)plate(c,[x-6,9,x+5,8,x+6,22+dy,x-5,24+dy],metal(c));
    else plate(c,[x-6,16,x+5,15,x+5,28+dy,x-7,29+dy],'#594c48');
    plate(c,[x-7,26+dy,x+6,25+dy,x+11,31+dy,x+9,34+dy,x-9,34+dy],'#31323b');
    seam(c,[x-6,31+dy,x+8,31+dy],'#9ba0aa');
  }
}
function belt(c:Ctx,trim:string) {
  plate(c,[-16,0,16,0,15,6,-16,7],'#3e3435');plate(c,[-3,0,4,0,4,7,-3,7],trim);plate(c,[-1,2,2,2,2,5,-1,5],'#38333a');
}
function cloak(c:Ctx,shade:string,cloth:string,trim:string,long=false) {
  c.beginPath();c.moveTo(-15,-30);c.quadraticCurveTo(-29,-15,-34,long?33:24);c.lineTo(-18,19);c.lineTo(-10,long?36:26);c.lineTo(9,21);c.lineTo(25,long?30:17);c.quadraticCurveTo(24,-11,12,-30);c.closePath();c.fillStyle=shade;c.fill();
  plate(c,[-15,-29,-22,-10,-25,20,-17,13,-9,25,-5,-20],cloth);
  seam(c,[-20,-7,-24,18,-17,14],trim,.7);
}

/** Six separate silhouettes, with smaller heads, longer limbs and layered materials. */
export function drawHeroModel(c:Ctx,loadout:Loadout,time:number) {
  const v=HERO_VISUALS[loadout.hero],trim=loadout.tint==='mint'?v.color:loadout.tint==='gold'?'#d5b87d':loadout.tint==='violet'?'#ad98cf':'#ce9185';
  if(loadout.hero==='ranger') {
    cloak(c,v.shade,v.cloth,trim);boots(c,time);
    plate(c,[-23,-31,-31,-26,-24,6,-16,3],'#685039');
    for(let i=0;i<3;i++){seam(c,[-29+i*3,-25,-33+i*3,-46],'#cfb993',1.2);plate(c,[-33+i*3,-46,-35+i*3,-50,-31+i*3,-48],'#ddd3b7');}
    plate(c,[-14,-28,10,-27,18,-8,12,4,-12,4,-18,-11],'#786552');
    plate(c,[-12,-25,2,-24,7,-11,-1,1,-13,-4],metal(c,'#c2c8b6','#5f6d5f'));
    plate(c,[7,-25,19,-24,26,-15,18,-10,9,-14],'#8f9a83');seam(c,[11,-24,20,-20,23,-16],'#c6ceaf');
    plate(c,[-16,-27,-24,-24,-27,-16,-17,-10,-11,-18],'#a5b098');
    plate(c,[-18,-11,-12,-9,-5,-1,9,-5,12,1,-4,7,-18,-1],'#6c7663');
    plate(c,[-15,-25,-9,-28,13,1,8,4],'#483c32');seam(c,[-11,-26,10,1],'#b0986e');belt(c,trim);
    plate(c,[-20,3,-11,3,-10,14,-21,12],'#685039');seam(c,[-19,6,-12,6],'#c1ac82');
    plate(c,[-15,-30,-13,-43,-1,-53,11,-46,16,-32,9,-22,-11,-24],v.shade);
    plate(c,[-15,-30,-13,-43,-1,-53,-3,-43,-10,-33,-11,-24],v.cloth);
    plate(c,[-1,-53,11,-46,16,-32,4,-39,-3,-43],'#7b916b');
    plate(c,[-10,-34,-3,-43,8,-39,11,-31,6,-25,-7,-27],'#1f2926');
    seam(c,[-7,-33,-2,-33],v.light,1);seam(c,[3,-33,7,-32],v.light,1);
    plate(c,[-12,-27,5,-28,12,-23,0,-17,-11,-22],'#a0a48a');
  } else if(loadout.hero==='knight') {
    cloak(c,v.shade,v.cloth,trim,true);boots(c,time,true);
    plate(c,[-17,-28,15,-28,22,-10,14,7,-14,7,-23,-10],metal(c));
    plate(c,[-13,-25,0,-30,14,-25,11,-8,0,0,-12,-8],metal(c,'#eef0e6','#62768e'));
    seam(c,[0,-26,0,-5],trim,2);plate(c,[-5,-20,0,-23,5,-20,0,-12],trim);
    for(const side of [-1,1]) {
      plate(c,[side*11,-27,side*26,-34,side*32,-21,side*25,-12,side*14,-16],metal(c));
      seam(c,[side*17,-28,side*26,-30,side*29,-23],trim,1.4);
      plate(c,[side*17,-13,side*24,-13,side*27,1,side*18,5],'#8a95a4');
      plate(c,[side*8,3,side*20,3,side*24,15,side*10,13],metal(c));
    }
    belt(c,trim);
    plate(c,[-12,-44,-7,-54,8,-54,15,-43,11,-27,-10,-27],metal(c,'#e8edf3','#657286'));
    plate(c,[-11,-40,12,-41,10,-35,-10,-35],'#222c3f');seam(c,[-9,-38,9,-39],v.color,1.1);
    plate(c,[-2,-53,2,-53,4,-29,0,-25,-3,-30],'#c9cdd4');
    plate(c,[-5,-54,-10,-65,1,-62,7,-55],v.cloth);seam(c,[-8,-62,2,-58],trim);
    plate(c,[-33,-18,-20,-21,-15,-14,-17,10,-29,23,-39,9,-39,-12],metal(c));
    plate(c,[-31,-14,-23,-16,-20,-10,-22,6,-29,15,-35,5,-35,-9],v.cloth);
    seam(c,[-28,-12,-28,10],trim,2);seam(c,[-33,-3,-23,-3],trim,2);
  } else if(loadout.hero==='witch') {
    cloak(c,v.shade,v.cloth,trim,true);boots(c,time);
    plate(c,[-14,-28,12,-28,16,-6,23,30,7,35,-1,27,-19,33,-23,22,-15,-7],v.cloth);
    plate(c,[-1,-26,8,-25,12,7,17,30,6,32,-1,25], '#9480ad');
    seam(c,[-17,-3,-20,27,-8,24],trim,1.2);seam(c,[3,-14,5,24],trim,1.5);
    for(const side of [-1,1])plate(c,[side*12,-28,side*27,-23,side*30,-5,side*18,1,side*13,-12],v.shade);
    plate(c,[-12,-30,-15,-40,-7,-49,6,-49,14,-40,10,-29],'#57465e');
    plate(c,[-7,-41,6,-42,9,-35,5,-28,-5,-29,-9,-35],'#c7a590');
    plate(c,[-11,-41,-7,-49,6,-49,13,-41,6,-40,3,-45,-3,-40],'#c7c4d8');
    seam(c,[-5,-35,-2,-35],'#45304f');seam(c,[3,-35,6,-35],'#45304f');
    plate(c,[-23,-43,-8,-47,-4,-68,5,-64,13,-47,23,-43,12,-38,-12,-38],v.shade);
    plate(c,[-8,-47,-4,-68,5,-64,2,-49,13,-47],v.cloth);seam(c,[-15,-43,16,-43],trim,2);jewel(c,0,-43,trim);
    plate(c,[-11,-26,0,-17,11,-27,8,-12,0,-7,-9,-14],'#c8c1d2');jewel(c,0,-14,v.color,4);
    belt(c,trim);
    for(let i=0;i<3;i++)jewel(c,-18+i*17,22+(i%2)*5,v.color,2);
  } else if(loadout.hero==='robot') {
    boots(c,time,true);
    for(const side of [-1,1]) {
      plate(c,[side*10,-31,side*23,-33,side*25,-8,side*15,-5],'#394553');
      plate(c,[side*19,-29,side*33,-27,side*37,-12,side*27,-7,side*17,-15],metal(c,'#c4c8ce','#4e5967'));
      seam(c,[side*23,-26,side*31,-24,side*33,-16],trim,2);
      plate(c,[side*26,-11,side*35,-9,side*32,8,side*22,9],'#4e5866');
      plate(c,[side*24,-6,side*31,-5,side*29,3,side*22,3],v.cloth);
    }
    plate(c,[-20,-27,18,-28,23,-6,14,13,-15,12,-24,-5],metal(c,'#b9c5d0','#56616f'));
    plate(c,[-12,-23,11,-24,15,-8,7,5,-10,4,-16,-7],'#354452');
    c.fillStyle='#202b35';c.beginPath();c.arc(0,-9,9,0,Math.PI*2);c.fill();jewel(c,0,-9,v.color,6);
    seam(c,[-15,-24,-12,-19],trim,2);seam(c,[12,-24,15,-19],trim,2);
    plate(c,[-15,-48,9,-50,17,-42,14,-28,-13,-28,-19,-39],metal(c));
    plate(c,[-13,-41,12,-42,11,-34,-12,-34],'#26313d');seam(c,[-9,-38,8,-38],v.color,2.5);
    plate(c,[-5,-48,0,-53,8,-51,9,-49],'#778593');
    for(const x of [-11,9])seam(c,[x,-26,x,-15],'#d0d7de',1.4);
    plate(c,[-17,4,-6,6,-7,17,-20,16],'#7c8b9b');plate(c,[6,6,17,3,22,15,9,17],'#8392a1');
  } else if(loadout.hero==='assassin') {
    cloak(c,v.shade,v.cloth,trim,true);boots(c,time);
    // Trailing scarf and crossed scabbards, separate from the ranger's quiver.
    plate(c,[-8,-31,-25,-25,-45,-32,-35,-20,-18,-19,1,-25],v.cloth);
    seam(c,[-24,-25,-38,-28],trim);
    seam(c,[-23,-39,16,19],'#7d7888',3);seam(c,[22,-39,-17,20],'#57556a',3);
    plate(c,[-13,-29,10,-30,18,-15,10,4,-14,5,-19,-13],'#3a3546');
    plate(c,[-12,-26,0,-23,10,-28,11,-12,0,-5,-12,-12],metal(c,'#aca4b9','#4a405b'));
    for(const side of [-1,1]) {
      plate(c,[side*12,-28,side*24,-28,side*28,-19,side*16,-14], '#6c6179');
      seam(c,[side*17,-25,side*24,-23],trim);
      plate(c,[side*17,-15,side*23,-12,side*19,3,side*12,2],'#3b3648');
    }
    belt(c,trim);plate(c,[-14,5,-22,27,-13,22,-5,31,-2,5],v.cloth);
    plate(c,[-13,-40,-6,-51,8,-49,14,-40,10,-28,-10,-28],v.shade);
    plate(c,[-11,-40,-6,-51,8,-49,3,-42,-8,-34],v.cloth);
    plate(c,[-8,-39,7,-40,9,-33,-7,-32],'#b19b9f');
    seam(c,[-6,-36,-2,-36],v.light);seam(c,[3,-36,7,-36],v.light);
    plate(c,[-9,-33,9,-34,7,-26,-5,-26,-11,-30],'#443d54');seam(c,[-7,-30,6,-29],trim);
    // Off-hand crescent blade hangs low while the main blade aims.
    plate(c,[-20,4,-28,12,-36,24,-31,22,-25,15,-15,9],'#c7bfd9');seam(c,[-26,14,-32,22],v.color);
  } else {
    cloak(c,v.shade,v.cloth,trim,true);boots(c,time,true);
    plate(c,[-16,-28,13,-28,20,-10,13,7,-14,7,-22,-12],metal(c,'#dae5ed','#4b6a83'));
    plate(c,[-13,-25,0,-31,13,-25,9,-9,0,-2,-11,-9], '#7695ab');
    plate(c,[-6,-19,0,-23,7,-19,0,-10],v.color);seam(c,[0,-27,0,-23],trim,2);
    for(const side of [-1,1]) {
      plate(c,[side*11,-28,side*25,-35,side*32,-27,side*28,-17,side*15,-13],metal(c));
      plate(c,[side*20,-29,side*29,-39,side*27,-25,side*21,-20], '#c7dfeb');
      plate(c,[side*17,-13,side*25,-13,side*24,4,side*15,4],'#708ba0');
      seam(c,[side*18,-10,side*23,-6,side*19,0],trim,1.5);
    }
    belt(c,trim);
    plate(c,[-12,-44,-6,-53,7,-52,15,-43,10,-28,-10,-29],metal(c,'#e5eff3','#57758c'));
    plate(c,[-10,-41,12,-41,9,-34,-9,-34],'#233d50');seam(c,[-6,-38,7,-38],v.light,1.2);
    plate(c,[-3,-52,-7,-65,2,-60,8,-67,6,-51],v.cloth);seam(c,[0,-60,2,-53],v.color,1.5);
    plate(c,[-1,-42,3,-42,2,-28,-2,-29], '#d6e5ec');
  }
  // Small clasps and joints unify the material treatment without flattening identity.
  for(const x of [-11,11])jewel(c,x,7,trim,1.5);
}
