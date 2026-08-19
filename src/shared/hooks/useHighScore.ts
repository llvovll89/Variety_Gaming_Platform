import { useCallback, useState } from "react";
import { gameStorageKey, safeGetItem, safeSetItem } from "../storage";

export interface UseHighScoreResult {
  highScore: number;
  /** Persists the score as the new best if it beats the current one. Safe to call every game-over. */
  submitScore: (score: number) => void;
}

export function useHighScore(gameId: string): UseHighScoreResult {
  const key = gameStorageKey(gameId, "highScore");
  const [highScore, setHighScore] = useState<number>(() => {
    const raw = safeGetItem(key);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });

  const submitScore = useCallback(
    (score: number) => {
      setHighScore((prev) => {
        if (score <= prev) return prev;
        safeSetItem(key, String(score));
        return score;
      });
    },
    [key],
  );

  return { highScore, submitScore };
}
