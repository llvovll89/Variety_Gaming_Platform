import { PlusIcon } from "@phosphor-icons/react";
import type { GameDefinition } from "./types";

interface HubProps {
  games: GameDefinition[];
  onSelect: (gameId: string) => void;
}

export default function Hub({ games, onSelect }: HubProps) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#050506] px-4 py-10 text-white select-none">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 0%, rgba(255,255,255,0.06), transparent 70%)",
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-8">
        <div className="motion-safe:animate-card-in text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            종합 게임 플랫폼 GH
          </h1>
          <div className="mx-auto mt-3 h-px w-16 bg-white/25" />
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-white/40">
            플레이할 게임을 골라보세요
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
          {games.map((game, i) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              style={{ animationDelay: `${i * 60}ms` }}
              className="motion-safe:animate-card-in group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/4 p-4 text-left transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/7 hover:shadow-[0_0_28px_-8px_rgba(255,255,255,0.35)] active:scale-[0.98]"
            >
              <img
                src={game.thumbnail}
                alt={game.title}
                className="h-16 w-16 shrink-0 rounded-2xl object-cover object-top ring-1 ring-white/15"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: game.accentColor }}
                  />
                  <span className="truncate text-lg font-bold text-white">{game.title}</span>
                </div>
                <div className="truncate text-sm text-white/45">{game.description}</div>
              </div>
            </button>
          ))}

          <div
            style={{ animationDelay: `${games.length * 60}ms` }}
            className="motion-safe:animate-card-in flex flex-col items-center justify-center gap-1 rounded-3xl border border-dashed border-white/15 p-4 text-center text-white/30"
          >
            <PlusIcon size={22} />
            <span className="text-xs">다음 게임 준비 중</span>
          </div>
        </div>
      </div>
    </div>
  );
}
