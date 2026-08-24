import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  PLAYER_HITBOX_RADIUS,
  STAR_MIN_DIST_FROM_PLAYER,
  STAR_RADIUS,
} from "./constants";
import type { BonusStar, PlayerState } from "./types";
import { distanceSq, randRange } from "../../../utils/math";

const MAX_SPAWN_ATTEMPTS = 20;

/** Picks a random arena point, rerolling (bounded) if it lands too close to the player. */
export function spawnStar(player: PlayerState): BonusStar {
  let x = LOGICAL_WIDTH / 2;
  let y = LOGICAL_HEIGHT / 2;
  for (let attempt = 0; attempt < MAX_SPAWN_ATTEMPTS; attempt++) {
    x = randRange(STAR_RADIUS, LOGICAL_WIDTH - STAR_RADIUS);
    y = randRange(STAR_RADIUS, LOGICAL_HEIGHT - STAR_RADIUS);
    const dsq = distanceSq({ x, y }, { x: player.x, y: player.y });
    if (dsq >= STAR_MIN_DIST_FROM_PLAYER * STAR_MIN_DIST_FROM_PLAYER) break;
  }
  return { x, y, age: 0, collected: false };
}

export function hitsStar(player: PlayerState, star: BonusStar): boolean {
  if (star.collected) return false;
  const r = PLAYER_HITBOX_RADIUS + STAR_RADIUS;
  return distanceSq({ x: player.x, y: player.y }, { x: star.x, y: star.y }) < r * r;
}
