import type { UISnapshot } from "./types";

export function emptySnapshot(): UISnapshot {
  return {
    status: "idle",
    score: 0,
    timeRemaining: 0,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalWrong: 0,
    finalScore: null,
    bestScore: 0,
  };
}

/** Bridges the imperative game engine into React via useSyncExternalStore. */
export class UIStore {
  private snapshot: UISnapshot = emptySnapshot();
  private listeners = new Set<() => void>();

  publish = (next: UISnapshot): void => {
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): UISnapshot => this.snapshot;
}
