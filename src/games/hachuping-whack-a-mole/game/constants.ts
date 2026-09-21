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
export const HIT_FLASH_DURATION = .45;
export const DEFAULT_DIFFICULTY: DifficultyLevel = 'normal';
export const DIFFICULTY_CONFIGS = {
  easy: { name: '쉬움', activeMoleCount: 1, moleActiveDurationMin: 1.1, moleActiveDurationMax: 1.6, moleInactiveDurationMin: .65, moleInactiveDurationMax: 1.3 },
  normal: { name: '보통', activeMoleCount: 2, moleActiveDurationMin: .75, moleActiveDurationMax: 1.15, moleInactiveDurationMin: .45, moleInactiveDurationMax: .95 },
  hard: { name: '어려움', activeMoleCount: 3, moleActiveDurationMin: .5, moleActiveDurationMax: .85, moleInactiveDurationMin: .3, moleInactiveDurationMax: .7 },
};
export const MOLE_KEYS = ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];
