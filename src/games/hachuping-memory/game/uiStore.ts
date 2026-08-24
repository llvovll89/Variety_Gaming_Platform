import type { GameState } from "./types";

export interface UISnapshot {
  status: "idle" | "playing" | "paused" | "game-over";
  score: number;
  highScore: number;
  gameState: GameState;
}

export function emptySnapshot(gameState: GameState): UISnapshot {
  return {
    status: gameState.status,
    score: gameState.score,
    highScore: gameState.highScore,
    gameState,
  };
}

export class UIStore {
  private snapshot: UISnapshot;
  private listeners = new Set<() => void>();

  constructor(initialState: GameState) {
    this.snapshot = emptySnapshot(initialState);
  }

  publish = (state: GameState): void => {
    this.snapshot = {
      status: state.status,
      score: state.score,
      highScore: state.highScore,
      gameState: state,
    };
    this.listeners.forEach((listener) => listener());
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): UISnapshot => this.snapshot;
}
