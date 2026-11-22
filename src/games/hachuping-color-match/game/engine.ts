import {
  COLOR_PALETTE,
  DIFFICULTY_CONFIGS,
  DEFAULT_DIFFICULTY,
  POINTS_PER_CORRECT,
  STREAK_BONUS_PER_HIT,
  STREAK_BONUS_CAP,
  WRONG_PENALTY_SECONDS,
  WRONG_FLASH_DURATION,
  CORRECT_PER_LEVEL,
  LEVEL_TIME_FACTOR,
  MIN_TIME_FACTOR,
  OPTION_GROWTH_LEVELS,
  STREAK_MILESTONE,
  type DifficultyLevel,
} from "./constants";
import { createUIStore } from "./uiStore";
import type { GameState, OptionSlot, PlayEvent, UISnapshot } from "./types";
import { playCorrectSound, playWrongSound, playGameOverSound, playLevelUpSound } from "./sound";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** How many pots and how long to answer at a given level. */
export function roundRules(difficulty: DifficultyLevel, level: number): { optionCount: number; answerTimeLimit: number } {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const extra = OPTION_GROWTH_LEVELS.filter((at) => level >= at).length;
  const optionCount = Math.min(config.maxOptionCount, config.optionCount + extra);
  const factor = Math.max(MIN_TIME_FACTOR, LEVEL_TIME_FACTOR ** (level - 1));
  return { optionCount, answerTimeLimit: config.answerTimeLimit * factor };
}

const MAX_EVENTS = 6;

export class ColorMatchEngine {
  readonly uiStore = createUIStore();

  private gameState: GameState;
  private wrongFlashTimers: Map<number, number> = new Map(); // optionId -> flash timer
  private events: PlayEvent[] = [];
  private eventId = 0;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private paused = false;
  private destroyed = false;
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

  private buildRound(level: number, previousTarget?: string): { targetColorId: string; options: OptionSlot[]; answerTimeLimit: number } {
    const { optionCount, answerTimeLimit } = roundRules(this.difficulty, level);
    const chosenColors = shuffle(COLOR_PALETTE).slice(0, optionCount);
    // The same target twice in a row reads like the tap didn't register, so pick a different one when possible.
    const candidates = chosenColors.filter((c) => c.id !== previousTarget);
    const pool = candidates.length ? candidates : chosenColors;
    const targetColorId = pool[Math.floor(Math.random() * pool.length)].id;
    const options = shuffle(chosenColors).map((color, i) => ({ id: i, colorId: color.id }));
    return { targetColorId, options, answerTimeLimit };
  }

  private initializeGameState(): GameState {
    const config = DIFFICULTY_CONFIGS[this.difficulty];
    const round = this.buildRound(1);

    return {
      status: "idle",
      score: 0,
      timeRemaining: config.duration,
      streak: 0,
      bestStreak: 0,
      totalCorrect: 0,
      totalWrong: 0,
      level: 1,
      round: 1,
      targetColorId: round.targetColorId,
      options: round.options,
      answerTimeRemaining: round.answerTimeLimit,
      answerTimeLimit: round.answerTimeLimit,
      gameOver: false,
      finalScore: null,
      difficulty: this.difficulty,
    };
  }

  private emit(event: Omit<PlayEvent, "id">): void {
    this.events = [...this.events, { ...event, id: ++this.eventId }].slice(-MAX_EVENTS);
  }

  startGame = (): void => {
    if (this.destroyed) return;
    this.cancelLoop();
    this.paused = false;
    this.gameState = this.initializeGameState();
    this.gameState.status = "playing";
    this.wrongFlashTimers.clear();
    this.events = [];
    this.uiTimer = 0;
    this.lastTime = null;
    this.updateUI();
    this.rafId = requestAnimationFrame(this.gameLoop);
  };

  pauseGame = (): void => {
    if (this.destroyed || this.gameState.status !== 'playing') return;
    this.cancelLoop();
    this.paused = true;
    this.gameState.status = "paused";
    this.updateUI();
  };

  resumeGame = (): void => {
    if (this.destroyed || this.gameState.status !== 'paused') return;
    this.paused = false;
    this.gameState.status = "playing";
    this.lastTime = null; // Reset lastTime to avoid large dt
    this.rafId = requestAnimationFrame(this.gameLoop);
    this.updateUI();
  };

