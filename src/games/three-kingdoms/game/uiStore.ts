import type { UISnapshot } from "./types";

export function emptySnapshot(): UISnapshot {
  return {
    screen: "menu",
    year: 194,
    month: 6,
    turn: 1,
    result: "playing",
    player: null,
    selected: { kind: "none" },
    placement: null,
    pendingTactic: null,
    log: [],
    busy: false,
    standings: [],
  };
}

/** Bridges the imperative engine into React via useSyncExternalStore. */
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
