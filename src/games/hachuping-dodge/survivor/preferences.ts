import { DIFFICULTIES, type Difficulty } from './world.ts';

export const DIFFICULTY_KEY = 'rune-ranger-difficulty';
export function readDifficulty(): Difficulty {
  try {
    const value = localStorage.getItem(DIFFICULTY_KEY);
    if (value && Object.hasOwn(DIFFICULTIES, value)) return value as Difficulty;
  } catch { /* Storage is optional. */ }
  return 'easy';
}

export function saveDifficulty(difficulty: Difficulty): void {
  try { localStorage.setItem(DIFFICULTY_KEY, difficulty); } catch { /* Keep the in-memory selection. */ }
}

export function readBest(difficulty: Difficulty): number {
  try {
    const value = Number(localStorage.getItem(`rune-ranger-best-${difficulty}`));
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
  } catch { return 0; }
}
