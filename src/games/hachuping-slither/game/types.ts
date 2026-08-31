import type { Vector2 } from "../../../utils/math";

export type SnakeAiState = "WANDER" | "SEEK_STAR" | "FLEE";

export interface Snake {
  id: number;
  isPlayer: boolean;
  name: string;
  alive: boolean;

  head: Vector2;
  heading: number; // radians, current facing direction
  targetAngle: number; // radians, desired facing direction (from input or AI)
  speed: number; // current world units / sec
  boosting: boolean;

  score: number;
  radius: number; // cached, derived from score each update

  /** Distance-sampled trail of head positions, oldest first, used to derive body segments. */
  pathHistory: Vector2[];

  hue: number;

  /** Hex colors cycled one-per-segment along the body; empty = classic single-hue rendering.
   * Only ever set for the player snake — bots always keep the classic look. */
  bodyPalette: string[];

  boostTrailTimer: number;

  // Bot-only fields
  aiState: SnakeAiState;
  aiThinkTimer: number;
  aiTargetStarId: number | null;
}

export interface Star {
  id: number;
  pos: Vector2;
  value: number;
  radius: number;
  hue: number;
}

export interface GameConfig {
  worldSize: number;
}

export interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  isPlayer: boolean;
}

export interface UISnapshot {
  status: "menu" | "playing" | "paused" | "dead";
  score: number;
  rank: number;
  totalAlive: number;
  boosting: boolean;
  canBoost: boolean;
  leaderboard: LeaderboardEntry[];
  minimap: {
    worldSize: number;
    player: Vector2 | null;
    /** Recent path points per alive snake, rendered as faint terrain-like squiggles rather than obvious snake markers. */
    trails: Vector2[][];
    viewport: { x: number; y: number; w: number; h: number } | null;
  };
  finalScore: number | null;
}
