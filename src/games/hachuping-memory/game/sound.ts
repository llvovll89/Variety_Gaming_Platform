import { createGameSound, type Recipe } from '../../../shared/kit/sound';

/**
 * Every card has its own note (a major pentatonic scale, so any order sounds pleasant), which lets
 * children follow the pattern by ear as well as by eye. Plays through the arcade sound settings.
 */
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32];
const pad = (f: number): Recipe => [{ f, dur: 0.32, type: 'triangle', gain: 0.22 }];

type SoundId = `card${number}` | 'correct' | 'stage' | 'wrong';
const recipes = {
  ...Object.fromEntries(NOTES.map((f, i) => [`card${i}`, pad(f)])),
  correct: [{ f: 784, dur: 0.12, gain: 0.18 }, { f: 1046.5, dur: 0.18, gain: 0.18, at: 0.12 }],
  stage: [{ f: 523.25, dur: 0.12, gain: 0.18 }, { f: 659.25, dur: 0.12, gain: 0.18, at: 0.12 }, { f: 783.99, dur: 0.22, gain: 0.2, at: 0.24 }],
  wrong: [{ f: 330, to: 196, dur: 0.4, type: 'sawtooth', gain: 0.12 }],
} as Record<SoundId, Recipe>;

export const memorySound = createGameSound<SoundId>('hachuping-memory', recipes);

export function playCard(index: number): void { memorySound.play(`card${index % NOTES.length}`); }
export function playCorrect(): void { memorySound.play('correct'); }
export function playStage(): void { memorySound.play('stage'); }
export function playWrong(): void { memorySound.play('wrong'); }
