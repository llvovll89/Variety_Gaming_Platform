import { ORB_HITBOX_RADIUS, ORB_RADIUS, PLAYER_HITBOX_RADIUS } from "./constants";
import type { Orb, PlayerState } from "./types";
import { distanceSq } from "../../../utils/math";

// Orb size is randomized per spawn (see orbs.ts), so the hitbox scales proportionally with
// each orb's actual rolled radius instead of using a flat constant.
const ORB_HITBOX_RATIO = ORB_HITBOX_RADIUS / ORB_RADIUS;

export function hitsOrb(player: PlayerState, orb: Orb): boolean {
  const r = PLAYER_HITBOX_RADIUS + orb.radius * ORB_HITBOX_RATIO;
  return distanceSq({ x: player.x, y: player.y }, { x: orb.x, y: orb.y }) < r * r;
}
