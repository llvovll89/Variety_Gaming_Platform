import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MAX_DT,
  MOVE_ACCEL_RATE,
  MOVE_MAX_SPEED,
  ORBS_PER_WAVE_MAX,
  ORBS_PER_WAVE_START,
  ORB_SPEED_BASE,
  ORB_SPEED_INCREMENT_MAX,
  ORB_SPEED_INCREMENT_MIN,
  ORB_SPEED_MAX,
  ORB_DODGE_BONUS,
  PLAYER_HITBOX_RADIUS,
  RAMP_INTERVAL_MAX,
  RAMP_INTERVAL_MIN,
  RAMP_TICKS_PER_WAVE_BUMP,
  SCORE_PER_SECOND,
  SPAWN_INTERVAL_JITTER_MAX,
  SPAWN_INTERVAL_JITTER_MIN,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_SHRINK_MAX,
  SPAWN_INTERVAL_SHRINK_MIN,
  SPAWN_INTERVAL_START,
  STAR_BONUS_SCORE,
  STAR_LIFETIME,
  STAR_SPAWN_INTERVAL_MAX,
  STAR_SPAWN_INTERVAL_MIN,
  UI_PUBLISH_INTERVAL,
  JOYSTICK_MAX_RADIUS,
} from "./constants";
import { hitsOrb } from "./collision";
import { DodgeInputController } from "./input";
import { advanceOrbs, spawnOrb } from "./orbs";
import { computeLetterboxTransform, renderDodge, type LetterboxTransform } from "./renderer";
import { hitsStar, spawnStar } from "./star";
import { UIStore } from "./uiStore";
import type { BonusStar, Orb, PlayerState, UISnapshot } from "./types";
import { clamp, lerp, randRange } from "../../../utils/math";

export class DodgeEngine {
  readonly uiStore = new UIStore();

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: DodgeInputController;
  private playerImage: HTMLImageElement;
  private transform: LetterboxTransform = computeLetterboxTransform(1, 1);

  private player: PlayerState = { x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT / 2, vx: 0, vy: 0, alive: true };
  private orbs: Orb[] = [];
  private star: BonusStar | null = null;
  private score = 0;
  private timeAlive = 0;
  private orbSpeed = ORB_SPEED_BASE;
  private spawnInterval = SPAWN_INTERVAL_START;
  private orbsPerWave = ORBS_PER_WAVE_START;
  private spawnTimer = SPAWN_INTERVAL_START;
  private starTimer = randRange(STAR_SPAWN_INTERVAL_MIN, STAR_SPAWN_INTERVAL_MAX);
  private rampTimer = randRange(RAMP_INTERVAL_MIN, RAMP_INTERVAL_MAX);
  private rampTickCount = 0;
  private decorTime = 0; // drives background twinkle/glow animation, independent of survival

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

    this.input = new DodgeInputController(canvas);
    this.bestScoreAtStart = bestScore;
    this.onDeath = onDeath;

    this.playerImage = new Image();
    this.playerImage.src = characterImageUrl;

    if (import.meta.env.DEV) {
      (window as unknown as { __dodgeEngine: DodgeEngine }).__dodgeEngine = this;
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

    this.decorTime += dt;

    if (this.player.alive) {
      this.stepPhysics(dt);
      this.stepWorld(dt);
      this.resolveScoringAndCollisions();
      this.stepDifficulty(dt);
    }

    if (this.wasAlive && !this.player.alive) {
      this.wasAlive = false;
      this.onDeath(Math.floor(this.score));
      this.uiStore.publish(this.buildSnapshot());
    }

    renderDodge(
      this.ctx,
      this.transform,
      this.orbs,
      this.star,
      this.player,
      this.playerImage,
      this.input.getJoystickVisual(),
      JOYSTICK_MAX_RADIUS,
      this.decorTime,
    );

    this.uiTimer -= dt;
    if (this.uiTimer <= 0) {
      this.uiTimer = UI_PUBLISH_INTERVAL;
      this.uiStore.publish(this.buildSnapshot());
    }
  }

