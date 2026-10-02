import type { Role } from './game';
import type { Facing } from './animation';

const roles: Role[] = ['sword', 'spear', 'mage', 'healer', 'goblin', 'archer', 'boss'];
const heights = [82, 104, 91, 87, 64, 79, 106, 154];
const sprites: HTMLCanvasElement[] = [];
const portraits = new Image();
const frames: HTMLCanvasElement[][] = [];
const frameScales: number[] = [];
let loaded = false;
export const artReady = Promise.all([
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

export function sprite(c: CanvasRenderingContext2D, role: Role | 'tree', x: number, y: number, scale = 1, direction: Facing = 'se', pose: 'idle' | 'walk' | 'attack' = 'idle', clock = 0) {
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
export function portrait(c: CanvasRenderingContext2D, role: Role) {
  if (!loaded || !portraits.naturalWidth) return;
  const i = roles.indexOf(role), w = portraits.width / 4, h = portraits.height / 2;
  c.drawImage(portraits, i % 4 * w, Math.floor(i / 4) * h + 16, w, w, 0, 0, 120, 120);
}
