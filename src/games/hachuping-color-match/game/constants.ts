export type PatternId = "dots" | "stripes" | "grid" | "waves" | "rings" | "zigzag" | "diamonds" | "plain" | "cross";

export interface ColorDef {
  id: string;
  name: string;
  hex: string;
  /** Text drawn on top of the color must stay readable. */
  ink: string;
  /** A texture shared by the target and its matching pot, so players who can't tell two hues apart can still match. */
  pattern: PatternId;
}

// Nine clearly distinguishable paint colors.
export const COLOR_PALETTE: ColorDef[] = [
  { id: "red", name: "빨강", hex: "#e5383b", ink: "#ffffff", pattern: "dots" },
  { id: "blue", name: "파랑", hex: "#2f6fe4", ink: "#ffffff", pattern: "stripes" },
  { id: "yellow", name: "노랑", hex: "#ffc928", ink: "#3b2a00", pattern: "grid" },
  { id: "green", name: "초록", hex: "#22a45d", ink: "#ffffff", pattern: "waves" },
  { id: "purple", name: "보라", hex: "#8e4ad8", ink: "#ffffff", pattern: "rings" },
  { id: "orange", name: "주황", hex: "#f7772b", ink: "#ffffff", pattern: "zigzag" },
  { id: "pink", name: "분홍", hex: "#f45fa6", ink: "#ffffff", pattern: "diamonds" },
  { id: "sky", name: "하늘", hex: "#36bde3", ink: "#06303d", pattern: "plain" },
  { id: "brown", name: "갈색", hex: "#8a5a35", ink: "#ffffff", pattern: "cross" },
];

export type DifficultyLevel = "easy" | "normal" | "hard";

export interface DifficultyConfig {
  name: string;
  duration: number; // total game length in seconds
  optionCount: number; // color choices per round at level 1
  maxOptionCount: number; // choices never grow past this
  answerTimeLimit: number; // seconds to answer at level 1 before it counts as a miss
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: { name: "쉬움", duration: 30, optionCount: 3, maxOptionCount: 4, answerTimeLimit: 3.2 },
  normal: { name: "보통", duration: 30, optionCount: 4, maxOptionCount: 5, answerTimeLimit: 2.4 },
  hard: { name: "어려움", duration: 30, optionCount: 5, maxOptionCount: 6, answerTimeLimit: 1.8 },
};

export const DEFAULT_DIFFICULTY: DifficultyLevel = "normal";

// Levels: every few correct answers the pace picks up.
export const CORRECT_PER_LEVEL = 5;
export const LEVEL_TIME_FACTOR = 0.9; // answer window shrinks by 10% per level…
export const MIN_TIME_FACTOR = 0.6; // …but never below 60% of the starting window
export const OPTION_GROWTH_LEVELS = [3, 5]; // reaching these levels adds one more pot

// Scoring
export const POINTS_PER_CORRECT = 10;
export const STREAK_BONUS_PER_HIT = 2;
export const STREAK_BONUS_CAP = 10; // streak value beyond this stops adding more bonus
export const WRONG_PENALTY_SECONDS = 1.5; // taken from the overall game clock on a wrong tap
export const STREAK_MILESTONE = 5; // a cheer every 5 in a row

// Flash shown on a wrongly-tapped pot
export const WRONG_FLASH_DURATION = 0.35;
