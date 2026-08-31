import { Camera } from "./camera";
import {
  BOOST_MIN_SCORE,
  LEADERBOARD_SIZE,
  MAX_DT,
  MINIMAP_TRAIL_POINTS,
  SUBSTEP_DT_THRESHOLD,
  UI_PUBLISH_INTERVAL,
} from "./constants";
import { InputController } from "./input";
import { renderWorld } from "./renderer";
import { UIStore } from "./uiStore";
import { World } from "./world";
import type { UISnapshot } from "./types";
import { lerp, sampleEvenly } from "../../../utils/math";

const BOOST_INTENSITY_SMOOTHING = 10;

export class GameEngine {
  readonly world: World;
  readonly camera = new Camera();
  readonly uiStore = new UIStore();

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input: InputController;
  private playerImage: HTMLImageElement;

  private rafId: number | null = null;
  private lastTime: number | null = null;
  private uiTimer = 0;
  private wasPlayerAlive = true;
  private paused = false;
  private boostIntensity = 0;
  private onDeath: (finalScore: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    playerName: string,
    characterImageUrl: string,
    onDeath: (finalScore: number) => void,
    playerBodyPalette: string[] = [],
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.ctx = ctx;

    this.world = new World(playerName, playerBodyPalette);
    this.input = new InputController(canvas);
    this.onDeath = onDeath;

    this.playerImage = new Image();
    this.playerImage.src = characterImageUrl;

    if (import.meta.env.DEV) {
      (window as unknown as { __engine: GameEngine }).__engine = this;
    }

    this.uiStore.publish(this.buildSnapshot());
  }

  resize(width: number, height: number, dpr: number): void {
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera.setViewport(width, height);
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

  isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    if (this.paused || !this.world.player.alive) return;
    this.paused = true;
    this.input.reset();
    this.uiStore.publish(this.buildSnapshot());
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = null; // avoid a giant dt from time spent paused
    this.input.reset();
    this.uiStore.publish(this.buildSnapshot());
  }

  togglePause(): void {
    if (this.paused) this.resume();
    else this.pause();
  }

  /** Wired to the on-screen mobile boost button (press-and-hold). */
  setBoosting(value: boolean): void {
    this.input.setButtonBoosting(value);
  }

  private tick(now: number): void {
    if (this.lastTime === null) this.lastTime = now;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, MAX_DT);

    if (this.paused) return;

    if (this.world.player.alive) {
      const inputState = this.input.getState();
      if (dt > SUBSTEP_DT_THRESHOLD) {
        this.world.update(dt / 2, inputState);
        if (this.world.player.alive) this.world.update(dt / 2, inputState);
      } else {
        this.world.update(dt, inputState);
      }
    }

    if (this.wasPlayerAlive && !this.world.player.alive) {
      this.wasPlayerAlive = false;
      this.onDeath(Math.floor(this.world.player.score));
      this.uiStore.publish(this.buildSnapshot());
    }

    if (this.world.player.alive) {
      this.camera.follow(
        this.world.player.head,
        this.world.player.radius,
        dt,
        this.world.player.boosting,
      );
    }

    const boostTarget = this.world.player.alive && this.world.player.boosting ? 1 : 0;
    this.boostIntensity = lerp(
      this.boostIntensity,
      boostTarget,
      1 - Math.exp(-BOOST_INTENSITY_SMOOTHING * dt),
    );

    renderWorld(this.ctx, this.world, this.camera, this.playerImage, this.boostIntensity);

    this.uiTimer -= dt;
    if (this.uiTimer <= 0) {
      this.uiTimer = UI_PUBLISH_INTERVAL;
      this.uiStore.publish(this.buildSnapshot());
    }
  }

  private buildSnapshot(): UISnapshot {
    const player = this.world.player;
    const aliveSorted = [...this.world.getAliveSnakes()].sort((a, b) => b.score - a.score);
    const rank = player.alive ? aliveSorted.findIndex((s) => s.id === player.id) + 1 : 0;
    const viewRect = this.camera.getViewRect(0);

    return {
      status: !player.alive ? "dead" : this.paused ? "paused" : "playing",
      score: Math.floor(player.score),
      rank,
      totalAlive: aliveSorted.length,
      boosting: player.boosting,
      canBoost: player.score > BOOST_MIN_SCORE,
      leaderboard: this.world.getLeaderboard(LEADERBOARD_SIZE).map((s) => ({
        id: s.id,
        name: s.name,
        score: Math.floor(s.score),
        isPlayer: s.isPlayer,
      })),
      minimap: {
        worldSize: this.world.worldSize,
        player: player.alive ? { x: player.head.x, y: player.head.y } : null,
        trails: this.world
          .getAliveSnakes()
          .filter((s) => !s.isPlayer)
          .map((s) => [...sampleEvenly(s.pathHistory, MINIMAP_TRAIL_POINTS), s.head]),
        viewport: {
          x: viewRect.minX,
          y: viewRect.minY,
          w: viewRect.maxX - viewRect.minX,
          h: viewRect.maxY - viewRect.minY,
        },
      },
      finalScore: player.alive ? null : Math.floor(player.score),
    };
  }
}
