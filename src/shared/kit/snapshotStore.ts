import type { SnapshotStore } from '../hooks/useUISnapshot';

export interface WritableSnapshotStore<T> extends SnapshotStore<T> {
  publish(next: T): void;
}

/**
 * The engine-to-React bridge each game used to copy as its own UIStore class: hold one snapshot,
 * replace it with publish(), and notify subscribers. Read it with useUISnapshot().
 */
export function createSnapshotStore<T>(initial: T): WritableSnapshotStore<T> {
  let snapshot = initial;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    publish(next) {
      if (Object.is(next, snapshot)) return;
      snapshot = next;
      for (const listener of [...listeners]) listener();
    },
  };
}
