import { effectiveAudio, settingsStore } from './settings';

/**
 * Synthesised game sound on one shared Web Audio graph:
 * every game gets its own gain bus → master gain → compressor → speakers.
 * Gains follow the arcade settings, so muting from anywhere silences every game at once.
 * Effects are data (recipes of tones and noise bursts), so a game's sound module is just a table.
 */
export interface Tone { f: number; to?: number; dur: number; at?: number; type?: OscillatorType; gain?: number; attack?: number }
export interface Noise { kind: 'noise'; dur: number; at?: number; filter?: BiquadFilterType; freq?: number; sweepTo?: number; gain?: number; attack?: number }
export type Recipe = readonly (Tone | Noise)[];

export interface Voice {
  kind: 'tone' | 'noise';
  start: number;
  end: number;
  peak: number;
  attack: number;
  type?: OscillatorType;
  from?: number;
  to?: number;
  filter?: BiquadFilterType;
}

const isNoise = (part: Tone | Noise): part is Noise => (part as Noise).kind === 'noise';

/** Pure timing for a recipe started at `now`, with every frequency scaled by `rate`. */
export function scheduleRecipe(recipe: Recipe, now: number, rate = 1): Voice[] {
  return recipe.map(part => {
    const start = now + Math.max(0, part.at ?? 0);
    const end = start + Math.max(0.01, part.dur);
    const peak = Math.min(1, Math.max(0, part.gain ?? 0.25));
    const attack = Math.min(Math.max(0.002, part.attack ?? 0.005), (end - start) / 2);
    if (isNoise(part)) return { kind: 'noise', start, end, peak, attack, filter: part.filter, from: part.freq === undefined ? undefined : part.freq * rate, to: part.sweepTo === undefined ? undefined : part.sweepTo * rate };
    return { kind: 'tone', start, end, peak, attack, type: part.type ?? 'sine', from: part.f * rate, to: (part.to ?? part.f) * rate };
  });
}

interface Graph { ctx: AudioContext; master: GainNode; buses: Map<string, GainNode>; noise: AudioBuffer }
let graph: Graph | null = null;

function applyGains() {
  if (!graph) return;
  const settings = settingsStore.get();
  const now = graph.ctx.currentTime;
  graph.master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume, now, 0.02);
  for (const [gameId, bus] of graph.buses) {
    const game = settings.games[gameId];
    bus.gain.setTargetAtTime(game?.muted ? 0 : game?.volume ?? 1, now, 0.02);
  }
}

function createGraph(): Graph | null {
  const Ctor = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
  if (!Ctor) return null;
  let ctx: AudioContext;
  try { ctx = new Ctor(); } catch { return null; }
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.ratio.value = 4;
  master.connect(compressor).connect(ctx.destination);
  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  settingsStore.subscribe(applyGains);
  document.addEventListener('visibilitychange', () => {
    if (!graph) return;
    void (document.hidden ? graph.ctx.suspend() : graph.ctx.resume()).catch(() => {});
  });
  return { ctx, master, buses: new Map(), noise };
}

/** Create the context on the first gesture (browser autoplay rules) and wake it after suspension. */
function ensureGraph(): Graph | null {
  if (!graph) {
    graph = createGraph();
    applyGains();
  }
  if (graph && graph.ctx.state === 'suspended' && !document.hidden) void graph.ctx.resume().catch(() => {});
  return graph;
}

function busFor(g: Graph, gameId: string): GainNode {
  let bus = g.buses.get(gameId);
  if (!bus) {
    bus = g.ctx.createGain();
    bus.connect(g.master);
    g.buses.set(gameId, bus);
    applyGains();
  }
  return bus;
}

function playVoice(g: Graph, out: GainNode, voice: Voice) {
  const env = g.ctx.createGain();
  env.gain.setValueAtTime(0.0001, voice.start);
  env.gain.exponentialRampToValueAtTime(Math.max(0.0002, voice.peak), voice.start + voice.attack);
  env.gain.exponentialRampToValueAtTime(0.0001, voice.end);
  env.connect(out);
  if (voice.kind === 'tone') {
    const osc = g.ctx.createOscillator();
    osc.type = voice.type ?? 'sine';
    osc.frequency.setValueAtTime(voice.from ?? 440, voice.start);
    if (voice.to !== voice.from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, voice.to ?? 440), voice.end);
    osc.connect(env);
    osc.start(voice.start);
    osc.stop(voice.end + 0.02);
    osc.onended = () => env.disconnect();
    return;
  }
  const source = g.ctx.createBufferSource();
  source.buffer = g.noise;
  let node: AudioNode = source;
  if (voice.filter) {
    const filter = g.ctx.createBiquadFilter();
    filter.type = voice.filter;
    filter.frequency.setValueAtTime(voice.from ?? 1000, voice.start);
    if (voice.to) filter.frequency.exponentialRampToValueAtTime(Math.max(1, voice.to), voice.end);
    node = source.connect(filter);
  }
  node.connect(env);
  source.start(voice.start);
  source.stop(voice.end + 0.02);
  source.onended = () => env.disconnect();
}

export interface GameSound<K extends string> {
  /** Call from a pointer or key handler; safe to call often. */
  unlock(): void;
  /** Plays nothing while muted, before unlock on strict browsers, or without Web Audio. */
  play(id: K, options?: { rate?: number; delay?: number }): void;
  /** For a game with its own engine (night-train): route it through the shared bus. */
  bus(): { ctx: AudioContext; out: GainNode } | null;
}

export function createGameSound<K extends string>(gameId: string, recipes: Record<K, Recipe>): GameSound<K> {
  return {
    unlock() { ensureGraph(); },
    play(id, options) {
      if (effectiveAudio(settingsStore.get(), gameId).muted) return;
      const g = ensureGraph();
      const recipe = recipes[id];
      if (!g || !recipe) return;
      try {
        const out = busFor(g, gameId);
        for (const voice of scheduleRecipe(recipe, g.ctx.currentTime + (options?.delay ?? 0), options?.rate)) playVoice(g, out, voice);
      } catch { /* a sound effect must never break the game */ }
    },
    bus() {
      const g = ensureGraph();
      return g ? { ctx: g.ctx, out: busFor(g, gameId) } : null;
    },
  };
}
