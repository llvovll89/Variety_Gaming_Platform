import {
  BOT_GROWTH_AMOUNT_MAX,
  BOT_GROWTH_AMOUNT_MIN,
  BOT_GROWTH_INTERVAL_MAX,
  BOT_GROWTH_INTERVAL_MIN,
  BOT_MIN_SPAWN_DISTANCE_FROM_PLAYER,
  BOT_RESPAWN_DELAY,
  BOT_TARGET_COUNT_INITIAL,
  BOT_TARGET_COUNT_MAX,
  DEATH_DROP_SCATTER_RADIUS,
  DEATH_DROP_STAR_VALUE,
  STAR_MAX_VALUE,
  STAR_MIN_RADIUS,
  STAR_RADIUS_PER_VALUE,
  STAR_TARGET_COUNT,
  START_SCORE,
  WALL_KILL_MARGIN,
  WORLD_HALF,
  WORLD_SIZE,
  SNAKE_NAME_POOL,
} from "./constants";
import {
  buildSegmentGrid,
  findBodyCollisions,
  findHeadOnCollisions,
  findStarPickups,
  resolveDeaths,
  type DeathEvent,
} from "./collision";
import { updateBotAI } from "./botAI";
import { dropCountForScore } from "./growth";
import { SpatialHashGrid } from "./spatialGrid";
import { createSnake, stepSnake } from "./snake";
import { createRandomStar, createStar } from "./star";
import type { Snake, Star } from "./types";
import { distance, randInt, randRange } from "../../../utils/math";

const MAX_STAR_RADIUS = STAR_MIN_RADIUS + STAR_MAX_VALUE * STAR_RADIUS_PER_VALUE;

export interface DeathInfo {
  snake: Snake;
  killerName: string | null;
}

export class World {
  readonly worldSize = WORLD_SIZE;
  snakes: Snake[] = [];
  player: Snake;

  private stars = new Map<number, Star>();
  private starGrid = new SpatialHashGrid<Star>(140);
  private pendingBotRespawns = 0;
  private botNameCursor = 0;
  private botTargetCount = BOT_TARGET_COUNT_INITIAL;
  private botGrowthTimer = randRange(BOT_GROWTH_INTERVAL_MIN, BOT_GROWTH_INTERVAL_MAX);

  lastDeaths: DeathInfo[] = [];

  constructor(playerName: string, playerBodyPalette: string[] = []) {
    this.player = createSnake(
      true,
      playerName || "하츄핑",
      0,
      0,
      330,
      START_SCORE,
      playerBodyPalette,
    );
    this.snakes.push(this.player);

    for (let i = 0; i < STAR_TARGET_COUNT; i++) {
      this.addStar(createRandomStar());
    }
    for (let i = 0; i < this.botTargetCount; i++) {
      this.spawnBot();
    }
  }

  respawnPlayer(name: string): void {
    const spot = this.randomSpawnSpot();
    this.player.alive = true;
    this.player.name = name || this.player.name;
    this.player.score = START_SCORE;
    this.player.head = { x: spot.x, y: spot.y };
    this.player.pathHistory = [{ x: spot.x, y: spot.y }];
    this.player.heading = Math.random() * Math.PI * 2;
    this.player.targetAngle = this.player.heading;
    this.player.boosting = false;
  }

  private randomSpawnSpot(avoidPlayer = false): { x: number; y: number } {
    for (let attempt = 0; attempt < 20; attempt++) {
      const x = randRange(-WORLD_HALF + 200, WORLD_HALF - 200);
      const y = randRange(-WORLD_HALF + 200, WORLD_HALF - 200);
      if (!avoidPlayer || !this.player.alive) return { x, y };
      if (distance({ x, y }, this.player.head) >= BOT_MIN_SPAWN_DISTANCE_FROM_PLAYER) {
        return { x, y };
      }
    }
    return { x: randRange(-WORLD_HALF, WORLD_HALF), y: randRange(-WORLD_HALF, WORLD_HALF) };
  }

  private spawnBot(): void {
    const spot = this.randomSpawnSpot(true);
    const name = SNAKE_NAME_POOL[this.botNameCursor % SNAKE_NAME_POOL.length];
    this.botNameCursor++;
    const hue = Math.floor(randRange(0, 360));
    const bot = createSnake(false, name, spot.x, spot.y, hue, randInt(START_SCORE, START_SCORE * 3));
    this.snakes.push(bot);
  }

  private addStar(star: Star): void {
    this.stars.set(star.id, star);
    this.starGrid.insert(star.id, star.pos.x, star.pos.y, star);
  }

  private removeStar(id: number): void {
    this.stars.delete(id);
    this.starGrid.remove(id);
  }

  private findNearestStar = (pos: { x: number; y: number }, radius: number): Star | null => {
    const candidates = this.starGrid.queryRadius(pos.x, pos.y, radius);
    let best: Star | null = null;
    let bestDist = Infinity;
    for (const entry of candidates) {
      const d = distance(pos, { x: entry.x, y: entry.y });
      if (d < bestDist) {
        bestDist = d;
        best = entry.data;
      }
    }
    return best;
  };

