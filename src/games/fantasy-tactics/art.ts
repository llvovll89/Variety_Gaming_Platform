import type { Role } from './game';
import type { Facing } from './animation';

const roles: Role[] = ['sword', 'spear', 'mage', 'healer', 'goblin', 'archer', 'boss'];
const heights = [82, 104, 91, 87, 64, 79, 106, 154];
const sprites: HTMLCanvasElement[] = [];
const portraits = new Image();
const frames: HTMLCanvasElement[][] = [];
const frameScales: number[] = [];
const beginners: HTMLCanvasElement[] = [];
let loaded = false;
export const artReady = Promise.all([
  new Promise<void>(resolve => {
    const atlas=new Image();atlas.onload=()=>{
      for(let i=0;i<8;i++){
        const w=Math.floor(atlas.width/4),h=Math.floor(atlas.height/2),cell=document.createElement('canvas');cell.width=w;cell.height=h;
        const ctx=cell.getContext('2d')!;ctx.drawImage(atlas,(i%4)*w,Math.floor(i/4)*h,w,h,0,0,w,h);
        const pixels=ctx.getImageData(0,0,w,h).data;let l=w,r=0,t=h,b=0;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
        const crop=document.createElement('canvas');crop.width=Math.max(1,r-l+1);crop.height=Math.max(1,b-t+1);crop.getContext('2d')!.drawImage(cell,l,t,crop.width,crop.height,0,0,crop.width,crop.height);beginners.push(crop);
      }resolve();
    };atlas.onerror=()=>resolve();atlas.src='/art/fantasy-tactics/beginners.png';
  }),
  new Promise<void>((resolve) => {
    const atlas = new Image();
    atlas.onload = () => {
      const rows = [0, .14, .285, .428, .572, .688, .817, 1];
      for (let row = 0; row < 7; row++) {
        frames[row] = [];
        for (let col = 0; col < 6; col++) {
          const left=Math.max(0,Math.floor(col*atlas.width/6)-18), right=Math.min(atlas.width,Math.floor((col+1)*atlas.width/6)+18);
          const w = right-left, h = Math.floor((rows[row+1]-rows[row])*atlas.height);
          const cell = document.createElement('canvas'); cell.width=w; cell.height=h;
          const c=cell.getContext('2d')!;
          c.drawImage(atlas, left, rows[row]*atlas.height, w,h,0,0,w,h);
          const data=c.getImageData(0,0,w,h), pixels=data.data;
          // Generated weapons can cross cell gutters. Keep the principal
          // connected silhouette rather than neighboring cape/weapon scraps.
          const seen=new Uint8Array(w*h);let largest: number[]=[];
          for(let n=0;n<w*h;n++) {
            if(seen[n] || pixels[n*4+3]<=32)continue;
            const component=[n];seen[n]=1;
            for(let k=0;k<component.length;k++) {
              const p=component[k],x=p%w,y=Math.floor(p/w);
              for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
                const nx=x+dx,ny=y+dy,q=ny*w+nx;
                if(nx<0||nx>=w||ny<0||ny>=h||seen[q]||pixels[q*4+3]<=32)continue;
                seen[q]=1;component.push(q);
              }
            }
            if(component.length>largest.length)largest=component;
          }
          let l=w,r=0,t=h,b=0;
          for(const p of largest){const x=p%w,y=Math.floor(p/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
          const keep=new Uint8Array(w*h);
          for(const p of largest){const x=p%w,y=Math.floor(p/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&nx<w&&ny>=0&&ny<h)keep[ny*w+nx]=1;}}
          for(let p=0;p<w*h;p++)if(!keep[p])pixels[p*4+3]=0;
          c.putImageData(data,0,0);
          const crop=document.createElement('canvas');crop.width=Math.max(1,r-l+1);crop.height=Math.max(1,b-t+1);
          crop.getContext('2d')!.drawImage(cell,l,t,crop.width,crop.height,0,0,crop.width,crop.height);
          frames[row].push(crop);
        }
        frameScales[row]=heights[row]/frames[row][0].height;
      }
      resolve();
    };
    atlas.onerror=()=>resolve();atlas.src='/art/fantasy-tactics/animation.png';
  }),
  new Promise<void>((resolve) => {
    const atlas = new Image();
    atlas.onload = () => {
      const rows = [[0, .51], [0, .51], [0, .51], [0, .51], [.60, .98], [.57, .98], [.51, .99], [.53, 1]];
      const columns = [[.015,.22],[.28,.477],[.55,.731],[.79,.958],[.025,.216],[.275,.475],[.492,.765],[.77,1]];
      for (let i = 0; i < 8; i++) {
        const [top, bottom] = rows[i], [left, right] = columns[i];
        const h = Math.floor((bottom - top) * atlas.height), w = Math.floor((right-left)*atlas.width);
        const cell = document.createElement('canvas'); cell.width = w; cell.height = h;
        const c = cell.getContext('2d')!;
        c.drawImage(atlas, Math.floor(left * atlas.width), Math.floor(top * atlas.height), w, h, 0, 0, w, h);
        const pixels = c.getImageData(0, 0, w, h).data;
        let l = w, r = 0, t = h, b = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (pixels[(y * w + x) * 4 + 3] > 24) { l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y); }
        const crop = document.createElement('canvas'); crop.width = Math.max(1, r - l + 1); crop.height = Math.max(1, b - t + 1);
        crop.getContext('2d')!.drawImage(cell, l, t, crop.width, crop.height, 0, 0, crop.width, crop.height);
        sprites.push(crop);
      }
      resolve();
    };
    atlas.onerror = () => resolve(); atlas.src = '/art/fantasy-tactics/sprites.png';
  }),
  new Promise<void>((resolve) => { portraits.onload = () => resolve(); portraits.onerror = () => resolve(); portraits.src = '/art/fantasy-tactics/portraits.png'; }),
]).then(() => { loaded = true; });

