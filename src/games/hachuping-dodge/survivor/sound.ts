import { createGameSound, type Recipe } from '../../../shared/kit/sound';

/**
 * Rune Ranger's moments, not every shot: the hundreds of hits a minute would only be noise.
 * Plays through the arcade sound settings (mute and volume apply at once).
 */
type SoundId = 'level' | 'promote' | 'boss' | 'hurt' | 'clear' | 'victory' | 'defeat';
const recipes: Record<SoundId, Recipe> = {
  level: [{ f: 660, to: 990, dur: 0.16, type: 'triangle', gain: 0.16 }, { f: 1320, dur: 0.12, at: 0.12, type: 'sine', gain: 0.1 }],
  promote: [{ f: 392, dur: 0.14, type: 'triangle', gain: 0.16 }, { f: 523.25, dur: 0.14, at: 0.12, type: 'triangle', gain: 0.16 }, { f: 783.99, dur: 0.3, at: 0.24, type: 'triangle', gain: 0.18 }],
  boss: [{ f: 110, to: 82, dur: 0.6, type: 'sawtooth', gain: 0.12 }, { kind: 'noise', dur: 0.5, filter: 'lowpass', freq: 400, gain: 0.1 }],
  hurt: [{ f: 220, to: 140, dur: 0.12, type: 'square', gain: 0.07 }],
  clear: [{ f: 523.25, dur: 0.12, type: 'triangle', gain: 0.16 }, { f: 659.25, dur: 0.12, at: 0.12, type: 'triangle', gain: 0.16 }, { f: 1046.5, dur: 0.32, at: 0.24, type: 'triangle', gain: 0.18 }],
  victory: [{ f: 523.25, dur: 0.16, gain: 0.16 }, { f: 659.25, dur: 0.16, at: 0.16, gain: 0.16 }, { f: 783.99, dur: 0.16, at: 0.32, gain: 0.16 }, { f: 1046.5, dur: 0.5, at: 0.48, type: 'triangle', gain: 0.2 }],
  defeat: [{ f: 392, to: 196, dur: 0.6, type: 'sawtooth', gain: 0.1 }],
};

export const rangerSound = createGameSound<SoundId>('hachuping-dodge', recipes);

/** The sound for a change of screen in the run, if it has one. */
export function soundForStatus(status: string): SoundId | null {
  return status === 'upgrade' ? 'level' : status === 'promotion' ? 'promote' : status === 'clear' ? 'clear'
    : status === 'victory' ? 'victory' : status === 'dead' ? 'defeat' : null;
}
