import { useSyncExternalStore } from "react";

export interface SnapshotStore<T> {
  subscribe(listener: () => void): () => void;
  getSnapshot(): T;
}

const noopSubscribe = () => () => {};

/** Generic bridge from an imperative game engine's UIStore into React via useSyncExternalStore. */
export function useUISnapshot<T>(store: SnapshotStore<T> | null, fallback: T): T {
  return useSyncExternalStore(
    store ? store.subscribe : noopSubscribe,
    store ? store.getSnapshot : () => fallback,
  );
}
