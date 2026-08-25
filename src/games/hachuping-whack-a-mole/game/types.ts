export interface Mole {
  id: number;
  gridX: number; // 0-4 (5 columns)
  gridY: number; // 0-3 (4 rows)
  isActive: boolean;
  activeSince: number; // seconds since activation
}

export interface GameState {
  status: "idle" | "playing" | "paused" | "game-over";
  score: number;
  timeRemaining: number;
  round: number; // 1-3, difficulty increases each round
  moles: Mole[];
  totalMolesHit: number;
  gameOver: boolean;
  finalScore: number | null;
  difficulty: "easy" | "normal" | "hard";
}

export interface UISnapshot {
  status: "idle" | "playing" | "paused" | "game-over";
  score: number;
  timeRemaining: number;
  round: number;
  totalMolesHit: number;
  finalScore: number | null;
  bestScore: number;
}
