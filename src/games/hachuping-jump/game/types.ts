export interface BonusStar {
  y: number;
  collected: boolean;
}

export interface Obstacle {
  id: number;
  x: number; // logical-space left edge
  gapCenterY: number;
  gapHeight: number;
  passed: boolean;
  star: BonusStar | null;
}

export interface PlayerState {
  y: number;
  vy: number;
  rotation: number;
  alive: boolean;
}

export interface UISnapshot {
  status: "playing" | "paused" | "dead";
  score: number;
  bestScore: number;
  finalScore: number | null;
}
