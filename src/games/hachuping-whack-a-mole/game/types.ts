import type { DifficultyLevel } from './constants';
export interface Mole {
  id: number;
  gridX: number;
  gridY: number;
  isActive: boolean;
  activeSince: number;
  duration: number;
}
export interface GameState {
  status: 'idle' | 'ready' | 'playing' | 'paused' | 'game-over';
  score: number;
  timeRemaining: number;
  countdown: number;
  round: number;
  moles: Mole[];
  totalMolesHit: number;
  attempts: number;
  combo: number;
  bestCombo: number;
  gameOver: boolean;
  finalScore: number | null;
  difficulty: DifficultyLevel;
}
export interface UISnapshot extends Omit<GameState, 'moles' | 'gameOver'> {
  bestScore: number;
  activeMoles: number[];
}
