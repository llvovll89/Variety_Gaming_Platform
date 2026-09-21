import { BASE_SPEED, BOOST_MIN_SCORE, BOT_PERCEPTION_RADIUS, BOT_THINK_INTERVAL_MAX, BOT_THINK_INTERVAL_MIN, WORLD_HALF } from './constants';
import type { Snake, Star } from './types';
import { angleLerp, distance, randRange } from '../../../utils/math';
import type { Vector2 } from '../../../utils/math';
import { getSegmentsFromNeck } from './snake';
import { turnRateForRadius } from './growth';
import { statsFor } from './progression';

export interface BotAIContext {
  findNearestStar: (pos: Vector2, radius: number) => Star | null;
  snakes: Snake[];
}
const angleTo = (a: Vector2, b: Vector2) => Math.atan2(b.y - a.y, b.x - a.x);

type Obstacle = { pos: Vector2; radius: number; vx: number; vy: number };

export function updateBotAI(bot: Snake, dt: number, ctx: BotAIContext): void {
  bot.aiThinkTimer -= dt;
  if (bot.aiThinkTimer > 0) return;
  bot.aiThinkTimer = randRange(BOT_THINK_INTERVAL_MIN, BOT_THINK_INTERVAL_MAX);
  const obstacles: Obstacle[] = [];
  let rival: Snake | null = null;
  for (const other of ctx.snakes) {
    if (!other.alive || other.id === bot.id) continue;
    const d = distance(bot.head, other.head);
    if (d < BOT_PERCEPTION_RADIUS) {
      obstacles.push({ pos: other.head, radius: other.radius, vx: Math.cos(other.heading) * other.speed, vy: Math.sin(other.heading) * other.speed });
      if (d > 180 && d < 360 && (!rival || d < distance(bot.head, rival.head))) rival = other;
    }
    // Check bodies even when their heads are outside perception.
    for (const p of getSegmentsFromNeck(other)) {
      if (distance(bot.head, p) < 360 + other.radius) obstacles.push({ pos: p, radius: other.radius, vx: 0, vy: 0 });
    }
  }
  const star = ctx.findNearestStar(bot.head, BOT_PERCEPTION_RADIUS);
  bot.aiTargetStarId = star?.id ?? null;
  bot.aiState = star ? 'SEEK_STAR' : 'WANDER';
  let goal = star ? angleTo(bot.head, star.pos) : bot.targetAngle + randRange(-.25, .25);
  // Some rivals try to cross ahead of an opponent, while others keep foraging.
  if (rival && bot.id % 3 === 0 && bot.score > 65 && (!star || distance(bot.head, star.pos) > 130)) {
    goal = angleTo(bot.head, { x: rival.head.x + Math.cos(rival.heading) * rival.speed * 1.3, y: rival.head.y + Math.sin(rival.heading) * rival.speed * 1.3 });
    bot.aiState = 'HUNT';
  }
  if (WORLD_HALF - Math.max(Math.abs(bot.head.x), Math.abs(bot.head.y)) < 350) {
    goal = angleTo(bot.head, { x: 0, y: 0 });
    bot.aiState = 'FLEE';
  }
  const stats = statsFor(bot);
  const speed = BASE_SPEED * stats.speedMultiplier;
  const turn = turnRateForRadius(bot.radius) * stats.turnMultiplier;
  // Simulate achievable arcs instead of assuming an instantaneous direction change.
  const evaluate = (target: number, velocity: number) => {
    let x = bot.head.x, y = bot.head.y, heading = bot.heading, risk = 0;
    for (let step = 1; step <= 12; step++) {
      const t = step * .1;
      heading = angleLerp(heading, target, turn * .1);
      x += Math.cos(heading) * velocity * .1; y += Math.sin(heading) * velocity * .1;
      const edge = WORLD_HALF - Math.max(Math.abs(x), Math.abs(y)) - bot.radius;
      if (edge < 85) risk += (85 - edge) * 3 / step;
      for (const o of obstacles) {
        const clearance = Math.hypot(x - o.pos.x - o.vx * t, y - o.pos.y - o.vy * t) - o.radius - bot.radius * .5;
        if (clearance < 55) risk += (55 - clearance) * (clearance < 8 ? 12 : 1) / step;
      }
    }
    return risk;
  };
  let best = goal, bestCost = Infinity, bestRisk = Infinity;
  for (const target of [goal, ...Array.from({ length: 13 }, (_, i) => bot.heading + (i - 6) * Math.PI / 6)]) {
    const risk = evaluate(target, speed);
    const cost = risk + (1 - Math.cos(target - goal)) * 22 + (1 - Math.cos(target - bot.targetAngle)) * 5;
    if (cost < bestCost) { bestCost = cost; best = target; bestRisk = risk; }
  }
  bot.targetAngle = best;
  if (bestRisk > 30) bot.aiState = 'FLEE';
  bot.boosting = bot.aiState === 'HUNT' && bot.score > BOOST_MIN_SCORE + 30
    && Math.cos(best - bot.heading) > .96 && evaluate(best, speed * 1.75) < 5;
}