  endGame = (): void => {
    if (this.destroyed || this.gameState.gameOver) return;
    this.cancelLoop();
    this.gameState.status = "game-over";
    this.gameState.gameOver = true;
    this.gameState.finalScore = this.gameState.score;
    playGameOverSound();
    this.updateUI();
    this.onGameOver(this.gameState.score);
  };

  private startNewRound = (): void => {
    const round = this.buildRound(this.gameState.level, this.gameState.targetColorId);
    this.gameState.targetColorId = round.targetColorId;
    this.gameState.options = round.options;
    this.gameState.answerTimeRemaining = round.answerTimeLimit;
    this.gameState.answerTimeLimit = round.answerTimeLimit;
    this.gameState.round += 1;
    this.wrongFlashTimers.clear();
  };

  selectOption = (optionId: number): void => {
    if (this.destroyed || this.gameState.status !== "playing" || this.gameState.gameOver) return;

    const option = this.gameState.options.find((o) => o.id === optionId);
    if (!option) return;

    if (option.colorId === this.gameState.targetColorId) {
      const state = this.gameState;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const bonus = Math.min(state.streak - 1, STREAK_BONUS_CAP) * STREAK_BONUS_PER_HIT;
      const points = POINTS_PER_CORRECT + bonus;
      state.score += points;
      state.totalCorrect += 1;
      this.emit({ kind: "correct", points, optionId });
      if (state.streak % STREAK_MILESTONE === 0) this.emit({ kind: "streak", value: state.streak });
      const level = 1 + Math.floor(state.totalCorrect / CORRECT_PER_LEVEL);
      if (level > state.level) {
        state.level = level;
        this.emit({ kind: "level-up", value: level });
        playLevelUpSound();
      } else {
        playCorrectSound();
      }
      this.startNewRound();
    } else {
      if (this.wrongFlashTimers.has(optionId)) return; // a second tap on the same wrong pot isn't a new mistake
      this.gameState.streak = 0;
      this.gameState.totalWrong += 1;
      this.gameState.timeRemaining -= WRONG_PENALTY_SECONDS;
      this.wrongFlashTimers.set(optionId, WRONG_FLASH_DURATION);
      this.emit({ kind: "wrong", optionId, value: WRONG_PENALTY_SECONDS });
      playWrongSound();
      if (this.gameState.timeRemaining <= 0) {
        this.gameState.timeRemaining = 0;
        this.endGame();
        return;
      }
    }

    this.updateUI();
  };

  /** Pick the pot at a 0-based screen position (keyboard 1–6). */
  selectOptionAt = (index: number): void => {
    const option = this.gameState.options[index];
    if (option) this.selectOption(option.id);
  };

  private gameLoop = (now: number): void => {
    this.rafId = null;
    if (this.destroyed || this.paused || this.gameState.status !== 'playing') return;

    let dt = 0.016; // default to ~60fps
    if (this.lastTime !== null) {
      dt = Math.min((now - this.lastTime) / 1000, 0.05); // Cap at 50ms to prevent large jumps
    }
    this.lastTime = now;

    this.update(dt);

    if (!this.destroyed && this.gameState.status === 'playing') this.rafId = requestAnimationFrame(this.gameLoop);
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
      this.emit({ kind: "timeout" });
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
    const state = this.gameState;
    const snapshot: UISnapshot = {
      status: state.status,
      score: state.score,
      timeRemaining: Math.max(0, state.timeRemaining),
      duration: DIFFICULTY_CONFIGS[this.difficulty].duration,
      streak: state.streak,
      bestStreak: state.bestStreak,
      totalCorrect: state.totalCorrect,
      totalWrong: state.totalWrong,
      level: state.level,
      round: state.round,
      targetColorId: state.targetColorId,
      options: state.options,
      answerProgress: Math.max(0, Math.min(1, state.answerTimeRemaining / state.answerTimeLimit)),
      wrongOptionIds: [...this.wrongFlashTimers.keys()],
      events: this.events,
      finalScore: state.finalScore,
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

  private cancelLoop = (): void => {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  destroy = (): void => { this.destroyed = true; this.cancelLoop(); };
}
