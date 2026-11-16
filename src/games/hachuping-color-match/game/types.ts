export interface OptionSlot {
  id: number;
  colorId: string;
}

/** The latest thing that happened, so the screen can react once per event. `id` increases with every event. */
export interface PlayEvent {
  id: number;
  kind: "correct" | "wrong" | "timeout" | "level-up" | "streak";
  points?: number;
  optionId?: number;
  value?: number;
}

export interface GameState {
  status: "idle" | "playing" | "paused" | "game-over";
  score: number;
  timeRemaining: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  level: number;
  round: number;
  targetColorId: string;
  options: OptionSlot[];
  answerTimeRemaining: number;
  answerTimeLimit: number;
  gameOver: boolean;
  finalScore: number | null;
  difficulty: "easy" | "normal" | "hard";
}

export interface UISnapshot {
  status: "idle" | "playing" | "paused" | "game-over";
  score: number;
  timeRemaining: number;
  duration: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  level: number;
  round: number;
  targetColorId: string;
  options: OptionSlot[];
  /** 1 → full answer window left, 0 → out of time. */
  answerProgress: number;
  wrongOptionIds: number[];
  events: PlayEvent[];
  finalScore: number | null;
  bestScore: number;
}
