import { PIPE_WIDTH, PLAYER_HITBOX_RADIUS, PLAYER_X, STAR_RADIUS, STAR_SPAWN_CHANCE } from "./constants";
import type { BonusStar, Obstacle } from "./types";
import { distanceSq } from "../../../utils/math";

/** Bonus stars occasionally ride inside an obstacle's gap — ties into the "별" motif from
 * hachuping-slither without sharing its free-roam star-field logic (too different a shape). */
export function maybeSpawnStar(gapCenterY: number): BonusStar | null {
  return Math.random() < STAR_SPAWN_CHANCE ? { y: gapCenterY, collected: false } : null;
}

export function hitsStar(playerY: number, obstacle: Obstacle): boolean {
  if (!obstacle.star || obstacle.star.collected) return false;
  const starX = obstacle.x + PIPE_WIDTH / 2;
  const r = PLAYER_HITBOX_RADIUS + STAR_RADIUS;
  return distanceSq({ x: PLAYER_X, y: playerY }, { x: starX, y: obstacle.star.y }) < r * r;
}
