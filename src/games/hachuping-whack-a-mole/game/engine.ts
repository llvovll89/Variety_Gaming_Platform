import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  MOLE_GRID_COLS,
  MOLE_GRID_ROWS,
  GAME_TOTAL_TIME,
  POINTS_PER_HIT,
  HIT_FLASH_DURATION,
  HOLE_SPACING_X,
  HOLE_SPACING_Y,
  MOLE_PADDING_X,
  MOLE_PADDING_Y,
  DIFFICULTY_CONFIGS,
  DEFAULT_DIFFICULTY,
  type DifficultyLevel,
} from "./constants";
import { UIStore } from "./uiStore";
import type { GameState, Mole, UISnapshot } from "./types";
import { playHitSound, playGameOverSound } from "./sound";

export class WhackAMoleEngine {
  readonly uiStore = new UIStore();

  private gameState: GameState;
  private moleHitTimers: Map<number, number> = new Map(); // moleId -> flash timer
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private paused = false;
  private bestScoreAtStart: number;
  private onGameOver: (finalScore: number) => void;
  private uiTimer = 0;
  private UI_PUBLISH_INTERVAL = 0.016; // ~60fps
  private difficulty: DifficultyLevel = DEFAULT_DIFFICULTY;

  constructor(
    bestScore: number,
    onGameOver: (finalScore: number) => void,
    difficulty: DifficultyLevel = DEFAULT_DIFFICULTY,
  ) {
    this.bestScoreAtStart = bestScore;
    this.onGameOver = onGameOver;
    this.difficulty = difficulty;
    this.gameState = this.initializeGameState();
    this.updateUI();
  }

  private initializeGameState(): GameState {
    const moles: Mole[] = [];
    for (let y = 0; y < MOLE_GRID_ROWS; y++) {
      for (let x = 0; x < MOLE_GRID_COLS; x++) {
        moles.push({
          id: y * MOLE_GRID_COLS + x,
          gridX: x,
          gridY: y,
          isActive: false,
          activeSince: 0,
        });
      }
    }

    return {
      status: "idle",
      score: 0,
      timeRemaining: GAME_TOTAL_TIME,
      round: 1,
      moles,
      totalMolesHit: 0,
      gameOver: false,
      finalScore: null,
      difficulty: this.difficulty,
    };
  }

  startGame = (): void => {
    this.gameState = this.initializeGameState();
    this.gameState.status = "playing";
    this.gameState.timeRemaining = GAME_TOTAL_TIME;
    this.moleHitTimers.clear();
    this.uiTimer = 0;
    this.lastTime = null;
    this.updateUI();
    this.rafId = requestAnimationFrame(this.gameLoop);
  };

  pauseGame = (): void => {
    this.paused = true;
    this.gameState.status = "paused";
    this.updateUI();
  };

  resumeGame = (): void => {
    this.paused = false;
    this.gameState.status = "playing";
    this.lastTime = null; // Reset lastTime to avoid large dt
    this.rafId = requestAnimationFrame(this.gameLoop);
    this.updateUI();
  };

