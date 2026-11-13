import type { Cue } from '../engine';
import { safeGetItem, safeSetItem } from '../../../shared/storage';

/**
 * Synthesised sound for 별빛 야간열차. Every effect is built from oscillators and filtered noise
 * with the Web Audio API, so there are no audio files to license or download.
 * Nothing plays until the player has interacted with the page (browser autoplay policy):
 * the context is created inside the first pointer or key event via unlock().
 */
export interface SoundSettings { sfx: boolean; ambient: boolean }
export const SOUND_KEY = 'arcade:night-train:sound';

export function loadSoundSettings(): SoundSettings {
  try {
    const parsed = JSON.parse(safeGetItem(SOUND_KEY) ?? 'null');
    if (parsed && typeof parsed.sfx === 'boolean' && typeof parsed.ambient === 'boolean') return parsed;
  } catch { /* fall through */ }
  return { sfx: true, ambient: false };
}
export function saveSoundSettings(settings: SoundSettings) {
  safeSetItem(SOUND_KEY, JSON.stringify(settings));
}

type Wave = OscillatorType;
interface ToneOpts { type?: Wave; gain?: number; attack?: number; slideTo?: number; at?: number; detune?: number }
interface NoiseOpts { filter?: BiquadFilterType; freq?: number; q?: number; gain?: number; at?: number; sweepTo?: number; attack?: number }

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private hum: OscillatorNode | null = null;
  private clatter: number | null = null;
  private settings: SoundSettings = { sfx: true, ambient: false };
  private wantAmbient = false;

  /** Call from a user gesture. Safe to call many times. */
  unlock() {
    if (!this.ctx) {
      const Ctor = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch { return; }
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.sfxBus = this.ctx.createGain();
      this.ambientBus = this.ctx.createGain();
      this.sfxBus.connect(this.master);
      this.ambientBus.connect(this.master);
      this.ambientBus.gain.value = 0;
      const length = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {});
    this.applySettings();
  }

  get ready() { return !!this.ctx && this.ctx.state === 'running'; }

  configure(settings: SoundSettings) {
    this.settings = settings;
    this.applySettings();
  }

  /** Ambience runs only on screens that ask for it (map and combat) and while the tab is visible. */
  setAmbientWanted(wanted: boolean) {
    this.wantAmbient = wanted;
    this.applySettings();
  }

  suspend() { void this.ctx?.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {}); }

  dispose() {
    this.stopAmbient();
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
  }

  private applySettings() {
    if (!this.ctx || !this.sfxBus) return;
    const now = this.ctx.currentTime;
    this.sfxBus.gain.setTargetAtTime(this.settings.sfx ? 1 : 0, now, 0.02);
    if (this.settings.ambient && this.wantAmbient) this.startAmbient();
    else this.stopAmbient();
  }

  private startAmbient() {
    if (!this.ctx || !this.ambientBus || this.hum) return;
    const ctx = this.ctx;
    this.ambientBus.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6);
    const hum = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.value = 46;
    lp.type = 'lowpass';
    lp.frequency.value = 160;
    g.gain.value = 0.05;
    hum.connect(lp).connect(g).connect(this.ambientBus);
    hum.start();
    this.hum = hum;
    // "Da-dum… da-dum": wheels over rail joints, scheduled slightly ahead of time.
    let beat = 0;
    const tick = () => {
      if (!this.ctx || !this.ambientBus) return;
      const t = this.ctx.currentTime + 0.05;
      const accent = beat % 4 === 0 ? 1 : 0.75;
      this.noiseBurst(0.07, { filter: 'lowpass', freq: 420, gain: 0.22 * accent, at: t }, this.ambientBus);
      this.noiseBurst(0.06, { filter: 'lowpass', freq: 360, gain: 0.16 * accent, at: t + 0.16 }, this.ambientBus);
      beat += 1;
    };
    tick();
    this.clatter = window.setInterval(tick, 1150);
  }

  private stopAmbient() {
    if (this.clatter !== null) { window.clearInterval(this.clatter); this.clatter = null; }
    if (this.hum && this.ctx && this.ambientBus) {
      const hum = this.hum;
      this.ambientBus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.25);
      window.setTimeout(() => { try { hum.stop(); } catch { /* already stopped */ } }, 900);
    }
    this.hum = null;
  }

  private tone(freq: number, dur: number, o: ToneOpts = {}, bus = this.sfxBus) {
    if (!this.ctx || !bus) return;
    const ctx = this.ctx;
    const t = o.at ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.detune) osc.detune.value = o.detune;
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t + dur);
    const peak = o.gain ?? 0.3;
    const attack = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(dur: number, o: NoiseOpts = {}, bus = this.sfxBus) {
    if (!this.ctx || !bus || !this.noise) return;
    const ctx = this.ctx;
    const t = o.at ?? ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = o.filter ?? 'bandpass';
    filter.frequency.setValueAtTime(o.freq ?? 1200, t);
    filter.Q.value = o.q ?? 1;
    if (o.sweepTo) filter.frequency.exponentialRampToValueAtTime(o.sweepTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.gain ?? 0.3, t + (o.attack ?? 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(bus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.02);
  }

  play(cue: Cue, intensity = 0.6, delay = 0) {
    if (!this.ctx || !this.settings.sfx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + delay;
    const k = Math.max(0.2, Math.min(1, intensity));
    switch (cue) {
      case 'tap':
        this.tone(1500, 0.05, { type: 'triangle', gain: 0.08, at: t });
        break;
      case 'flick':
        this.noiseBurst(0.07, { filter: 'highpass', freq: 3200, gain: 0.16, at: t });
        this.tone(900, 0.04, { type: 'triangle', gain: 0.04, at: t });
        break;
      case 'whoosh':
        this.noiseBurst(0.22, { filter: 'bandpass', freq: 500, sweepTo: 3000, q: 1.4, gain: 0.18, at: t, attack: 0.05 });
        break;
      case 'hit':
        this.tone(170, 0.16, { type: 'sine', gain: 0.38 * k, slideTo: 60, at: t });
        this.noiseBurst(0.08, { filter: 'bandpass', freq: 1800, q: 0.8, gain: 0.26 * k, at: t });
        break;
      case 'hitBig':
        this.tone(140, 0.32, { type: 'sine', gain: 0.5, slideTo: 40, at: t });
        this.tone(70, 0.4, { type: 'triangle', gain: 0.25, slideTo: 35, at: t });
        this.noiseBurst(0.3, { filter: 'lowpass', freq: 2400, sweepTo: 300, gain: 0.32, at: t });
        break;
      case 'hurt':
        this.tone(220, 0.2, { type: 'square', gain: 0.07 * k + 0.03, slideTo: 90, at: t });
        this.noiseBurst(0.14, { filter: 'lowpass', freq: 900, gain: 0.3 * k, at: t });
        break;
      case 'clink':
        this.tone(1320, 0.18, { type: 'triangle', gain: 0.1, at: t });
        this.tone(1980, 0.12, { type: 'sine', gain: 0.06, at: t + 0.01 });
        break;
      case 'clank':
        this.tone(620, 0.22, { type: 'square', gain: 0.06, at: t });
        this.tone(930, 0.18, { type: 'triangle', gain: 0.08, at: t });
        this.noiseBurst(0.06, { filter: 'highpass', freq: 2500, gain: 0.1, at: t });
        break;
      case 'heal':
        [660, 880, 1320].forEach((f, i) => this.tone(f, 0.35, { type: 'sine', gain: 0.1, at: t + i * 0.07 }));
        break;
      case 'buff':
        this.tone(520, 0.14, { type: 'triangle', gain: 0.1, at: t });
        this.tone(780, 0.2, { type: 'triangle', gain: 0.1, at: t + 0.08 });
        break;
      case 'debuff':
        this.tone(330, 0.28, { type: 'sawtooth', gain: 0.05, slideTo: 200, at: t });
        this.tone(338, 0.28, { type: 'sawtooth', gain: 0.04, slideTo: 196, at: t });
        break;
      case 'whistle':
        // Two-note steam whistle, the train's "your turn".
        this.tone(587, 0.3, { type: 'triangle', gain: 0.1, attack: 0.04, at: t });
        this.tone(740, 0.3, { type: 'triangle', gain: 0.08, attack: 0.04, at: t });
        this.noiseBurst(0.32, { filter: 'bandpass', freq: 2600, q: 3, gain: 0.04, at: t, attack: 0.05 });
        break;
      case 'horn':
        this.tone(147, 0.5, { type: 'sawtooth', gain: 0.06, attack: 0.06, at: t });
        this.tone(185, 0.5, { type: 'sawtooth', gain: 0.045, attack: 0.06, at: t });
        break;
      case 'victory':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.45, { type: 'triangle', gain: 0.12, at: t + i * 0.11 }));
        this.tone(1047, 0.8, { type: 'sine', gain: 0.07, at: t + 0.44 });
        break;
      case 'defeat':
        [392, 349, 311, 262].forEach((f, i) => this.tone(f, 0.5, { type: 'triangle', gain: 0.1, at: t + i * 0.18 }));
        break;
      case 'lever':
        this.tone(110, 0.12, { type: 'square', gain: 0.06, slideTo: 70, at: t });
        this.noiseBurst(0.09, { filter: 'bandpass', freq: 700, gain: 0.2, at: t + 0.03 });
        break;
      case 'buzz':
        this.tone(140, 0.14, { type: 'square', gain: 0.05, at: t });
        break;
      case 'deal':
        for (let i = 0; i < 4; i++) this.noiseBurst(0.04, { filter: 'highpass', freq: 3600, gain: 0.08, at: t + i * 0.055 });
        break;
      case 'clack':
        this.noiseBurst(0.07, { filter: 'lowpass', freq: 600, gain: 0.3, at: t });
        this.noiseBurst(0.07, { filter: 'lowpass', freq: 520, gain: 0.24, at: t + 0.15 });
        this.tone(587, 0.18, { type: 'triangle', gain: 0.05, attack: 0.03, at: t + 0.32 });
        break;
      case 'coin':
        this.tone(1568, 0.09, { type: 'square', gain: 0.04, at: t });
        this.tone(2093, 0.22, { type: 'square', gain: 0.04, at: t + 0.07 });
        break;
      case 'relic':
        [880, 1109, 1319, 1760].forEach((f, i) => this.tone(f, 0.3, { type: 'sine', gain: 0.08, at: t + i * 0.06 }));
        break;
      case 'snack':
        this.noiseBurst(0.12, { filter: 'highpass', freq: 4200, gain: 0.12, at: t });
        this.noiseBurst(0.1, { filter: 'highpass', freq: 3800, gain: 0.1, at: t + 0.1 });
        break;
      case 'bite':
        this.noiseBurst(0.06, { filter: 'bandpass', freq: 1400, gain: 0.25, at: t });
        this.noiseBurst(0.06, { filter: 'bandpass', freq: 1200, gain: 0.2, at: t + 0.12 });
        this.tone(660, 0.2, { type: 'sine', gain: 0.07, at: t + 0.22 });
        break;
      case 'register':
        this.tone(1760, 0.5, { type: 'sine', gain: 0.09, at: t });
        this.tone(2637, 0.4, { type: 'sine', gain: 0.04, at: t });
        this.noiseBurst(0.05, { filter: 'bandpass', freq: 900, gain: 0.15, at: t - 0.04 > 0 ? t - 0.04 : t });
        break;
      case 'chime':
        [784, 988, 1175].forEach((f, i) => this.tone(f, 0.6, { type: 'sine', gain: 0.08, at: t + i * 0.12 }));
        break;
      case 'page':
        this.noiseBurst(0.18, { filter: 'bandpass', freq: 2200, sweepTo: 900, q: 0.7, gain: 0.12, at: t, attack: 0.03 });
        break;
      case 'roar':
        this.tone(70, 0.9, { type: 'sawtooth', gain: 0.12, slideTo: 45, attack: 0.08, at: t });
        this.noiseBurst(0.9, { filter: 'lowpass', freq: 500, sweepTo: 150, gain: 0.25, at: t, attack: 0.1 });
        break;
      case 'scissors':
        this.noiseBurst(0.05, { filter: 'highpass', freq: 5000, gain: 0.14, at: t });
        this.noiseBurst(0.05, { filter: 'highpass', freq: 5000, gain: 0.14, at: t + 0.09 });
        break;
      case 'upgrade':
        this.tone(220, 0.06, { type: 'square', gain: 0.07, at: t });
        this.tone(220, 0.06, { type: 'square', gain: 0.07, at: t + 0.12 });
        [784, 1175].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', gain: 0.09, at: t + 0.26 + i * 0.08 }));
        break;
    }
  }
}

export const sound = new SoundEngine();
