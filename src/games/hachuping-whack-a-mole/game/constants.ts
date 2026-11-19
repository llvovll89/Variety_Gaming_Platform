export type DifficultyLevel = 'easy' | 'normal' | 'hard';
export const LOGICAL_WIDTH = 400;
export const LOGICAL_HEIGHT = 360;
export const MOLE_GRID_COLS = 3;
export const MOLE_GRID_ROWS = 3;
export const MOLE_PADDING_X = 20;
export const MOLE_PADDING_Y = 20;
export const HOLE_SPACING_X = 120;
export const HOLE_SPACING_Y = 106;
export const MOLE_HOLE_SIZE = 88;
export const MOLE_RADIUS = 36;
export const GAME_TOTAL_TIME = 30;
export const POINTS_PER_HIT = 10;
/** Hitting moles in a row pays more: x1.5 from 5 in a row, x2 from 10, x3 from 20. */
export const COMBO_TIERS = [{ at: 20, multiplier: 3 }, { at: 10, multiplier: 2 }, { at: 5, multiplier: 1.5 }] as const;
export function comboMultiplier(combo: number): number {
  return COMBO_TIERS.find(tier => combo >= tier.at)?.multiplier ?? 1;
}
/** Each 10-second round makes moles pop up and hide faster (round 1, 2, 3). */
export const ROUND_SPEED = [1, .88, .76] as const;
export function roundFor(timeRemaining: number): 1 | 2 | 3 {
  return timeRemaining > 20 ? 1 : timeRemaining > 10 ? 2 : 3;
}
export const HIT_FLASH_DURATION = .45;
export const DEFAULT_DIFFICULTY: DifficultyLevel = 'normal';
export const DIFFICULTY_CONFIGS = {
  easy: { name: '쉬움', activeMoleCount: 1, moleActiveDurationMin: 1.1, moleActiveDurationMax: 1.6, moleInactiveDurationMin: .65, moleInactiveDurationMax: 1.3 },
  normal: { name: '보통', activeMoleCount: 2, moleActiveDurationMin: .75, moleActiveDurationMax: 1.15, moleInactiveDurationMin: .45, moleInactiveDurationMax: .95 },
  hard: { name: '어려움', activeMoleCount: 3, moleActiveDurationMin: .5, moleActiveDurationMax: .85, moleInactiveDurationMin: .3, moleInactiveDurationMax: .7 },
};
export const MOLE_KEYS = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];
