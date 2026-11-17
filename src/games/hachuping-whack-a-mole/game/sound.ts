import { createGameSound } from '../../../shared/kit/sound';

/** Whack-a-mole sound effects. Muting and volume come from the arcade settings, not the engine. */
export const moleSound = createGameSound('hachuping-whack-a-mole', {
  hit: [{ f: 800, dur: 0.2, gain: 0.3 }],
  gameOver: [{ f: 600, to: 300, dur: 0.5, gain: 0.2 }],
});

export function playHit(): void { moleSound.play('hit'); }
export function playGameOver(): void { moleSound.play('gameOver'); }
