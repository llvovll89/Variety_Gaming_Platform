import type { Role } from './game';
import type { Facing } from './animation';

const roles: Role[] = ['sword', 'spear', 'mage', 'healer', 'goblin', 'archer', 'boss'];
const heights = [82, 104, 91, 87, 64, 79, 106, 154];
const sprites: HTMLCanvasElement[] = [];
const portraits = new Image();
const frames: HTMLCanvasElement[][] = [];
const frameScales: number[] = [];
const beginners: HTMLCanvasElement[] = [];
const expandedRoles: Role[] = ['ranger', 'rogue', 'shield', 'watermage', 'shaman'];
const expanded: HTMLCanvasElement[][] = [];
// Reuse illustrated equipment silhouettes consistently across all six poses.
const variants: Partial<Record<Role, { base: Role; filter: string }>> = {
  ranger: { base: 'archer', filter: 'hue-rotate(65deg) saturate(0.8)' },
  rogue: { base: 'archer', filter: 'hue-rotate(210deg) saturate(0.65)' },
  shield: { base: 'sword', filter: 'saturate(0.35) brightness(0.85)' },
  watermage: { base: 'mage', filter: 'hue-rotate(175deg) saturate(0.8)' },
  shaman: { base: 'healer', filter: 'hue-rotate(95deg) saturate(0.8) brightness(0.85)' },
};
let loaded = false;
export const artReady = Promise.all([
  new Promise<void>(resolve => {
    const atlas = new Image();
    atlas.onload = () => {
      for (let i = 0; i < 5; i++) {
        expanded[i] = [];
        for (let row = 0; row < 2; row++) {
          const left = Math.floor(i * atlas.width / 5), right = Math.floor((i + 1) * atlas.width / 5);
          const top = row ? Math.floor(atlas.height * .52) : 0, bottom = row ? atlas.height : Math.floor(atlas.height * .52);
          const cell = document.createElement('canvas'); cell.width = right - left; cell.height = bottom - top;
          const ctx = cell.getContext('2d')!; ctx.drawImage(atlas, left, top, cell.width, cell.height, 0, 0, cell.width, cell.height);
          const pixels = ctx.getImageData(0, 0, cell.width, cell.height).data;
          let l = cell.width, r = -1, t = cell.height, b = -1;
          for (let y = 0; y < cell.height; y++) for (let x = 0; x < cell.width; x++) if (pixels[(y * cell.width + x) * 4 + 3] > 32) {
            l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
          }
          if (r < l) continue;
          const crop = document.createElement('canvas'); crop.width = r - l + 1; crop.height = b - t + 1;
          crop.getContext('2d')!.drawImage(cell, l, t, crop.width, crop.height, 0, 0, crop.width, crop.height);
          expanded[i][row] = crop;
        }
      }
      resolve();
    };
    atlas.onerror = () => resolve(); atlas.src = '/art/fantasy-tactics/expanded-roles.png';
  }),
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

export function sprite(c: CanvasRenderingContext2D, role: Role | 'tree', x: number, y: number, scale = 1, direction: Facing = 'se', pose: 'idle' | 'walk' | 'attack' = 'idle', clock = 0, promoted = true): boolean {
  const added = expandedRoles.indexOf(role as Role), back = direction === 'ne' || direction === 'nw';
  const model = expanded[added]?.[back ? 1 : 0];
  if (model) {
    const h = (added === 2 ? 98 : 87) * scale * (promoted ? 1 : .92), w = h * model.width / model.height;
    c.save(); c.translate(x, y - (pose === 'walk' ? Math.abs(Math.sin(clock / 75)) * 3 : 0));
    if (direction === 'sw' || direction === 'nw') c.scale(-1, 1);
    if (pose === 'attack') c.rotate(-.08);
    c.drawImage(model, -w / 2, -h, w, h); c.restore(); return true;
  }
  const variant = variants[role as Role];
  if (variant) {
    c.save(); c.filter = variant.filter;
    const drawn = sprite(c, variant.base, x, y, scale, direction, pose, clock, promoted);
    c.restore(); return drawn;
  }
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
export function portrait(c: CanvasRenderingContext2D, role: Role, promoted = true): void {
  const model = expanded[expandedRoles.indexOf(role)]?.[0];
  if (model) {
    const size = Math.min(model.width, model.height * .56);
    c.drawImage(model, (model.width - size) / 2, 0, size, size, 0, 0, 120, 120); return;
  }
  const variant = variants[role];
  if (variant) {
    c.save(); c.filter = variant.filter;
    portrait(c, variant.base, promoted); c.restore(); return;
  }
  if (!loaded || !portraits.naturalWidth) return;
  const novice=roles.indexOf(role);
  if(!promoted&&novice>=0&&novice<4&&beginners[novice]){const source=beginners[novice];const size=Math.min(source.width,source.height*.55);c.drawImage(source,(source.width-size)/2,0,size,size,0,0,120,120);return;}
  const i = roles.indexOf(role), w = portraits.width / 4, h = portraits.height / 2;
  c.drawImage(portraits, i % 4 * w, Math.floor(i / 4) * h + 16, w, w, 0, 0, 120, 120);
}

const hitMasks = new Map<string, Uint8ClampedArray>();
/** Allow clicks through transparent gutters around the visible artwork. */
export function spriteHit(role: Role, dx: number, dy: number, direction: Facing, promoted: boolean) {
  if (!loaded) return Math.abs(dx) < 16 && dy > -65 && dy < 0;
  const cacheKey = role + ':' + direction + ':' + promoted;
  let pixels = hitMasks.get(cacheKey);
  if (!pixels) {
    const canvas = document.createElement('canvas'); canvas.width = 300; canvas.height = 220;
    const ctx = canvas.getContext('2d')!;
    sprite(ctx, role, 150, 180, 1.05, direction, 'idle', 0, promoted);
    pixels = ctx.getImageData(0, 0, 300, 220).data;
    hitMasks.set(cacheKey, pixels);
  }
  const x = Math.round(dx + 150), y = Math.round(dy + 180);
  return x >= 0 && x < 300 && y >= 0 && y < 220 && pixels[(y * 300 + x) * 4 + 3] > 32;
}
