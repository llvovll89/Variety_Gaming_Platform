import { CEILING_Y, GROUND_Y, PIPE_WIDTH, PLAYER_HITBOX_RADIUS, PLAYER_X } from "./constants";
import type { Obstacle } from "./types";
import { clamp, distanceSq } from "../../../utils/math";

function circleHitsRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
): boolean {
  const closestX = clamp(cx, rx, rx + rw);
  const closestY = clamp(cy, ry, ry + rh);
  return distanceSq({ x: cx, y: cy }, { x: closestX, y: closestY }) < r * r;
}

export function hitsGroundOrCeiling(playerY: number): boolean {
  return playerY - PLAYER_HITBOX_RADIUS < CEILING_Y || playerY + PLAYER_HITBOX_RADIUS > GROUND_Y;
}

export function hitsObstacle(playerY: number, obstacle: Obstacle): boolean {
  const gapTop = obstacle.gapCenterY - obstacle.gapHeight / 2;
  const gapBottom = obstacle.gapCenterY + obstacle.gapHeight / 2;
  const topPillarHit = circleHitsRect(
    PLAYER_X,
    playerY,
    PLAYER_HITBOX_RADIUS,
    obstacle.x,
    CEILING_Y,
    PIPE_WIDTH,
    gapTop - CEILING_Y,
  );
  if (topPillarHit) return true;
  return circleHitsRect(
    PLAYER_X,
    playerY,
    PLAYER_HITBOX_RADIUS,
    obstacle.x,
    gapBottom,
    PIPE_WIDTH,
    GROUND_Y - gapBottom,
  );
}
