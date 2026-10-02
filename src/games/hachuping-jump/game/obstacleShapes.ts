import { PIPE_WIDTH } from './constants';
import type { ObstacleKind } from './types';

export interface ModelPoint { x: number; y: number }

export function mushroomCap(x: number, y: number): ModelPoint[] {
  const cx=x+PIPE_WIDTH/2, cy=y+35;
  const dome=Array.from({length:17},(_,i)=>{const a=Math.PI+i*Math.PI/16;return {x:cx+Math.cos(a)*35,y:cy+Math.sin(a)*35}});
  const lip=Array.from({length:15},(_,i)=>{const a=(i+1)*Math.PI/16;return {x:cx+Math.cos(a)*35,y:cy+Math.sin(a)*10}});
  return [...dome,...lip];
}

// These silhouettes are shared by the painter and hit testing, including tapered tips.
export function pillarPolygon(kind: ObstacleKind, x: number, y: number, h: number, top: boolean): ModelPoint[] | null {
  const w = PIPE_WIDTH;
  if (kind === 'crystal') {
    const bevel = Math.min(30, h / 3);
    return [{x:x+w/2,y},{x:x+w,y:y+bevel},{x:x+w,y:y+h-bevel},
      {x:x+w/2,y:y+h},{x,y:y+h-bevel},{x,y:y+bevel}];
  }
  if (kind !== 'castle') return null;
  const roof = Math.min(42, h / 2);
  const points = [{x:x+w/2,y},{x:x+w,y:y+roof},{x:x+w-9,y:y+roof},
    {x:x+w-9,y:y+h},{x:x+9,y:y+h},{x:x+9,y:y+roof},{x,y:y+roof}];
  return top ? points.map(p => ({x:p.x,y:y+h-(p.y-y)})) : points;
}

export function pillarRadius(kind: ObstacleKind): number {
  return kind === 'toy' ? 9 : kind === 'waffle' ? 14 : PIPE_WIDTH / 2;
}

export function cloudPuffs(x: number, y: number, h: number): { x: number; y: number; radius: number }[] {
  const radius = Math.min(PIPE_WIDTH / 2, h / 2);
  const steps = Math.max(1, Math.ceil((h - radius * 2) / 45));
  return Array.from({length:steps+1}, (_, i) => ({
    x:x+PIPE_WIDTH/2, y:y+radius+(h-radius*2)*i/steps, radius,
  }));
}
