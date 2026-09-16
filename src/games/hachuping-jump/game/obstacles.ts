import { GAP_MARGIN_BOTTOM, GAP_MARGIN_TOP, GROUND_Y, PIPE_WIDTH } from './constants';
import { maybeSpawnStar } from './star';
import { ITEM_ORDER } from './items';
import type { Obstacle, ObstacleKind } from './types';
import { clamp, randRange } from '../../../utils/math';
let nextObstacleId = 1;
export function createObstacle(x: number, gapHeight: number, sequence = 1, kind: ObstacleKind = 'candy', previousCenter = 320): Obstacle {
  // Leave room for moving gates and keep consecutive openings reachable.
  const minCenter = GAP_MARGIN_TOP + gapHeight / 2 + 35;
  const maxCenter = GROUND_Y - GAP_MARGIN_BOTTOM - gapHeight / 2 - 35;
  const gapCenterY = clamp(previousCenter + randRange(-75, 75), minCenter, maxCenter);
  const id = nextObstacleId++;
  return { id, x, kind, baseCenterY: gapCenterY, baseGapHeight: gapHeight, age: 0, gapCenterY, gapHeight, passed: false,
    item: sequence % 2 === 1 ? { kind: ITEM_ORDER[Math.floor((sequence - 1) / 2) % ITEM_ORDER.length], collected: false } : null,
    star: maybeSpawnStar(gapCenterY), hue: (id * 137.508) % 360 };
}
export function advanceObstacles(obstacles: Obstacle[], dx: number, dt = 0): Obstacle[] {
  for (const o of obstacles) {
    o.x -= dx; o.age += dt;
    if (o.kind === 'cloud') o.gapCenterY = o.baseCenterY + Math.sin(o.age * 1.5) * 30;
    if (o.kind === 'crystal') o.gapHeight = o.baseGapHeight + Math.sin(o.age * 1.8) * 28;
    if (o.star) o.star.y = o.gapCenterY;
  }
  return obstacles.filter(o => o.x + PIPE_WIDTH > 0);
}
