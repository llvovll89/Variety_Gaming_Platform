import {
  BOT_FLEE_SIZE_RATIO,
  BOT_PERCEPTION_RADIUS,
  BOT_THINK_INTERVAL_MAX,
  BOT_THINK_INTERVAL_MIN,
  BOT_WANDER_TURN_STEP,
  WORLD_HALF,
} from "./constants";
import type { Snake, Star } from "./types";
import { distance, randRange } from "../../../utils/math";
import type { Vector2 } from "../../../utils/math";

export interface BotAIContext {
  findNearestStar: (pos: Vector2, radius: number) => Star | null;
  snakes: Snake[];
}

function angleTo(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** Steers away from the world border once a bot gets close, so bots don't suicide into the wall. */
function borderAvoidanceAngle(pos: Vector2): number | null {
  const margin = 500;
  const distToEdge = WORLD_HALF - Math.max(Math.abs(pos.x), Math.abs(pos.y));
  if (distToEdge > margin) return null;
  return angleTo(pos, { x: 0, y: 0 });
}

function findThreat(bot: Snake, ctx: BotAIContext): Snake | null {
  let closest: Snake | null = null;
  let closestDist = Infinity;
  for (const other of ctx.snakes) {
    if (other.id === bot.id || !other.alive) continue;
    if (other.radius < bot.radius * BOT_FLEE_SIZE_RATIO) continue;
    const d = distance(bot.head, other.head);
    if (d < BOT_PERCEPTION_RADIUS && d < closestDist) {
      closest = other;
      closestDist = d;
    }
  }
  return closest;
}

export function updateBotAI(bot: Snake, dt: number, ctx: BotAIContext): void {
  bot.aiThinkTimer -= dt;
  if (bot.aiThinkTimer > 0) return;
  bot.aiThinkTimer = randRange(BOT_THINK_INTERVAL_MIN, BOT_THINK_INTERVAL_MAX);

  const borderAngle = borderAvoidanceAngle(bot.head);
  if (borderAngle !== null) {
    bot.aiState = "FLEE";
    bot.targetAngle = borderAngle;
    return;
  }

  const threat = findThreat(bot, ctx);
  if (threat) {
    bot.aiState = "FLEE";
    const away = angleTo(threat.head, bot.head);
    bot.targetAngle = away;
    return;
  }

  const star = ctx.findNearestStar(bot.head, BOT_PERCEPTION_RADIUS);
  if (star) {
    bot.aiState = "SEEK_STAR";
    bot.aiTargetStarId = star.id;
    bot.targetAngle = angleTo(bot.head, star.pos);
    return;
  }

  bot.aiState = "WANDER";
  bot.aiTargetStarId = null;
  bot.targetAngle += randRange(-BOT_WANDER_TURN_STEP, BOT_WANDER_TURN_STEP);
}
