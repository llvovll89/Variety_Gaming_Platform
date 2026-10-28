import { useCallback, useRef, useState } from "react";
import { gameStorageKey, safeGetItem, safeSetItem } from "../storage";

export interface UseHighScoreResult {
  highScore: number;
  previousBest: number;
  submitScore: (score: number) => void;
}

export function useHighScore(gameId: string): UseHighScoreResult {
  const key = gameStorageKey(gameId, "highScore");
  const [highScore, setHighScore] = useState<number>(() => {
    const parsed = Number(safeGetItem(key));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  });
  const best = useRef(highScore);
  const [previousBest, setPreviousBest] = useState(highScore);
  const submitScore = useCallback((score: number) => {
    if (!Number.isFinite(score) || score < 0) return;
    setPreviousBest(best.current);
    if (score <= best.current) return;
    best.current = score;
    safeSetItem(key, String(score));
    setHighScore(score);
  }, [key]);
  return { highScore, previousBest, submitScore };
}
