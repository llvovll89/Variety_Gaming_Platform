import { CEILING_Y, GROUND_Y, PIPE_WIDTH, PLAYER_HITBOX_RADIUS, PLAYER_X } from "./constants";
import type { Obstacle } from "./types";
import { clamp, distanceSq } from "../../../utils/math";
import { cloudPuffs, mushroomCap, pillarPolygon, pillarRadius, type ModelPoint } from './obstacleShapes';

// Match the model's actual silhouette: capsules, rounded blocks, puffs or tapered polygons.
function circleHitsPillar(
  cx: number,
  cy: number,
  r: number,
  pillarX: number,
  rectTop: number,
  rectBottom: number,
  kind: Obstacle['kind'],
  top: boolean,
): boolean {
  const h = rectBottom - rectTop;
  if (h <= 0) return false;
  const point = {x:cx,y:cy};
  if (kind === 'cloud') return cloudPuffs(pillarX,rectTop,h).some(p => distanceSq(point,p) < (r+p.radius)**2);
  const polygon = pillarPolygon(kind,pillarX,rectTop,h,top);
  if (polygon) return circleHitsPolygon(point,r,polygon);
  const radius = Math.min(pillarRadius(kind), h/2);
  const closest = {x:clamp(cx,pillarX+radius,pillarX+PIPE_WIDTH-radius),y:clamp(cy,rectTop+radius,rectBottom-radius)};
  return distanceSq(point,closest) < (r+radius)**2;
}

function circleHitsPolygon(point: ModelPoint, radius: number, points: ModelPoint[]): boolean {
  let inside = false;
  for (let i=0,j=points.length-1;i<points.length;j=i++) {
    const a=points[j], b=points[i];
    if ((a.y>point.y)!==(b.y>point.y) && point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x) inside=!inside;
    const dx=b.x-a.x,dy=b.y-a.y;
    const t=clamp(((point.x-a.x)*dx+(point.y-a.y)*dy)/(dx*dx+dy*dy || 1),0,1);
    if (distanceSq(point,{x:a.x+t*dx,y:a.y+t*dy}) < radius**2) return true;
  }
  return inside;
}

export function hitsGroundOrCeiling(playerY: number): boolean {
  return playerY - PLAYER_HITBOX_RADIUS < CEILING_Y || playerY + PLAYER_HITBOX_RADIUS > GROUND_Y;
}

export function hitsObstacle(playerY: number, obstacle: Obstacle): boolean {
  const gapTop = obstacle.gapCenterY - obstacle.gapHeight / 2;
  const gapBottom = obstacle.gapCenterY + obstacle.gapHeight / 2;
  if (obstacle.kind === "mushroom" || obstacle.kind === "flower") {
    const cx = obstacle.x + PIPE_WIDTH / 2;
    const headRadius = PIPE_WIDTH / 2 + PLAYER_HITBOX_RADIUS;
    const headHit = obstacle.kind === 'mushroom'
      ? circleHitsPolygon({x:PLAYER_X,y:playerY},PLAYER_HITBOX_RADIUS,mushroomCap(obstacle.x,gapBottom))
      : distanceSq({ x: PLAYER_X, y: playerY }, { x: cx, y: gapBottom + PIPE_WIDTH / 2 }) < headRadius * headRadius;
    const closestX = clamp(PLAYER_X, obstacle.x + 22, obstacle.x + 48);
    const closestY = clamp(playerY, gapBottom + 35, GROUND_Y);
    return headHit || distanceSq({ x: PLAYER_X, y: playerY }, { x: closestX, y: closestY }) < PLAYER_HITBOX_RADIUS ** 2;
  }
  if (circleHitsPillar(PLAYER_X, playerY, PLAYER_HITBOX_RADIUS, obstacle.x, CEILING_Y, gapTop, obstacle.kind, true)) {
    return true;
  }
  return circleHitsPillar(PLAYER_X, playerY, PLAYER_HITBOX_RADIUS, obstacle.x, gapBottom, GROUND_Y, obstacle.kind, false);
}
