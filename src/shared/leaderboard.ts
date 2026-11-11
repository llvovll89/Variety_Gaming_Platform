export interface LeaderboardEntry { score: number; timestamp: number; }
const MAX_ENTRIES = 10;

export function parseLeaderboard(raw: string | null): LeaderboardEntry[] {
  try {
    const entries: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(entries)) return [];
    return entries.filter((entry): entry is LeaderboardEntry => entry !== null && typeof entry === 'object' &&
      Number.isFinite(entry.score) && entry.score >= 0 && Number.isFinite(entry.timestamp) && entry.timestamp >= 0 && entry.timestamp <= 8.64e15)
      .map(entry => ({ score: entry.score, timestamp: entry.timestamp }))
      .sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  } catch { return []; }
}

/** Existing equal scores stay ahead of the new record. Locate the actual inserted entry. */
export function insertLeaderboard(previous: LeaderboardEntry[], score: number, now = Date.now()) {
  if (!Number.isFinite(score) || score < 0) return { entries: previous, rank: null };
  const entry = { score, timestamp: now };
  const entries = [...previous, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
  const index = entries.indexOf(entry);
  return { entries, rank: index < 0 ? null : index + 1 };
}
