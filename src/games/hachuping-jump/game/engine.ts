import {
  FLAP_IMPULSE,
  GAP_HEIGHT_MIN,
  GAP_HEIGHT_START,
  GAP_SHRINK_PER_RAMP,
  GRAVITY,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MAX_DT,
  MAX_FALL_SPEED,
  PIPE_WIDTH,
  PLAYER_X,
  RAMP_INTERVAL_MAX,
  RAMP_INTERVAL_MIN,
  ROTATION_MAX,
  ROTATION_MIN,
  ROTATION_PER_VELOCITY,
  ROTATION_SMOOTHING,
  SCROLL_SPEED_BASE,
  SCROLL_SPEED_INCREMENT_MAX,
  SCROLL_SPEED_INCREMENT_MIN,
  SCROLL_SPEED_MAX,
  SPAWN_INTERVAL_DISTANCE,
  STAR_BONUS_SCORE,
  UI_PUBLISH_INTERVAL,
} from "./constants";
import { hitsGroundOrCeiling, hitsObstacle } from "./collision";
import { FlapInputController } from "./input";
import { advanceObstacles, createObstacle } from "./obstacles";
import { computeLetterboxTransform, renderJump, type LetterboxTransform } from "./renderer";
import { hitsStar } from "./star";
import { UIStore } from "./uiStore";
import type { Obstacle, PlayerState, UISnapshot } from "./types";
import { clamp, lerp, randRange } from "../../../utils/math";

const FLAP_FX_DECAY_PER_SEC = 2.5;

export class JumpEngine {
  readonly uiStore = new UIStore();

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: FlapInputController;
  private playerImage: HTMLImageElement;
  private transform: LetterboxTransform = computeLetterboxTransform(1, 1);

  private player: PlayerState = { y: LOGICAL_HEIGHT / 2, vy: 0, rotation: 0, alive: true };
  private obstacles: Obstacle[] = [];
  private score = 0;
  private distanceScrolled = 0;
  private scrollSpeed = SCROLL_SPEED_BASE;
  private currentGapHeight = GAP_HEIGHT_START;
  private spawnCounter = 0;
  private rampTimer = randRange(RAMP_INTERVAL_MIN, RAMP_INTERVAL_MAX);
  private flapFx = 0;

  private rafId: number | null = null;
  private lastTime: number | null = null;
  private uiTimer = 0;
  private wasAlive = true;
  private paused = false;
  private bestScoreAtStart: number;
  private onDeath: (finalScore: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    characterImageUrl: string,
    bestScore: number,
    onDeath: (finalScore: number) => void,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    this.input = new FlapInputController(canvas);
    this.bestScoreAtStart = bestScore;
    this.onDeath = onDeath;

    this.playerImage = new Image();
    this.playerImage.src = characterImageUrl;

    if (import.meta.env.DEV) {
      (window as unknown as { __jumpEngine: JumpEngine }).__jumpEngine = this;
    }

    this.uiStore.publish(this.buildSnapshot());
  }

  resize(width: number, height: number, dpr: number): void {
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.transform = computeLetterboxTransform(width, height);
  }

  start(): void {
    if (this.rafId !== null) return;
    this.lastTime = null;
    const loop = (now: number): void => {
      this.rafId = requestAnimationFrame(loop);
      this.tick(now);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.input.destroy();
  }

  pause(): void {
    if (this.paused || !this.player.alive) return;
    this.paused = true;
    this.input.reset();
    this.uiStore.publish(this.buildSnapshot());
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = null;
    this.input.reset();
    this.uiStore.publish(this.buildSnapshot());
  }

  togglePause(): void {
    if (this.paused) this.resume();
    else this.pause();
  }

  private tick(now: number): void {
    if (this.lastTime === null) this.lastTime = now;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, MAX_DT);

    if (this.paused) return;

    if (this.player.alive) {
      this.stepPhysics(dt);
      this.stepWorld(dt);
      this.resolveScoringAndCollisions();
      this.stepDifficulty(dt);
    }

    this.flapFx = Math.max(0, this.flapFx - dt * FLAP_FX_DECAY_PER_SEC);

    if (this.wasAlive && !this.player.alive) {
      this.wasAlive = false;
      this.onDeath(this.score);
      this.uiStore.publish(this.buildSnapshot());
    }

    renderJump(
      this.ctx,
      this.transform,
      this.obstacles,
      this.player,
      this.playerImage,
      this.distanceScrolled,
      this.flapFx,
    );

    this.uiTimer -= dt;
    if (this.uiTimer <= 0) {
      this.uiTimer = UI_PUBLISH_INTERVAL;
      this.uiStore.publish(this.buildSnapshot());
    }
  }

  private stepPhysics(dt: number): void {
    const flapped = this.input.consumeFlap();
    if (flapped) {
      this.player.vy = FLAP_IMPULSE;
      this.player.rotation = ROTATION_MIN;
      this.flapFx = 1;
    } else {
      this.player.vy = Math.min(this.player.vy + GRAVITY * dt, MAX_FALL_SPEED);
      const target = clamp(this.player.vy * ROTATION_PER_VELOCITY, ROTATION_MIN, ROTATION_MAX);
      this.player.rotation = lerp(this.player.rotation, target, 1 - Math.exp(-ROTATION_SMOOTHING * dt));
    }
    this.player.y += this.player.vy * dt;
  }

  private stepWorld(dt: number): void {
    const dx = this.scrollSpeed * dt;
    this.distanceScrolled += dx;
    this.obstacles = advanceObstacles(this.obstacles, dx);

    this.spawnCounter += dx;
    if (this.spawnCounter >= SPAWN_INTERVAL_DISTANCE) {
      this.spawnCounter -= SPAWN_INTERVAL_DISTANCE;
      this.obstacles.push(createObstacle(LOGICAL_WIDTH + PIPE_WIDTH, this.currentGapHeight));
    }
  }

  private resolveScoringAndCollisions(): void {
    let dead = hitsGroundOrCeiling(this.player.y);

    for (const obstacle of this.obstacles) {
      if (!obstacle.passed && obstacle.x + PIPE_WIDTH / 2 < PLAYER_X) {
        obstacle.passed = true;
        this.score += 1;
      }
      if (hitsStar(this.player.y, obstacle)) {
        obstacle.star!.collected = true;
        this.score += STAR_BONUS_SCORE;
      }
      if (!dead && hitsObstacle(this.player.y, obstacle)) {
        dead = true;
      }
    }

    if (dead) this.player.alive = false;
  }

  private stepDifficulty(dt: number): void {
    this.rampTimer -= dt;
    if (this.rampTimer > 0) return;
    this.rampTimer = randRange(RAMP_INTERVAL_MIN, RAMP_INTERVAL_MAX);
    this.scrollSpeed = Math.min(
      SCROLL_SPEED_MAX,
      this.scrollSpeed + randRange(SCROLL_SPEED_INCREMENT_MIN, SCROLL_SPEED_INCREMENT_MAX),
    );
    this.currentGapHeight = Math.max(GAP_HEIGHT_MIN, this.currentGapHeight - GAP_SHRINK_PER_RAMP);
  }

  private buildSnapshot(): UISnapshot {
    return {
      status: !this.player.alive ? "dead" : this.paused ? "paused" : "playing",
      score: this.score,
      bestScore: Math.max(this.bestScoreAtStart, this.score),
      finalScore: this.player.alive ? null : this.score,
    };
  }
}
