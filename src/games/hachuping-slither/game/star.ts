import {
  STAR_MAX_VALUE,
  STAR_MIN_RADIUS,
  STAR_MIN_VALUE,
  STAR_RADIUS_PER_VALUE,
  WORLD_HALF,
} from "./constants";
import type { Star } from "./types";
import { randInt, randRange } from "../../../utils/math";

let nextStarId = 1;

export function radiusForStarValue(value: number): number {
  return STAR_MIN_RADIUS + value * STAR_RADIUS_PER_VALUE;
}

export function createStar(x: number, y: number, value?: number): Star {
  const v = value ?? randInt(STAR_MIN_VALUE, STAR_MAX_VALUE);
  return {
    id: nextStarId++,
    pos: { x, y },
    value: v,
    radius: radiusForStarValue(v),
    hue: Math.floor(randRange(0, 360)),
  };
}

export function createRandomStar(): Star {
  const x = randRange(-WORLD_HALF + 40, WORLD_HALF - 40);
  const y = randRange(-WORLD_HALF + 40, WORLD_HALF - 40);
  return createStar(x, y);
}
