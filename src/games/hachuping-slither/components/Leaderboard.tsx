import type { LeaderboardEntry } from "../game/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="slither-leaderboard">
      <h2>Leaderboard</h2>
      <ol className="flex flex-col gap-0.5">
        {entries.map((entry, i) => (
          <li
            key={entry.id}
            className={entry.isPlayer ? 'is-player' : ''}
            style={{ color: entry.isPlayer ? '#f1f3ba' : ['#c69be8', '#999ee8', '#e6a0ad', '#91a5e7', '#87a8d9', '#d49aa5', '#a99bdb', '#99b1d4', '#b5a2d6', '#9fcea7'][i % 10] }}
          >
            <span className="slither-rank">#{i + 1}</span><span className="slither-rank-name">{entry.name}</span>
            <span>{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
