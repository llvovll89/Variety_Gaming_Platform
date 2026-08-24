export type AnimalType = "cat" | "rabbit" | "bear" | "fox" | "panda";

export interface MemoryCard {
  id: number;
  animal: AnimalType;
  isRevealed: boolean;
}

export interface GameState {
  stage: number;
  sequence: number[];
  playerSequence: number[];
  cards: MemoryCard[];
  isPlayingSequence: boolean;
  isPlayerTurn: boolean;
  gameOver: boolean;
  score: number;
  highScore: number;
  message: string;
  status: "idle" | "playing" | "paused" | "game-over";
}
