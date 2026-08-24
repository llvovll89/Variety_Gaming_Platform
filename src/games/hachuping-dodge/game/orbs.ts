import {
  ARENA_CENTER_X,
  ARENA_CENTER_Y,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  ORB_AIM_SPREAD,
  ORB_CULL_MARGIN,
  ORB_RADIUS,
  ORB_RADIUS_VARIANCE_MAX,
  ORB_RADIUS_VARIANCE_MIN,
  ORB_SPAWN_RADIUS,
  ORB_SPEED_JITTER_MAX,
  ORB_SPEED_JITTER_MIN,
} from "./constants";
import type { Orb } from "./types";
import { randRange } from "../../../utils/math";

let nextOrbId = 1;

// Golden-angle step keeps consecutive orbs visually distinct, same trick as hachuping-jump's
// obstacle pillars.
const HUE_STEP = 137.508;

export function spawnOrb(baseSpeed: number): Orb {
  const theta = randRange(0, Math.PI * 2);
  const x = ARENA_CENTER_X + Math.cos(theta) * ORB_SPAWN_RADIUS;
  const y = ARENA_CENTER_Y + Math.sin(theta) * ORB_SPAWN_RADIUS;
  const targetX = ARENA_CENTER_X + randRange(-ORB_AIM_SPREAD, ORB_AIM_SPREAD);
  const targetY = ARENA_CENTER_Y + randRange(-ORB_AIM_SPREAD, ORB_AIM_SPREAD);
  const dirLen = Math.hypot(targetX - x, targetY - y) || 1;
  const speed = baseSpeed * randRange(ORB_SPEED_JITTER_MIN, ORB_SPEED_JITTER_MAX);
  const radius = ORB_RADIUS * randRange(ORB_RADIUS_VARIANCE_MIN, ORB_RADIUS_VARIANCE_MAX);
  const id = nextOrbId++;
  return {
    id,
    x,
    y,
    vx: ((targetX - x) / dirLen) * speed,
    vy: ((targetY - y) / dirLen) * speed,
    radius,
    hue: (id * HUE_STEP) % 360,
    age: 0,
  };
}

/** Advances every orb and drops any that have cleared the arena by ORB_CULL_MARGIN. */
export function advanceOrbs(orbs: Orb[], dt: number): Orb[] {
  for (const orb of orbs) {
    orb.x += orb.vx * dt;
    orb.y += orb.vy * dt;
    orb.age += dt;
  }
  return orbs.filter(
    (o) =>
      o.x > -ORB_CULL_MARGIN &&
      o.x < LOGICAL_WIDTH + ORB_CULL_MARGIN &&
      o.y > -ORB_CULL_MARGIN &&
      o.y < LOGICAL_HEIGHT + ORB_CULL_MARGIN,
  );
}
