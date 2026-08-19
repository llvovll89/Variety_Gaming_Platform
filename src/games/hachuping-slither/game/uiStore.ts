import { WORLD_SIZE } from "./constants";
import type { UISnapshot } from "./types";

export function emptySnapshot(): UISnapshot {
  return {
    status: "menu",
    score: 0,
    rank: 0,
    totalAlive: 0,
    boosting: false,
    canBoost: false,
    leaderboard: [],
    minimap: { worldSize: WORLD_SIZE, player: null, trails: [], viewport: null },
    finalScore: null,
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
