export interface OptionSlot {
  id: number;
  colorId: string;
  x: number;
  y: number;
}

export interface GameState {
  status: "idle" | "playing" | "paused" | "game-over";
  score: number;
  timeRemaining: number;
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
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
  streak: number;
  bestStreak: number;
  totalCorrect: number;
  totalWrong: number;
  finalScore: number | null;
  bestScore: number;
}
