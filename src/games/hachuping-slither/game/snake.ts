import {
  BOOST_DRAIN_PER_SEC,
  BOOST_MIN_SCORE,
  BOOST_TRAIL_INTERVAL,
  BASE_SPEED,
  BOOST_MULTIPLIER,
} from "./constants";
import {
  radiusForScore,
  segmentCountForScore,
  segmentSpacingForRadius,
  turnRateForRadius,
} from "./growth";
import type { Snake } from "./types";
import { angleLerp, distance } from "../../../utils/math";

let nextSnakeId = 1;

export function createSnake(
  isPlayer: boolean,
  name: string,
  x: number,
  y: number,
  hue: number,
  startScore: number,
): Snake {
  const heading = Math.random() * Math.PI * 2;
  return {
    id: nextSnakeId++,
    isPlayer,
    name,
    alive: true,
    head: { x, y },
    heading,
    targetAngle: heading,
    speed: BASE_SPEED,
    boosting: false,
    score: startScore,
    radius: radiusForScore(startScore),
    pathHistory: [{ x, y }],
    hue,
    boostTrailTimer: BOOST_TRAIL_INTERVAL,
    aiState: "WANDER",
    aiThinkTimer: 0,
    aiTargetStarId: null,
  };
}

export interface SnakeStepResult {
  /** World position where a boost-trail star should be dropped this frame, if any. */
  boostTrailAt: { x: number; y: number } | null;
}

/** Advances a snake's heading/position/score for one physics step. Does not touch world bounds or collisions. */
export function stepSnake(snake: Snake, dt: number, wantsBoost: boolean): SnakeStepResult {
  const result: SnakeStepResult = { boostTrailAt: null };
  if (!snake.alive) return result;

  snake.radius = radiusForScore(snake.score);

  const canBoost = wantsBoost && snake.score > BOOST_MIN_SCORE;
  snake.boosting = canBoost;

  const turnRate = turnRateForRadius(snake.radius);
  snake.heading = angleLerp(snake.heading, snake.targetAngle, turnRate * dt);

  const speed = BASE_SPEED * (canBoost ? BOOST_MULTIPLIER : 1);
  snake.speed = speed;
  snake.head.x += Math.cos(snake.heading) * speed * dt;
  snake.head.y += Math.sin(snake.heading) * speed * dt;

  if (canBoost) {
    snake.score = Math.max(BOOST_MIN_SCORE, snake.score - BOOST_DRAIN_PER_SEC * dt);
    snake.boostTrailTimer -= dt;
    if (snake.boostTrailTimer <= 0) {
      snake.boostTrailTimer = BOOST_TRAIL_INTERVAL;
      const tail = snake.pathHistory[0] ?? snake.head;
      result.boostTrailAt = { x: tail.x, y: tail.y };
    }
  } else {
    snake.boostTrailTimer = BOOST_TRAIL_INTERVAL;
  }

  appendTrailIfNeeded(snake);
  trimTrail(snake);

  return result;
}

function appendTrailIfNeeded(snake: Snake): void {
  const spacing = segmentSpacingForRadius(snake.radius);
  const last = snake.pathHistory[snake.pathHistory.length - 1];
  if (!last || distance(last, snake.head) >= spacing) {
    snake.pathHistory.push({ x: snake.head.x, y: snake.head.y });
  }
}

function trimTrail(snake: Snake): void {
  const needed = segmentCountForScore(snake.score);
  const maxKeep = Math.ceil(needed * 1.2) + 2;
  if (snake.pathHistory.length > maxKeep) {
    snake.pathHistory = snake.pathHistory.slice(snake.pathHistory.length - maxKeep);
  }
}

/** Body segment centers, ordered from the neck (closest to head) outward to the tail. */
export function getSegmentsFromNeck(snake: Snake): { x: number; y: number }[] {
  const needed = segmentCountForScore(snake.score);
  const history = snake.pathHistory;
  const out: { x: number; y: number }[] = [];
  for (let i = history.length - 1; i >= 0 && out.length < needed; i--) {
    out.push(history[i]);
  }
  return out;
}
