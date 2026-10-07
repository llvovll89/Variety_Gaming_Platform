import {
  BALLOONS_PER_WAVE_MAX,
  BALLOONS_PER_WAVE_START,
  GAME_DURATION_SECONDS,
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
  private ended = false;
  private timeRemaining = GAME_DURATION_SECONDS;
  private bestScoreAtStart: number;
  private muted = false;
  private keyboardPoint: { x: number; y: number } | null = null;
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
    const oldWidth = this.transform.viewportWidth / this.transform.scale;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.transform = computeLetterboxTransform(width, height);
    const newWidth = width / this.transform.scale;
    for (const balloon of this.balloons) {
      const padding = balloon.radius + 30;
      balloon.baseX = Math.max(padding, Math.min(newWidth - padding, balloon.baseX / oldWidth * newWidth));
      balloon.x = balloon.baseX;
    }
    if (this.keyboardPoint) {
      this.keyboardPoint.x = Math.min(width, this.keyboardPoint.x);
      this.keyboardPoint.y = Math.min(height, this.keyboardPoint.y);
    }
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
    if (this.paused || this.ended) return;
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

  setMuted(muted: boolean): void { this.muted = muted; }

  handleKey(key: string): void {
    if (this.paused || this.ended) return;
    const w = this.transform.viewportWidth, h = this.transform.viewportHeight;
    this.keyboardPoint ??= { x: w / 2, y: h / 2 };
    const p = this.keyboardPoint;
    if (key === "ArrowLeft") p.x = Math.max(0, p.x - 28);
    if (key === "ArrowRight") p.x = Math.min(w, p.x + 28);
    if (key === "ArrowUp") p.y = Math.max(0, p.y - 28);
    if (key === "ArrowDown") p.y = Math.min(h, p.y + 28);
    if (key === " " || key === "Enter") this.handleScreenTap(p.x, p.y);
  }

  /** Pops every balloon under a tap/click, given in canvas CSS-pixel coordinates. */
  handleScreenTap(screenX: number, screenY: number): void {
    if (this.paused || this.ended) return;
    const { x, y } = toLogical(this.transform, screenX, screenY);
    const hit = findBalloonsAtPoint(this.balloons, x, y);
    if (hit.length === 0) return;

    const hitIds = new Set(hit.map((b) => b.id));
    this.balloons = this.balloons.filter((b) => !hitIds.has(b.id));
    for (const b of hit) {
      this.popEffects.push({ x: b.x, y: b.y, hue: b.hue, age: 0 });
      this.score += 1;
    }
    if (!this.muted) this.popSound.playPop(randRange(0.9, 1.15));
    this.uiStore.publish(this.buildSnapshot());
  }

  private tick(now: number): void {
    if (this.lastTime === null) this.lastTime = now;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, MAX_DT);

    if (this.paused) return;

    this.decorTime += dt;

    if (!this.ended) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.ended = true;
        this.uiStore.publish(this.buildSnapshot());
      } else {
        this.stepWorld(dt);
        this.stepDifficulty(dt);
      }
    }
    this.advancePopEffects(dt);

    renderBalloons(this.ctx, this.transform, this.balloons, this.popEffects, this.mascotImage, this.reducedMotion.matches ? 0 : this.decorTime, this.reducedMotion.matches);
    if (this.keyboardPoint) {
      const { x, y } = this.keyboardPoint;
      this.ctx.strokeStyle = "#183b56"; this.ctx.lineWidth = 3;
      this.ctx.beginPath(); this.ctx.arc(x, y, 15, 0, Math.PI * 2); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(x - 22, y); this.ctx.lineTo(x + 22, y);
      this.ctx.moveTo(x, y - 22); this.ctx.lineTo(x, y + 22); this.ctx.stroke();
    }

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
      const widthMultiplier = Math.min(3, Math.max(1, this.transform.viewportWidth / this.transform.scale / 420));
      const count = Math.ceil(randInt(1, this.balloonsPerWave) * widthMultiplier);
      for (let i = 0; i < count; i++) this.balloons.push(spawnBalloon(this.riseSpeed, this.transform.viewportWidth / this.transform.scale));
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
      status: this.ended ? "gameover" : this.paused ? "paused" : "playing",
      score: this.score,
      bestScore: Math.max(this.bestScoreAtStart, this.score),
      timeRemaining: this.timeRemaining,
      finalScore: this.ended ? this.score : null,
    };
  }
}
