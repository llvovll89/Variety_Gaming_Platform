// Canvas dimensions — same logical square format as the other mini-games
export const LOGICAL_WIDTH = 400;
export const LOGICAL_HEIGHT = 320;

export interface ColorDef {
  id: string;
  name: string;
  hex: string;
}

// 8 clearly distinguishable colors to draw options from
export const COLOR_PALETTE: ColorDef[] = [
  { id: "red", name: "빨강", hex: "#ef4444" },
  { id: "blue", name: "파랑", hex: "#3b82f6" },
  { id: "yellow", name: "노랑", hex: "#facc15" },
  { id: "green", name: "초록", hex: "#22c55e" },
  { id: "purple", name: "보라", hex: "#a855f7" },
  { id: "orange", name: "주황", hex: "#f97316" },
  { id: "pink", name: "분홍", hex: "#ec4899" },
  { id: "cyan", name: "하늘", hex: "#06b6d4" },
];

// Layout — target swatch top-center, progress bar beneath it, option row at the bottom
export const TARGET_CENTER_X = LOGICAL_WIDTH / 2;
export const TARGET_CENTER_Y = 78;
export const TARGET_RADIUS = 42;

export const PROGRESS_BAR_Y = 132;
export const PROGRESS_BAR_WIDTH = 220;
export const PROGRESS_BAR_HEIGHT = 10;

export const OPTION_ROW_Y = 240;
export const OPTION_RADIUS = 32;
export const OPTION_PADDING_X = 34;

export type DifficultyLevel = "easy" | "normal" | "hard";

export interface DifficultyConfig {
  name: string;
  duration: number; // total game length in seconds
  optionCount: number; // how many color choices per round
  answerTimeLimit: number; // seconds allowed to answer before it counts as a miss
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: { name: "쉬움", duration: 30, optionCount: 3, answerTimeLimit: 3.2 },
  normal: { name: "보통", duration: 30, optionCount: 4, answerTimeLimit: 2.4 },
  hard: { name: "어려움", duration: 30, optionCount: 5, answerTimeLimit: 1.8 },
};

export const DEFAULT_DIFFICULTY: DifficultyLevel = "normal";

// Scoring
export const POINTS_PER_CORRECT = 10;
export const STREAK_BONUS_PER_HIT = 2;
export const STREAK_BONUS_CAP = 10; // streak value beyond this stops adding more bonus
export const WRONG_PENALTY_SECONDS = 1.5; // taken from the overall game clock on a wrong tap or timeout

// Flash animation shown on a wrongly-tapped option
export const WRONG_FLASH_DURATION = 0.35;
