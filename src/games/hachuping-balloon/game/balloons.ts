import {
  BALLOON_HIT_PADDING,
  BALLOON_RADIUS_MAX,
  BALLOON_RADIUS_MIN,
  BALLOON_SPEED_JITTER_MAX,
  BALLOON_SPEED_JITTER_MIN,
  BALLOON_SWAY_AMPLITUDE_MAX,
  BALLOON_SWAY_AMPLITUDE_MIN,
  BALLOON_SWAY_SPEED_MAX,
  BALLOON_SWAY_SPEED_MIN,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
} from "./constants";
import type { Balloon } from "./types";
import { distanceSq, randRange } from "../../../utils/math";

let nextBalloonId = 1;

// Golden-angle step keeps consecutive balloons visually distinct, same trick used for the
// obstacle/orb hues in the other two games.
const HUE_STEP = 137.508;

export function spawnBalloon(riseSpeed: number): Balloon {
  const radius = randRange(BALLOON_RADIUS_MIN, BALLOON_RADIUS_MAX);
  const baseX = randRange(radius + BALLOON_SWAY_AMPLITUDE_MAX, LOGICAL_WIDTH - radius - BALLOON_SWAY_AMPLITUDE_MAX);
  const id = nextBalloonId++;
  return {
    id,
    baseX,
    x: baseX,
    y: LOGICAL_HEIGHT + radius, // just below the bottom edge, so it rises smoothly into view
    riseSpeed: riseSpeed * randRange(BALLOON_SPEED_JITTER_MIN, BALLOON_SPEED_JITTER_MAX),
    swayPhase: randRange(0, Math.PI * 2),
    swayAmplitude: randRange(BALLOON_SWAY_AMPLITUDE_MIN, BALLOON_SWAY_AMPLITUDE_MAX),
    swaySpeed: randRange(BALLOON_SWAY_SPEED_MIN, BALLOON_SWAY_SPEED_MAX),
    radius,
    hue: (id * HUE_STEP) % 360,
    age: 0,
  };
}

/** Advances every balloon and drops any that have fully risen past the top of the arena. */
export function advanceBalloons(balloons: Balloon[], dt: number): Balloon[] {
  for (const b of balloons) {
    b.age += dt;
    b.y -= b.riseSpeed * dt;
    b.x = b.baseX + Math.sin(b.age * b.swaySpeed + b.swayPhase) * b.swayAmplitude;
  }
  return balloons.filter((b) => b.y > -b.radius * 3);
}

/** Returns every balloon whose forgiving tap hitbox contains the given logical-space point —
 * poppable the instant it spawns at the bottom edge, not just once fully risen into view. */
export function findBalloonsAtPoint(balloons: Balloon[], x: number, y: number): Balloon[] {
  return balloons.filter((b) => {
    const r = b.radius + BALLOON_HIT_PADDING;
    return distanceSq({ x, y }, { x: b.x, y: b.y }) < r * r;
  });
}
