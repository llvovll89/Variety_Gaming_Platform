import { FLAP_IMPULSE, GRAVITY } from './constants';

// A full rise/fall arc takes about 0.58 seconds with the actual flight physics.
export const PRACTICE_INTERVAL = -2 * FLAP_IMPULSE / GRAVITY;
export class FlightPractice {
  elapsed = 0;
  lastTap: number | null = null;
  streak = 0;
  started = false;
  feedback: 'ready' | 'wait' | 'tap' | 'quick' | 'late' | 'good' | 'complete' = 'ready';
  update(dt: number, flap: boolean): void {
    if (!this.started && !flap) return;
    this.elapsed += dt;
    if (flap) {
      const interval = this.lastTap === null ? null : this.elapsed - this.lastTap;
      this.started = true;
      this.lastTap = this.elapsed;
      if (this.feedback === 'complete') return;
      if (interval === null) { this.feedback = 'wait'; return; }
      const good = interval >= PRACTICE_INTERVAL * .78 && interval <= PRACTICE_INTERVAL * 1.22;
      this.streak = good ? this.streak + 1 : 0;
      this.feedback = this.streak >= 3 ? 'complete' : good ? 'good' : interval < PRACTICE_INTERVAL ? 'quick' : 'late';
    } else if (this.lastTap !== null && this.feedback !== 'complete') {
      const since = this.elapsed - this.lastTap;
      if (since > PRACTICE_INTERVAL * 1.22) this.feedback = 'late';
      else if (since >= PRACTICE_INTERVAL * .78) this.feedback = 'tap';
    }
  }
  resetFlight(): void {
    this.lastTap = null;
    this.started = false;
    if (this.feedback !== 'complete') { this.streak = 0; this.feedback = 'ready'; }
  }
  snapshot() { return { streak: this.streak, feedback: this.feedback }; }
}
