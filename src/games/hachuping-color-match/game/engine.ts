import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  COLOR_PALETTE,
  OPTION_ROW_Y,
  OPTION_PADDING_X,
  DIFFICULTY_CONFIGS,
  DEFAULT_DIFFICULTY,
  POINTS_PER_CORRECT,
  STREAK_BONUS_PER_HIT,
  STREAK_BONUS_CAP,
  WRONG_PENALTY_SECONDS,
  WRONG_FLASH_DURATION,
  type DifficultyLevel,
} from "./constants";
import { UIStore } from "./uiStore";
import type { GameState, OptionSlot, UISnapshot } from "./types";
import { playCorrectSound, playWrongSound, playGameOverSound } from "./sound";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class ColorMatchEngine {
  readonly uiStore = new UIStore();

  private gameState: GameState;
  private wrongFlashTimers: Map<number, number> = new Map(); // optionId -> flash timer
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

  private buildRound(): { targetColorId: string; options: OptionSlot[]; answerTimeLimit: number } {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const chosenColors = shuffle(COLOR_PALETTE).slice(0, config.optionCount);
    const targetColorId = chosenColors[Math.floor(Math.random() * chosenColors.length)].id;

    const spacing = (LOGICAL_WIDTH - 2 * OPTION_PADDING_X) / config.optionCount;
    const positions = shuffle(chosenColors).map((color, i) => ({
      id: i,
      colorId: color.id,
      x: OPTION_PADDING_X + i * spacing + spacing / 2,
      y: OPTION_ROW_Y,
    }));

    return { targetColorId, options: positions, answerTimeLimit: config.answerTimeLimit };
  }

  private initializeGameState(): GameState {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const round = this.buildRound();

    return {
      status: "idle",
      score: 0,
      timeRemaining: config.duration,
      streak: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      targetColorId: round.targetColorId,
      options: round.options,
      answerTimeRemaining: round.answerTimeLimit,
      answerTimeLimit: round.answerTimeLimit,
      gameOver: false,
      finalScore: null,
      difficulty: this.difficulty,
    };
  }

  startGame = (): void => {
    this.gameState = this.initializeGameState();
    this.gameState.status = "playing";
    this.wrongFlashTimers.clear();
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

  private startNewRound = (): void => {
    const round = this.buildRound();
    this.gameState.targetColorId = round.targetColorId;
    this.gameState.options = round.options;
    this.gameState.answerTimeRemaining = round.answerTimeLimit;
    this.gameState.answerTimeLimit = round.answerTimeLimit;
    this.wrongFlashTimers.clear();
  };

  selectOption = (optionId: number): void => {
    if (this.gameState.status !== "playing" || this.gameState.gameOver) return;

    const option = this.gameState.options.find((o) => o.id === optionId);
    if (!option) return;

    if (option.colorId === this.gameState.targetColorId) {
      this.gameState.streak += 1;
      this.gameState.bestStreak = Math.max(this.gameState.bestStreak, this.gameState.streak);
      const bonus = Math.min(this.gameState.streak - 1, STREAK_BONUS_CAP) * STREAK_BONUS_PER_HIT;
      this.gameState.score += POINTS_PER_CORRECT + bonus;
      this.gameState.totalCorrect += 1;
      playCorrectSound();
      this.startNewRound();
    } else {
      this.gameState.streak = 0;
      this.gameState.totalWrong += 1;
      this.gameState.timeRemaining -= WRONG_PENALTY_SECONDS;
      this.wrongFlashTimers.set(optionId, WRONG_FLASH_DURATION);
      playWrongSound();
    }

    this.updateUI();
  };

  private gameLoop = (now: number): void => {
    if (this.paused) {
      this.rafId = requestAnimationFrame(this.gameLoop);
      return;
    }

    let dt = 0.016; // default to ~60fps
    if (this.lastTime !== null) {
      dt = Math.min((now - this.lastTime) / 1000, 0.05); // Cap at 50ms to prevent large jumps
    }
    this.lastTime = now;

    this.update(dt);

    this.rafId = requestAnimationFrame(this.gameLoop);
  };

  private update = (dt: number): void => {
    if (this.gameState.status !== "playing") return;

    this.gameState.timeRemaining -= dt;
    if (this.gameState.timeRemaining <= 0) {
      this.gameState.timeRemaining = 0;
      this.endGame();
      return;
    }

    this.gameState.answerTimeRemaining -= dt;
    if (this.gameState.answerTimeRemaining <= 0) {
      this.gameState.streak = 0;
      this.gameState.totalWrong += 1;
      this.startNewRound();
    }

    for (const [optionId, timer] of this.wrongFlashTimers) {
      this.wrongFlashTimers.set(optionId, timer - dt);
      if (timer - dt <= 0) {
        this.wrongFlashTimers.delete(optionId);
      }
    }

    this.uiTimer += dt;
    if (this.uiTimer >= this.UI_PUBLISH_INTERVAL) {
      this.updateUI();
      this.uiTimer = 0;
    }
  };

  private updateUI = (): void => {
    const snapshot: UISnapshot = {
      status: this.gameState.status,
      score: this.gameState.score,
      timeRemaining: Math.max(0, this.gameState.timeRemaining),
      streak: this.gameState.streak,
      bestStreak: this.gameState.bestStreak,
      totalCorrect: this.gameState.totalCorrect,
      totalWrong: this.gameState.totalWrong,
      finalScore: this.gameState.finalScore,
      bestScore: this.bestScoreAtStart,
    };
    this.uiStore.publish(snapshot);
  };

  getOptionFlashAlpha = (optionId: number): number => {
    const timer = this.wrongFlashTimers.get(optionId);
    if (timer === undefined) return 0;
    return timer / WRONG_FLASH_DURATION;
  };

  getGameState = (): GameState => this.gameState;

  getCanvasSize = () => ({ width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT });

  destroy = (): void => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };
}
