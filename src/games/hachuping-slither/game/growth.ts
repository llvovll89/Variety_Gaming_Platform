import {
  DEATH_DROP_MAX_STARS,
  DEATH_DROP_MIN_STARS,
  DEATH_DROP_RECOVERY_RATIO,
  DEATH_DROP_STAR_VALUE,
  GROWTH_K,
  MAX_SEGMENTS,
  MAX_TURN_RATE,
  MIN_SEGMENTS,
  MIN_TURN_RATE,
  R_MIN,
  SEGMENT_SCORE_UNIT,
  SEGMENT_SPACING_FACTOR,
  TURN_RATE_SIZE_FALLOFF,
} from "./constants";
import { clamp } from "../../../utils/math";

/** score === size, expressed as a diminishing curve so growth stays playable at high scores. */
export function radiusForScore(score: number): number {
  return R_MIN + GROWTH_K * Math.sqrt(Math.max(0, score));
}

export function segmentSpacingForRadius(radius: number): number {
  return radius * SEGMENT_SPACING_FACTOR;
}

export function segmentCountForScore(score: number): number {
  const raw = Math.floor(score / SEGMENT_SCORE_UNIT);
  return clamp(raw, MIN_SEGMENTS, MAX_SEGMENTS);
}

export function turnRateForRadius(radius: number): number {
  const rate = MAX_TURN_RATE - radius * TURN_RATE_SIZE_FALLOFF;
  return clamp(rate, MIN_TURN_RATE, MAX_TURN_RATE);
}

/** How many stars (and of what value) to scatter when a snake of the given score dies. */
export function dropCountForScore(score: number): number {
  const recoverable = score * DEATH_DROP_RECOVERY_RATIO;
  const count = Math.floor(recoverable / DEATH_DROP_STAR_VALUE);
  return clamp(count, DEATH_DROP_MIN_STARS, DEATH_DROP_MAX_STARS);
}
