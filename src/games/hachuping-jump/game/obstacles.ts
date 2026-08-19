import { GAP_MARGIN_BOTTOM, GAP_MARGIN_TOP, GROUND_Y, PIPE_WIDTH } from "./constants";
import { maybeSpawnStar } from "./star";
import type { Obstacle } from "./types";
import { randRange } from "../../../utils/math";

let nextObstacleId = 1;

export function createObstacle(x: number, gapHeight: number): Obstacle {
  const minCenter = GAP_MARGIN_TOP + gapHeight / 2;
  const maxCenter = GROUND_Y - GAP_MARGIN_BOTTOM - gapHeight / 2;
  const gapCenterY = randRange(minCenter, maxCenter);
  return { id: nextObstacleId++, x, gapCenterY, gapHeight, passed: false, star: maybeSpawnStar(gapCenterY) };
}

/** Scrolls every obstacle left by `dx` and drops any that have fully exited the screen. */
export function advanceObstacles(obstacles: Obstacle[], dx: number): Obstacle[] {
  for (const obstacle of obstacles) obstacle.x -= dx;
  return obstacles.filter((o) => o.x + PIPE_WIDTH > 0);
}
