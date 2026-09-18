import { advanceJourneyPhase, createJourney, finishStage, GATES_PER_STAGE, stageProgress, STAGES, STAGE_BONUS } from "./stages";
import {
  FLAP_IMPULSE,
  GRAVITY,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MAX_DT,
  MAX_FALL_SPEED,
  PIPE_WIDTH,
  ROTATION_MAX,
  ROTATION_MIN,
  ROTATION_PER_VELOCITY,
  ROTATION_SMOOTHING,
  SPAWN_INTERVAL_DISTANCE,
  UI_PUBLISH_INTERVAL,
} from "./constants";
import { advanceRewards, createRewards, resolveRewards } from "./rewards";
import { FlapInputController } from "./input";
import { advanceObstacles, createObstacle } from "./obstacles";
import { computeLetterboxTransform, renderJump, type LetterboxTransform } from "./renderer";
import { UIStore } from "./uiStore";
import type { Obstacle, PlayerState, UISnapshot } from "./types";
import { clamp, lerp } from "../../../utils/math";

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
  private rewards = createRewards();
  private spawnSequence = 0;
  private distanceScrolled = 0;
  private journey = createJourney();
  private previousCenter = 320;
  private spawnCounter = 0;
  private flapFx = 0;
  private stageScoreStart = 0;
  private lastStageScore = 0;

  private rafId: number | null = null;
  private lastTime: number | null = null;
  private uiTimer = 0;
  private wasAlive = true;
  private paused = false;
  private bestScoreAtStart: number;
  private onDeath: (finalScore: number, cleared?: boolean) => void;

  constructor(
    canvas: HTMLCanvasElement,
    characterImageUrl: string,
    bestScore: number,
    onDeath: (finalScore: number, cleared?: boolean) => void,
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
    this.draw();
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
    if (this.paused || !this.player.alive || this.journey.completed) return;
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

    if (this.player.alive && !this.journey.completed) {
      if (this.journey.phase === 'playing') {
        advanceRewards(this.rewards, dt);
        this.stepPhysics(dt);
        this.stepWorld(dt);
        this.resolveScoringAndCollisions();
        this.stepStage();
      } else {
        this.stepTransition(dt);
      }
    }

    this.flapFx = Math.max(0, this.flapFx - dt * FLAP_FX_DECAY_PER_SEC);

    if (this.wasAlive && !this.player.alive) {
      this.wasAlive = false;
      this.onDeath(this.rewards.score);
      this.uiStore.publish(this.buildSnapshot());
    }

    this.draw();

    this.uiTimer -= dt;
    if (this.uiTimer <= 0) {
      this.uiTimer = UI_PUBLISH_INTERVAL;
      this.uiStore.publish(this.buildSnapshot());
    }
  }

  private draw(): void {
    renderJump(
      this.ctx,
      this.transform,
      this.obstacles,
      this.player,
      this.playerImage,
      this.distanceScrolled,
      this.flapFx,
      this.rewards,
      this.journey,
    );
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
    const worldDt = dt * (this.rewards.slowTime > 0 ? 0.6 : 1);
    const stage = STAGES[this.journey.stage];
    const dx = lerp(stage.speedStart, stage.speedEnd, stageProgress(this.journey)) * worldDt;
    this.distanceScrolled += dx;
    this.obstacles = advanceObstacles(this.obstacles, dx, worldDt);

    this.spawnCounter += dx;
    if (this.spawnCounter >= SPAWN_INTERVAL_DISTANCE && this.journey.spawned < GATES_PER_STAGE) {
      this.spawnCounter -= SPAWN_INTERVAL_DISTANCE;
      const gapProgress = this.journey.spawned / Math.max(1, GATES_PER_STAGE - 1);
      const gap = lerp(stage.gapStart, stage.gapEnd, gapProgress);
      const obstacle = createObstacle(LOGICAL_WIDTH + PIPE_WIDTH, gap, ++this.spawnSequence, stage.kinds[this.journey.spawned % stage.kinds.length], this.previousCenter);
      this.previousCenter = obstacle.baseCenterY;
      this.obstacles.push(obstacle);
      this.journey.spawned++;
    }
  }

  private resolveScoringAndCollisions(): void {
    resolveRewards(this.player, this.obstacles, this.rewards);
  }

  private stepStage(): void {
    if (!this.player.alive) return;
    this.journey.cleared = this.rewards.gates - this.journey.stage * GATES_PER_STAGE;
    if (!finishStage(this.journey)) return;
    this.rewards.score += STAGE_BONUS;
    this.lastStageScore = this.rewards.score - this.stageScoreStart;
    this.input.reset();
    this.uiStore.publish(this.buildSnapshot());
  }

  private stepTransition(dt: number): void {
    this.input.reset();
    const transition = advanceJourneyPhase(this.journey, dt);
    if (transition === 'next') {
      this.stageScoreStart = this.rewards.score;
      this.obstacles = [];
      this.spawnCounter = 0;
      this.previousCenter = 320;
      this.player.y = 320;
      this.player.vy = 0;
      this.player.rotation = 0;
      this.rewards.shieldTime = Math.max(this.rewards.shieldTime, 3);
    } else if (transition === 'complete') {
      this.uiStore.publish(this.buildSnapshot());
      this.onDeath(this.rewards.score, true);
      return;
    }
    if (transition !== 'none') this.uiStore.publish(this.buildSnapshot());
  }

  private buildSnapshot(): UISnapshot {
    return {
      status: this.journey.completed ? "won" : !this.player.alive ? "dead" : this.paused ? "paused" : "playing",
      score: this.rewards.score,
      stars: this.rewards.stars,
      shieldTime: this.rewards.shieldTime,
      magnetTime: this.rewards.magnetTime,
      doubleTime: this.rewards.doubleTime,
      slowTime: this.rewards.slowTime,
      hearts: this.rewards.hearts,
      stage: this.journey.stage,
      stageCleared: this.journey.cleared,
      journeyPhase: this.journey.phase,
      phaseTime: this.journey.phaseTime,
      lastStageScore: this.lastStageScore,
      bestScore: Math.max(this.bestScoreAtStart, this.rewards.score),
      finalScore: this.player.alive && !this.journey.completed ? null : this.rewards.score,
    };
  }
}
