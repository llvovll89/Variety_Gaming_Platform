import { settingsStore } from './settings';

/** A short vibration on phones that support it, unless the player turned vibration off. */
export function haptic(pattern: number | number[]): void {
  if (!settingsStore.get().haptics) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(pattern); } catch { /* some browsers throw without a user gesture */ }
}
