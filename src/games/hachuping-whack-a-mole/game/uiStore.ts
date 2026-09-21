import type { UISnapshot } from './types';
export function emptySnapshot(): UISnapshot {
  return {status: 'idle', score: 0, timeRemaining: 30, countdown: 3, round: 1, totalMolesHit: 0, attempts: 0, combo: 0, bestCombo: 0, finalScore: null, bestScore: 0, difficulty: 'normal', activeMoles: []};
}
export class UIStore {
  private snapshot = emptySnapshot();
  private listeners = new Set<() => void>();
  publish = (next: UISnapshot) => { this.snapshot = next; for (const listener of this.listeners) listener(); };
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  getSnapshot = () => this.snapshot;
}