export function sprite(c: CanvasRenderingContext2D, role: Role | 'tree', x: number, y: number, scale = 1, direction: Facing = 'se', pose: 'idle' | 'walk' | 'attack' = 'idle', clock = 0, promoted = true) {
  if(['ranger','rogue','shield','watermage','shaman'].includes(role)){c.save();c.translate(x,y);c.scale(scale,scale);const color=role==='ranger'?'#65b87e':role==='rogue'?'#a285cf':role==='shield'?'#90a5bb':role==='watermage'?'#62c9ed':'#bd7dd4';c.fillStyle=color;c.beginPath();c.moveTo(-15,-43);c.lineTo(15,-43);c.lineTo(21,-8);c.lineTo(-21,-8);c.fill();c.fillStyle='#ebc5a1';c.fillRect(-9,-62,18,18);c.fillStyle=promoted?'#ebcf7c':color;c.fillRect(-12,-68,24,9);c.fillStyle='#26364b';c.fillRect(-12,-8,8,8);c.fillRect(4,-8,8,8);c.strokeStyle=promoted?'#ebcf7c':'#ad9071';c.lineWidth=4;c.beginPath();if(role==='ranger'){c.arc(22,-35,18,-Math.PI/2,Math.PI/2);c.moveTo(22,-53);c.lineTo(22,-17);}else if(role==='shield'){c.rect(10,-42,22,30);}else if(role==='rogue'){c.moveTo(-22,-30);c.lineTo(-22,-50);c.moveTo(22,-30);c.lineTo(22,-50);}else{c.moveTo(23,-10);c.lineTo(23,-64);c.arc(23,-64,6,0,Math.PI*2);}c.stroke();c.restore();return true;}
  const noviceIndex=roles.indexOf(role as Role);
  if(!promoted&&noviceIndex>=0&&noviceIndex<4&&beginners.length===8){
    const source=beginners[noviceIndex+(direction==='ne'||direction==='nw'?4:0)],h=(heights[noviceIndex]-10)*scale,w=h*source.width/source.height;
    c.save();c.translate(x,y-(pose==='walk'?Math.abs(Math.sin(clock/75))*2:0));if(direction==='sw'||direction==='nw')c.scale(-1,1);
    if(pose==='attack')c.rotate(-0.08);c.drawImage(source,-w/2,-h,w,h);c.restore();return true;
  }
  if(role !== 'tree' && frames[roles.indexOf(role)]?.length === 6) {
    const row=roles.indexOf(role), back=direction === 'ne' || direction === 'nw';
    const col=(pose === 'attack' ? 4 : pose === 'walk' && Math.floor(clock/75)%2 ? 2 : 0)+(back?1:0);
    const source=frames[row][col], factor=frameScales[row]*scale;
    c.save();c.translate(Math.round(x),Math.round(y));
    if(direction==='sw'||direction==='nw') c.scale(-1,1);
    c.drawImage(source,-Math.round(source.width*factor/2),-Math.round(source.height*factor),Math.round(source.width*factor),Math.round(source.height*factor));
    c.restore();return true;
  }
  const i = role === 'tree' ? 7 : roles.indexOf(role), source = sprites[i];
  if (!source) return false;
  const h = heights[i] * scale, w = h * source.width / source.height;
  c.drawImage(source, Math.round(x - w / 2), Math.round(y - h), Math.round(w), Math.round(h));
  return true;
}
export function portrait(c: CanvasRenderingContext2D, role: Role, promoted = true) {
  if(['ranger','rogue','shield','watermage','shaman'].includes(role)){c.clearRect(0,0,120,120);sprite(c,role,60,138,1.9,'se','idle',0,promoted);return;}
  if (!loaded || !portraits.naturalWidth) return;
  const novice=roles.indexOf(role);
  if(!promoted&&novice>=0&&novice<4&&beginners[novice]){const source=beginners[novice];const size=Math.min(source.width,source.height*.55);c.drawImage(source,(source.width-size)/2,0,size,size,0,0,120,120);return;}
  const i = roles.indexOf(role), w = portraits.width / 4, h = portraits.height / 2;
  c.drawImage(portraits, i % 4 * w, Math.floor(i / 4) * h + 16, w, w, 0, 0, 120, 120);
}
