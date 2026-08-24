import type { UISnapshot } from "./types";

export function emptySnapshot(): UISnapshot {
  return { status: "playing", score: 0, bestScore: 0 };
}

/** Bridges the imperative game engine into React via useSyncExternalStore (shared/hooks/useUISnapshot). */
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