  private stepPhysics(dt: number): void {
    const moveDir = this.input.getMoveVector();
    const targetVx = moveDir.x * MOVE_MAX_SPEED;
    const targetVy = moveDir.y * MOVE_MAX_SPEED;
    const smoothing = 1 - Math.exp(-MOVE_ACCEL_RATE * dt);
    this.player.vx = lerp(this.player.vx, targetVx, smoothing);
    this.player.vy = lerp(this.player.vy, targetVy, smoothing);
    this.player.x = clamp(
      this.player.x + this.player.vx * dt,
      PLAYER_HITBOX_RADIUS,
      LOGICAL_WIDTH - PLAYER_HITBOX_RADIUS,
    );
    this.player.y = clamp(
      this.player.y + this.player.vy * dt,
      PLAYER_HITBOX_RADIUS,
      LOGICAL_HEIGHT - PLAYER_HITBOX_RADIUS,
    );
  }

  private stepWorld(dt: number): void {
    this.timeAlive += dt;
    this.score += SCORE_PER_SECOND * dt;

    const beforeIds = new Set(this.orbs.map((o) => o.id));
    this.orbs = advanceOrbs(this.orbs, dt);
    for (const id of beforeIds) {
      if (!this.orbs.some((o) => o.id === id)) this.score += ORB_DODGE_BONUS;
    }

    this.stepStar(dt);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval * randRange(SPAWN_INTERVAL_JITTER_MIN, SPAWN_INTERVAL_JITTER_MAX);
      for (let i = 0; i < this.orbsPerWave; i++) this.orbs.push(spawnOrb(this.orbSpeed));
    }
  }

  private stepStar(dt: number): void {
    if (this.star) {
      this.star.age += dt;
      if (this.star.age > STAR_LIFETIME) {
        this.star = null;
        this.starTimer = randRange(STAR_SPAWN_INTERVAL_MIN, STAR_SPAWN_INTERVAL_MAX);
      }
      return;
    }
    this.starTimer -= dt;
    if (this.starTimer <= 0) {
      this.star = spawnStar(this.player);
    }
  }

  private resolveScoringAndCollisions(): void {
    let dead = false;
    for (const orb of this.orbs) {
      if (hitsOrb(this.player, orb)) {
        dead = true;
        break;
      }
    }

    if (!dead && this.star && hitsStar(this.player, this.star)) {
      this.score += STAR_BONUS_SCORE;
      this.star = null;
      this.starTimer = randRange(STAR_SPAWN_INTERVAL_MIN, STAR_SPAWN_INTERVAL_MAX);
    }

    if (dead) this.player.alive = false;
  }

  private stepDifficulty(dt: number): void {
    this.rampTimer -= dt;
    if (this.rampTimer > 0) return;
    this.rampTimer = randRange(RAMP_INTERVAL_MIN, RAMP_INTERVAL_MAX);
    this.orbSpeed = Math.min(
      ORB_SPEED_MAX,
      this.orbSpeed + randRange(ORB_SPEED_INCREMENT_MIN, ORB_SPEED_INCREMENT_MAX),
    );
    this.spawnInterval = Math.max(
      SPAWN_INTERVAL_MIN,
      this.spawnInterval - randRange(SPAWN_INTERVAL_SHRINK_MIN, SPAWN_INTERVAL_SHRINK_MAX),
    );
    this.rampTickCount += 1;
    if (this.rampTickCount % RAMP_TICKS_PER_WAVE_BUMP === 0) {
      this.orbsPerWave = Math.min(ORBS_PER_WAVE_MAX, this.orbsPerWave + 1);
    }
  }

  private buildSnapshot(): UISnapshot {
    const score = Math.floor(this.score);
    return {
      status: !this.player.alive ? "dead" : this.paused ? "paused" : "playing",
      score,
      timeAlive: Math.floor(this.timeAlive),
      bestScore: Math.max(this.bestScoreAtStart, score),
      finalScore: this.player.alive ? null : score,
    };
  }
}
