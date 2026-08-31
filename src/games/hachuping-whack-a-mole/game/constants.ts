// Canvas dimensions — square format like dodge game
export const LOGICAL_WIDTH = 400;
export const LOGICAL_HEIGHT = 320;
export const ARENA_CENTER_X = LOGICAL_WIDTH / 2;
export const ARENA_CENTER_Y = LOGICAL_HEIGHT / 2;

// Mole grid layout — 5 columns × 4 rows
export const MOLE_GRID_COLS = 5;
export const MOLE_GRID_ROWS = 4;
export const MOLE_HOLE_SIZE = 60; // visual size of each hole
export const MOLE_PADDING_X = 20; // left/right padding
export const MOLE_PADDING_Y = 20; // top/bottom padding

// Calculate hole positions dynamically
export const HOLE_SPACING_X = (LOGICAL_WIDTH - 2 * MOLE_PADDING_X) / MOLE_GRID_COLS;
export const HOLE_SPACING_Y = (LOGICAL_HEIGHT - 2 * MOLE_PADDING_Y) / MOLE_GRID_ROWS;

// Difficulty levels configuration
export type DifficultyLevel = "easy" | "normal" | "hard";

export interface DifficultyConfig {
  name: string;
  duration: number; // seconds
  activeMoleCount: number; // max number of active moles
  activeProbability: number; // probability of mole activation
  moleActiveDurationMin: number;
  moleActiveDurationMax: number;
  moleInactiveDurationMin: number;
  moleInactiveDurationMax: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    name: "쉬움",
    duration: 30,
    activeMoleCount: 1,
    activeProbability: 0.3,
    moleActiveDurationMin: 0.8,
    moleActiveDurationMax: 1.5,
    moleInactiveDurationMin: 0.5,
    moleInactiveDurationMax: 1.0,
  },
  normal: {
    name: "보통",
    duration: 30,
    activeMoleCount: 2,
    activeProbability: 0.5,
    moleActiveDurationMin: 0.5,
    moleActiveDurationMax: 1.0,
    moleInactiveDurationMin: 0.3,
    moleInactiveDurationMax: 0.6,
  },
  hard: {
    name: "어려움",
    duration: 30,
    activeMoleCount: 3,
    activeProbability: 0.7,
    moleActiveDurationMin: 0.3,
    moleActiveDurationMax: 0.7,
    moleInactiveDurationMin: 0.1,
    moleInactiveDurationMax: 0.3,
  },
};

// Default difficulty (will be overridden by player selection)
export const DEFAULT_DIFFICULTY: DifficultyLevel = "normal";

// Total game duration
export const GAME_TOTAL_TIME = 30; // seconds

// Mole difficulty ramp by round (legacy, kept for compatibility)
export const ROUND_CONFIG = [
  { duration: 30, activeMoleCount: 1, activeProbability: 0.5 },
  { duration: 30, activeMoleCount: 2, activeProbability: 0.6 },
  { duration: 30, activeMoleCount: 3, activeProbability: 0.7 },
];

// Scoring
export const POINTS_PER_HIT = 10;

// Mole visual appearance
export const MOLE_RADIUS = 27; // radius of mole head — was 20, too small inside a 60-wide hole and made the face hard to see
export const MOLE_NOSE_COLOR = "#2b1810"; // near-black so it actually contrasts against the body gradient
export const MOLE_EYE_RADIUS = 5;
export const MOLE_NOSE_RADIUS = 3.5;

// Hole visual appearance
export const HOLE_BACKGROUND_COLOR = "#654321"; // darker brown for hole
export const HOLE_BORDER_COLOR = "#3d2817"; // even darker border
export const HOLE_BORDER_WIDTH = 2;

// Hit animation
export const HIT_FLASH_DURATION = 0.15; // seconds mole flashes when hit
export const HIT_SCALE_REDUCE = 0.7; // scale down to 70% when hit
