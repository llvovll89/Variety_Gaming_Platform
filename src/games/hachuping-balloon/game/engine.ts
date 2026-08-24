import {
  BALLOONS_PER_WAVE_MAX,
  BALLOONS_PER_WAVE_START,
  MAX_DT,
  POP_EFFECT_LIFETIME,
  RAMP_INTERVAL_MAX,
  RAMP_INTERVAL_MIN,
  RAMP_TICKS_PER_WAVE_BUMP,
  RISE_SPEED_INCREMENT_MAX,
  RISE_SPEED_INCREMENT_MIN,
  RISE_SPEED_MAX,
  RISE_SPEED_START,
  SPAWN_INTERVAL_JITTER_MAX,
  SPAWN_INTERVAL_JITTER_MIN,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_SHRINK_MAX,
  SPAWN_INTERVAL_SHRINK_MIN,
  SPAWN_INTERVAL_START,
  UI_PUBLISH_INTERVAL,
} from "./constants";
import { advanceBalloons, findBalloonsAtPoint, spawnBalloon } from "./balloons";
import { computeLetterboxTransform, renderBalloons, toLogical, type LetterboxTransform } from "./renderer";
import { PopSoundPlayer } from "./sound";
import { UIStore } from "./uiStore";
import type { Balloon, PopEffect, UISnapshot } from "./types";
import { randInt, randRange } from "../../../utils/math";

export class BalloonEngine {
  readonly uiStore = new UIStore();

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mascotImage: HTMLImageElement;
  private popSound = new PopSoundPlayer();
  private transform: LetterboxTransform = computeLetterboxTransform(1, 1);

  private balloons: Balloon[] = [];
  private popEffects: PopEffect[] = [];
  private score = 0;
  private riseSpeed = RISE_SPEED_START;
  private spawnInterval = SPAWN_INTERVAL_START;
  private balloonsPerWave = BALLOONS_PER_WAVE_START;
  private spawnTimer = SPAWN_INTERVAL_START;
  private rampTimer = randRange(RAMP_INTERVAL_MIN, RAMP_INTERVAL_MAX);
  private rampTickCount = 0;
  private decorTime = 0;

  private rafId: number | null = null;
  private lastTime: number | null = null;
  private uiTimer = 0;
  private paused = false;
  private bestScoreAtStart: number;

  constructor(canvas: HTMLCanvasElement, characterImageUrl: string, bestScore: number) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    this.bestScoreAtStart = bestScore;

    this.mascotImage = new Image();
    this.mascotImage.src = characterImageUrl;

    if (import.meta.env.DEV) {
      (window as unknown as { __balloonEngine: BalloonEngine }).__balloonEngine = this;
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
    this.popSound.destroy();
  }

  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.uiStore.publish(this.buildSnapshot());
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = null;
    this.uiStore.publish(this.buildSnapshot());
  }

  togglePause(): void {
    if (this.paused) this.resume();
    else this.pause();
  }

  /** Pops every balloon under a tap/click, given in canvas CSS-pixel coordinates. */
  handleScreenTap(screenX: number, screenY: number): void {
    if (this.paused) return;
    const { x, y } = toLogical(this.transform, screenX, screenY);
    const hit = findBalloonsAtPoint(this.balloons, x, y);
    if (hit.length === 0) return;

    const hitIds = new Set(hit.map((b) => b.id));
    this.balloons = this.balloons.filter((b) => !hitIds.has(b.id));
    for (const b of hit) {
      this.popEffects.push({ x: b.x, y: b.y, hue: b.hue, age: 0 });
      this.score += 1;
    }
    this.popSound.playPop(randRange(0.9, 1.15));
    this.uiStore.publish(this.buildSnapshot());
  }

  private tick(now: number): void {
    if (this.lastTime === null) this.lastTime = now;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, MAX_DT);

    if (this.paused) return;

    this.decorTime += dt;
    this.stepWorld(dt);
    this.stepDifficulty(dt);
    this.advancePopEffects(dt);

    renderBalloons(this.ctx, this.transform, this.balloons, this.popEffects, this.mascotImage, this.decorTime);

    this.uiTimer -= dt;
    if (this.uiTimer <= 0) {
      this.uiTimer = UI_PUBLISH_INTERVAL;
      this.uiStore.publish(this.buildSnapshot());
    }
  }

  private stepWorld(dt: number): void {
    this.balloons = advanceBalloons(this.balloons, dt);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.spawnInterval * randRange(SPAWN_INTERVAL_JITTER_MIN, SPAWN_INTERVAL_JITTER_MAX);
      const count = randInt(1, this.balloonsPerWave);
      for (let i = 0; i < count; i++) this.balloons.push(spawnBalloon(this.riseSpeed));
    }
  }

  private advancePopEffects(dt: number): void {
    for (const effect of this.popEffects) effect.age += dt;
    this.popEffects = this.popEffects.filter((effect) => effect.age < POP_EFFECT_LIFETIME);
  }

  private stepDifficulty(dt: number): void {
    this.rampTimer -= dt;
    if (this.rampTimer > 0) return;
    this.rampTimer = randRange(RAMP_INTERVAL_MIN, RAMP_INTERVAL_MAX);
    this.riseSpeed = Math.min(
      RISE_SPEED_MAX,
      this.riseSpeed + randRange(RISE_SPEED_INCREMENT_MIN, RISE_SPEED_INCREMENT_MAX),
    );
    this.spawnInterval = Math.max(
      SPAWN_INTERVAL_MIN,
      this.spawnInterval - randRange(SPAWN_INTERVAL_SHRINK_MIN, SPAWN_INTERVAL_SHRINK_MAX),
    );
    this.rampTickCount += 1;
    if (this.rampTickCount % RAMP_TICKS_PER_WAVE_BUMP === 0) {
      this.balloonsPerWave = Math.min(BALLOONS_PER_WAVE_MAX, this.balloonsPerWave + 1);
    }
  }

  private buildSnapshot(): UISnapshot {
    return {
      status: this.paused ? "paused" : "playing",
      score: this.score,
      bestScore: Math.max(this.bestScoreAtStart, this.score),
    };
  }
}
