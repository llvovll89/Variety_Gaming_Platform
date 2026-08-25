import { useCallback, useState } from "react";
import { gameStorageKey, safeGetItem, safeSetItem } from "../storage";

export interface LeaderboardEntry {
  score: number;
  timestamp: number; // milliseconds since epoch
}

const LEADERBOARD_KEY_SUFFIX = "leaderboard";
const MAX_ENTRIES = 10;

export interface UseLeaderboardResult {
  leaderboard: LeaderboardEntry[];
  submitScore: (score: number) => number | null; // Returns rank (1-based) if entered top 10, null otherwise
}

export function useLeaderboard(gameId: string): UseLeaderboardResult {
  const key = gameStorageKey(gameId, LEADERBOARD_KEY_SUFFIX);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const raw = safeGetItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as LeaderboardEntry[];
      return Array.isArray(parsed) ? parsed.sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES) : [];
    } catch {
      return [];
    }
  });

  const submitScore = useCallback(
    (score: number): number | null => {
      setLeaderboard((prev) => {
        const newEntry: LeaderboardEntry = { score, timestamp: Date.now() };
        const updated = [...prev, newEntry]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_ENTRIES);

        // Persist to storage
        safeSetItem(key, JSON.stringify(updated));

        return updated;
      });

      // Return rank if score made top 10
      const updatedList = leaderboard
        .concat({ score, timestamp: Date.now() })
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_ENTRIES);

      const entryRank = updatedList.findIndex((e) => e.score === score) + 1;
      return entryRank <= MAX_ENTRIES ? entryRank : null;
    },
    [key, leaderboard],
  );

  return { leaderboard, submitScore };
}
