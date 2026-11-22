/**
 * Simple sound effect manager using Web Audio API.
 * Generates simple tone-based sounds without external audio files.
 */

import { isGameMuted, kitOutput } from '../../../shared/kit/sound';

/** Plays through the arcade's mute and volume settings as well as this game's own toggle. */
const GAME_ID = 'hachuping-color-match';
let audioContext: AudioContext | null = null;
let muted = false;

/** Silences every sound effect until switched back on. */
export function setMuted(next: boolean): void {
  muted = next;
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

/** Play a bright ascending chime for a correct answer */
export function playCorrectSound(): void {
  if (muted || isGameMuted(GAME_ID)) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const notes = [660, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(kitOutput(ctx, GAME_ID));

      osc.frequency.value = freq;
      osc.type = "sine";

      const startTime = now + i * 0.08;
      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.18);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  } catch {
    // Audio context not available or permission denied
  }
}

/** Play a low buzz for a wrong answer */
export function playWrongSound(): void {
  if (muted || isGameMuted(GAME_ID)) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(kitOutput(ctx, GAME_ID));

    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
    osc.type = "sawtooth";

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // Audio context not available or permission denied
  }
}

/** Play a sound for game over */
export function playGameOverSound(): void {
  if (muted || isGameMuted(GAME_ID)) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(kitOutput(ctx, GAME_ID));

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.5);
    osc.type = "sine";

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Audio context not available or permission denied
  }
}

/** Play a quick rising three-note run when the level goes up */
export function playLevelUpSound(): void {
  if (muted || isGameMuted(GAME_ID)) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    [660, 880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(kitOutput(ctx, GAME_ID));
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = now + i * 0.07;
      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.2);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  } catch {
    // Audio context not available or permission denied
  }
}
