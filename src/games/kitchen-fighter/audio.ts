import type { HitEvent } from './engine';
/** Short noise transient + resonant wooden body: synthesized utensil foley, no network assets. */
export class FightAudio {
  context: AudioContext | null = null;
  muted = false;
  unlock() {
    try { this.context ??= new AudioContext(); void this.context.resume().catch(() => {}); } catch { /* Audio is optional. */ }
  }
  play(hit: HitEvent) {
    const c = this.context; if (!c || this.muted || c.state !== 'running') return;
    const time = c.currentTime, duration = hit.kind === 'super' ? .32 : .16;
    const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * duration), c.sampleRate);
    const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * .027));
    const noise = c.createBufferSource(); noise.buffer = buffer;
    const filter = c.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = hit.weapon === 'swatter' ? 2500 : 1100;
    const gain = c.createGain(); gain.gain.value = hit.kind === 'block' ? .13 : .36;
    noise.connect(filter).connect(gain).connect(c.destination); noise.start(time);
    const osc = c.createOscillator(), body = c.createGain(); osc.type = 'triangle';
    osc.frequency.setValueAtTime(hit.weapon === 'golf' ? 340 : 185, time); osc.frequency.exponentialRampToValueAtTime(65, time + .13);
    body.gain.setValueAtTime(.24, time); body.gain.exponentialRampToValueAtTime(.001, time + duration);
    osc.connect(body).connect(c.destination); osc.start(time); osc.stop(time + duration);
  }
  dispose() { void this.context?.close().catch(() => {}); this.context = null; }
}
