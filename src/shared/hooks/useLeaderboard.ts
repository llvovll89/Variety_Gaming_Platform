import { useCallback, useRef, useState } from "react";
import { gameStorageKey, safeGetItem, safeSetItem } from "../storage";
import { insertLeaderboard, parseLeaderboard, type LeaderboardEntry } from '../leaderboard';
export type { LeaderboardEntry } from '../leaderboard';

const LEADERBOARD_KEY_SUFFIX = "leaderboard";

export interface UseLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  submitScore: (score: number) => number | null; // Returns rank (1-based) if entered top 10, null otherwise
}

export function useLeaderboard(gameId: string): UseLeaderboardResult {
  const key = gameStorageKey(gameId, LEADERBOARD_KEY_SUFFIX);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => parseLeaderboard(safeGetItem(key)));
  const current = useRef(leaderboard);

  const submitScore = useCallback(
    (score: number): number | null => {
      const { entries, rank } = insertLeaderboard(current.current, score);
      if (entries === current.current) return null;
      current.current = entries;
      setLeaderboard(entries);
      safeSetItem(key, JSON.stringify(entries));
      return rank;
    },
    [key],
  );

  return { leaderboard, submitScore };
}