  private scatterDeathStars(victim: Snake): void {
    const count = dropCountForScore(victim.score);
    const points = [victim.head, ...victim.pathHistory];
    for (let i = 0; i < count; i++) {
      const p = points[Math.floor((i / count) * points.length)] ?? victim.head;
      const jitterX = randRange(-DEATH_DROP_SCATTER_RADIUS, DEATH_DROP_SCATTER_RADIUS);
      const jitterY = randRange(-DEATH_DROP_SCATTER_RADIUS, DEATH_DROP_SCATTER_RADIUS);
      this.addStar(createStar(p.x + jitterX, p.y + jitterY, DEATH_DROP_STAR_VALUE));
    }
  }

  private checkWallDeaths(): DeathEvent[] {
    const events: DeathEvent[] = [];
    for (const snake of this.snakes) {
      if (!snake.alive) continue;
      const limit = WORLD_HALF - WALL_KILL_MARGIN;
      if (Math.abs(snake.head.x) > limit || Math.abs(snake.head.y) > limit) {
        events.push({ victimId: snake.id, killerId: null });
      }
    }
    return events;
  }

  update(dt: number, playerInput: { angle: number; boosting: boolean }): void {
    this.lastDeaths = [];

    if (this.player.alive) {
      this.player.targetAngle = playerInput.angle;
      const result = stepSnake(this.player, dt, playerInput.boosting);
      if (result.boostTrailAt) {
        this.addStar(createStar(result.boostTrailAt.x, result.boostTrailAt.y, 1));
      }
    }

    for (const bot of this.snakes) {
      if (bot.isPlayer || !bot.alive) continue;
      updateBotAI(bot, dt, { findNearestStar: this.findNearestStar, snakes: this.snakes });
      const result = stepSnake(bot, dt, false);
      if (result.boostTrailAt) {
        this.addStar(createStar(result.boostTrailAt.x, result.boostTrailAt.y, 1));
      }
    }

    const aliveSnakes = this.snakes.filter((s) => s.alive);

    const pickups = findStarPickups(aliveSnakes, this.starGrid, MAX_STAR_RADIUS);
    const byId = new Map(this.snakes.map((s) => [s.id, s]));
    for (const pickup of pickups) {
      const snake = byId.get(pickup.snakeId);
      const star = this.stars.get(pickup.starId);
      if (!snake || !star) continue;
      snake.score += star.value;
      this.removeStar(pickup.starId);
    }

    const segmentGrid = buildSegmentGrid(aliveSnakes);
    const bodyEvents = findBodyCollisions(aliveSnakes, segmentGrid);
    const headOnEvents = findHeadOnCollisions(aliveSnakes);
    const wallEvents = this.checkWallDeaths();
    const deaths = resolveDeaths([...wallEvents, ...bodyEvents, ...headOnEvents]);

    for (const death of deaths) {
      const victim = byId.get(death.victimId);
      if (!victim || !victim.alive) continue;
      victim.alive = false;
      const killer = death.killerId !== null ? byId.get(death.killerId) ?? null : null;
      this.lastDeaths.push({ snake: victim, killerName: killer?.name ?? null });
      this.scatterDeathStars(victim);
      if (!victim.isPlayer) {
        this.pendingBotRespawns++;
      }
    }

    if (deaths.length > 0) {
      this.snakes = this.snakes.filter((s) => s.alive || s.isPlayer);
    }

    this.maintainStarPopulation();
    this.updateBotGrowth(dt);
    this.maintainBotPopulation(dt);
  }

  private botRespawnTimer = 0;

  /** The pack of rival snakes slowly grows over the course of a session, at random
   * intervals, up to a cap — rather than staying fixed at the initial count forever. */
  private updateBotGrowth(dt: number): void {
    if (this.botTargetCount >= BOT_TARGET_COUNT_MAX) return;
    this.botGrowthTimer -= dt;
    if (this.botGrowthTimer <= 0) {
      this.botGrowthTimer = randRange(BOT_GROWTH_INTERVAL_MIN, BOT_GROWTH_INTERVAL_MAX);
      const amount = randInt(BOT_GROWTH_AMOUNT_MIN, BOT_GROWTH_AMOUNT_MAX);
      this.botTargetCount = Math.min(BOT_TARGET_COUNT_MAX, this.botTargetCount + amount);
    }
  }

  private maintainBotPopulation(dt: number): void {
    const aliveBots = this.snakes.filter((s) => !s.isPlayer && s.alive).length;
    const deficit = this.botTargetCount - aliveBots - this.pendingBotRespawns;
    if (this.pendingBotRespawns > 0) {
      this.botRespawnTimer -= dt;
      if (this.botRespawnTimer <= 0) {
        this.botRespawnTimer = BOT_RESPAWN_DELAY;
        this.spawnBot();
        this.pendingBotRespawns--;
      }
    } else if (deficit > 0) {
      for (let i = 0; i < deficit; i++) this.spawnBot();
    }
  }

  private maintainStarPopulation(): void {
    while (this.stars.size < STAR_TARGET_COUNT) {
      this.addStar(createRandomStar());
    }
  }

  getAliveSnakes(): Snake[] {
    return this.snakes.filter((s) => s.alive);
  }

  getStarsInRect(minX: number, minY: number, maxX: number, maxY: number): Star[] {
    return this.starGrid.queryRect(minX, minY, maxX, maxY).map((e) => e.data);
  }

  getLeaderboard(n: number): Snake[] {
    return [...this.getAliveSnakes()].sort((a, b) => b.score - a.score).slice(0, n);
  }
}
