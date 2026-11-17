import { createGameSound } from '../../../shared/kit/sound';

/** Whack-a-mole sound effects, played through the arcade's shared audio and settings. */
export const moleSound = createGameSound('hachuping-whack-a-mole', {
  hit: [{ f: 800, dur: 0.2, gain: 0.3 }],
  gameOver: [{ f: 600, to: 300, dur: 0.5, gain: 0.2 }],
  roundUp: [{ f: 600, dur: 0.1, gain: 0.2 }, { f: 800, dur: 0.1, gain: 0.2, at: 0.15 }],
});

export function playHitSound(): void { moleSound.play('hit'); }
export function playGameOverSound(): void { moleSound.play('gameOver'); }
export function playRoundUpSound(): void { moleSound.play('roundUp'); }
