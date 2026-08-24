/**
 * A short synthesized "pop" via the Web Audio API — no audio asset files needed. The
 * AudioContext is created lazily on the first pop (called from a pointerdown handler), which
 * satisfies browsers' autoplay policies that require a user gesture.
 */
export class PopSoundPlayer {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return this.ctx;
    } catch {
      return null; // Web Audio unavailable/blocked — popping still works visually without sound.
    }
  }

  playPop(pitch = 1): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(820 * pitch, now);
      osc.frequency.exponentialRampToValueAtTime(140 * pitch, now + 0.12);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore — a failed pop sound should never interrupt gameplay.
    }
  }

  destroy(): void {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
