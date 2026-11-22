import { DIFFICULTIES, type Difficulty } from './world.ts';
import { settingsStore } from '../../../shared/kit/settings';
import { safeGetItem } from '../../../shared/storage';

export const GAME_ID = 'hachuping-dodge';
/** Where the difficulty lived before the arcade settings held it. Read as a fallback, never written. */
export const DIFFICULTY_KEY = 'rune-ranger-difficulty';

const asDifficulty = (value: unknown): Difficulty | null =>
  typeof value === 'string' && Object.hasOwn(DIFFICULTIES, value) ? value as Difficulty : null;

/**
 * The arcade settings hold the chosen difficulty, so "오늘의 도전" can open the expedition on the
 * one it asks for. A player who chose before the move keeps their old choice through the fallback.
 */
export function readDifficulty(): Difficulty {
  return asDifficulty(settingsStore.get().games[GAME_ID]?.extra?.difficulty)
    ?? asDifficulty(safeGetItem(DIFFICULTY_KEY))
    ?? 'easy';
}

export function saveDifficulty(difficulty: Difficulty): void {
  settingsStore.setGame(GAME_ID, { extra: { difficulty } });
}

export function readBest(difficulty: Difficulty): number {
  const value = Number(safeGetItem(`rune-ranger-best-${difficulty}`));
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}