  endGame = (): void => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.gameState.status = "game-over";
    this.gameState.gameOver = true;
    this.gameState.finalScore = this.gameState.score;
    playGameOverSound();
    this.updateUI();
    this.onGameOver(this.gameState.score);
  };

  hitMole = (moleId: number): void => {
    if (this.gameState.status !== "playing" || this.gameState.gameOver) return;

    const mole = this.gameState.moles.find((m) => m.id === moleId);
    if (!mole || !mole.isActive) return;

    // Award points and register hit
    this.gameState.score += POINTS_PER_HIT;
    this.gameState.totalMolesHit++;

    // Deactivate mole
    mole.isActive = false;

    // Start flash animation
    this.moleHitTimers.set(moleId, HIT_FLASH_DURATION);

    // Play hit sound
    playHitSound();

    this.updateUI();
  };

  private gameLoop = (now: number): void => {
    if (this.paused) {
      this.rafId = requestAnimationFrame(this.gameLoop);
      return;
    }

    // Calculate delta time
    let dt = 0.016; // default to ~60fps
    if (this.lastTime !== null) {
      dt = Math.min((now - this.lastTime) / 1000, 0.05); // Cap at 50ms to prevent large jumps
    }
    this.lastTime = now;

    // Update game state
    this.update(dt);

    // Continue loop
    this.rafId = requestAnimationFrame(this.gameLoop);
  };

  private update = (dt: number): void => {
    if (this.gameState.status !== "playing") return;

    // Decrease time remaining
    this.gameState.timeRemaining -= dt;
    if (this.gameState.timeRemaining <= 0) {
      this.gameState.timeRemaining = 0;
      this.endGame();
      return;
    }

    // Update round based on time remaining
    this.updateRound();

    // Update mole timers and hit flash animations
    this.updateMoles(dt);

    // Update hit flash timers
    for (const [moleId, timer] of this.moleHitTimers) {
      this.moleHitTimers.set(moleId, timer - dt);
      if (timer - dt <= 0) {
        this.moleHitTimers.delete(moleId);
      }
    }

    // Publish UI updates at regular intervals
    this.uiTimer += dt;
    if (this.uiTimer >= this.UI_PUBLISH_INTERVAL) {
      this.updateUI();
      this.uiTimer = 0;
    }
  };

  private updateRound = (): void => {
    // For simplicity, we keep everything in round 1 (30 second game)
    // In the future, you could split this into 3 rounds of 10 seconds each
    this.gameState.round = 1;
  };

  private updateMoles = (dt: number): void => {
    const difficultyConfig = DIFFICULTY_CONFIGS[this.difficulty];

    for (const mole of this.gameState.moles) {
      if (mole.isActive) {
        mole.activeSince += dt;

        // Randomly decide if this mole should stay active or deactivate
        const activeDuration = Math.random() * (difficultyConfig.moleActiveDurationMax - difficultyConfig.moleActiveDurationMin) + difficultyConfig.moleActiveDurationMin;
        if (mole.activeSince >= activeDuration) {
          mole.isActive = false;
          mole.activeSince = 0;
        }
      } else {
        mole.activeSince += dt;

        // Randomly activate mole based on probability
        const inactiveDuration = Math.random() * (difficultyConfig.moleInactiveDurationMax - difficultyConfig.moleInactiveDurationMin) + difficultyConfig.moleInactiveDurationMin;
        if (mole.activeSince >= inactiveDuration) {
          if (Math.random() < difficultyConfig.activeProbability) {
            // Count active moles
            const activeMoleCount = this.gameState.moles.filter((m) => m.isActive).length;
            if (activeMoleCount < difficultyConfig.activeMoleCount) {
              mole.isActive = true;
              mole.activeSince = 0;
            }
          }
        }
      }
    }
  };

  private updateUI = (): void => {
    const snapshot: UISnapshot = {
      status: this.gameState.status,
      score: this.gameState.score,
      timeRemaining: Math.max(0, this.gameState.timeRemaining),
      round: this.gameState.round,
      totalMolesHit: this.gameState.totalMolesHit,
      finalScore: this.gameState.finalScore,
      bestScore: this.bestScoreAtStart,
    };
    this.uiStore.publish(snapshot);
  };

  getMoleHitFlashAlpha = (moleId: number): number => {
    const timer = this.moleHitTimers.get(moleId);
    if (timer === undefined) return 1;
    return 1 - (HIT_FLASH_DURATION - timer) / HIT_FLASH_DURATION;
  };

  getGameState = (): GameState => this.gameState;

  getCanvasSize = () => ({ width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT });

  getMoleWorldPosition = (gridX: number, gridY: number) => ({
    x: MOLE_PADDING_X + gridX * HOLE_SPACING_X + HOLE_SPACING_X / 2,
    y: MOLE_PADDING_Y + gridY * HOLE_SPACING_Y + HOLE_SPACING_Y / 2,
  });

  destroy = (): void => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };
}
