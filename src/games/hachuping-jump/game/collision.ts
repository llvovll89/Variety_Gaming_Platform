import { CEILING_Y, GROUND_Y, PIPE_WIDTH, PLAYER_HITBOX_RADIUS, PLAYER_X } from "./constants";
import type { Obstacle } from "./types";
import { clamp, distanceSq } from "../../../utils/math";

// Matches renderer.ts's drawPillar rounding exactly (radius = w/2, i.e. a true capsule with
// both ends fully rounded) — hit-testing the sharp rectangle instead would register hits in
// the rounded corners that are visibly not part of the pillar, most noticeable right at the
// gap edges players thread through.
const PILLAR_CAP_RADIUS = PIPE_WIDTH / 2;

function circleHitsPillar(
  cx: number,
  cy: number,
  r: number,
  pillarX: number,
  rectTop: number,
  rectBottom: number,
): boolean {
  const centerX = pillarX + PILLAR_CAP_RADIUS;
  const segTop = rectTop + PILLAR_CAP_RADIUS;
  const segBottom = rectBottom - PILLAR_CAP_RADIUS;
  // Short pillars (height < pillar width) collapse the capsule's straight core to nothing —
  // fall back to the single midpoint, which is what the two overlapping rounded caps reduce to.
  const closestY = segTop <= segBottom ? clamp(cy, segTop, segBottom) : (segTop + segBottom) / 2;
  const combined = r + PILLAR_CAP_RADIUS;
  return distanceSq({ x: cx, y: cy }, { x: centerX, y: closestY }) < combined * combined;
}

export function hitsGroundOrCeiling(playerY: number): boolean {
  return playerY - PLAYER_HITBOX_RADIUS < CEILING_Y || playerY + PLAYER_HITBOX_RADIUS > GROUND_Y;
}

export function hitsObstacle(playerY: number, obstacle: Obstacle): boolean {
  const gapTop = obstacle.gapCenterY - obstacle.gapHeight / 2;
  const gapBottom = obstacle.gapCenterY + obstacle.gapHeight / 2;
  if (circleHitsPillar(PLAYER_X, playerY, PLAYER_HITBOX_RADIUS, obstacle.x, CEILING_Y, gapTop)) {
    return true;
  }
  return circleHitsPillar(PLAYER_X, playerY, PLAYER_HITBOX_RADIUS, obstacle.x, gapBottom, GROUND_Y);
}
