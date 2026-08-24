import type { LeaderboardEntry } from "../game/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 w-36 rounded-xl border border-pink-400/30 bg-black/70 px-3 py-2 text-white shadow-[0_0_16px_rgba(236,72,153,0.25)] backdrop-blur-sm sm:right-4 sm:top-4 sm:w-44">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-pink-200/80 sm:text-xs">
        리더보드
      </div>
      <ol className="flex flex-col gap-0.5">
        {entries.map((entry, i) => (
          <li
            key={entry.id}
            className={`flex justify-between gap-2 text-[11px] sm:text-xs ${
              entry.isPlayer ? "font-bold text-pink-300" : "text-white/85"
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
