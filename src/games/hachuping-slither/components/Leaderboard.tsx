import type { LeaderboardEntry } from "../game/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="slither-leaderboard">
      <div className="mb-2 text-[11px] font-semibold text-[#c8d8b9]">
        정원의 생존자
      </div>
      <ol className="flex flex-col gap-0.5">
        {entries.map((entry, i) => (
          <li
            key={entry.id}
            className={`flex justify-between gap-2 text-[11px] sm:text-xs ${
              entry.isPlayer ? "font-bold text-[#c8e69c]" : "text-white/85"
            }`}
          >
            <span className="truncate">
              {i + 1}. {entry.name}
            </span>
            <span>{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
