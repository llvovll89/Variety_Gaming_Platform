import { PlusIcon } from "@phosphor-icons/react/dist/icons/Plus";
import type { GameDefinition } from "./types";

interface HubProps {
  games: GameDefinition[];
  onSelect: (gameId: string) => void;
}

export default function Hub({ games, onSelect }: HubProps) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-[#0f1419] px-4 py-12 text-white select-none">
      {/* Premium ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.04), transparent 60%)",
        }}
      />
      
      <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-12">
        {/* Header Section */}
        <div className="motion-safe:animate-card-in text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl bg-clip-text bg-gradient-to-b from-white to-white/80">
            종합 게임 플랫폼
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/40" />
            <span className="text-lg font-semibold text-white/80">GH</span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/40" />
          </div>
          <p className="text-sm font-medium text-white/50 mt-4">
            재미있는 게임들을 즐겨보세요
          </p>
        </div>

        {/* Game Grid */}
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game, i) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              style={{ animationDelay: `${i * 50}ms` }}
              className="motion-safe:animate-card-in group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_48px_-12px] active:scale-95"
            >
              {/* Card Background */}
              <div className="absolute inset-0" style={{
                background: `linear-gradient(135deg, rgba(${parseInt(game.accentColor.slice(1,3), 16)},${parseInt(game.accentColor.slice(3,5), 16)},${parseInt(game.accentColor.slice(5,7), 16)}, 0.08) 0%, rgba(255,255,255,0.02) 100%)`
              }} />
              
              {/* Accent Border */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 group-hover:opacity-100"
                style={{
                  border: `2px solid ${game.accentColor}33`,
                  boxShadow: `inset 0 0 20px ${game.accentColor}11, 0 0 20px ${game.accentColor}22`,
                  opacity: 0.7
                }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col gap-3 p-5">
                {/* Image */}
                <div className="relative h-40 overflow-hidden rounded-xl">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="h-full w-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  
                  {/* Game badge */}
                  <div
                    className="absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold text-white transform group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${game.accentColor}dd` }}
                  >
                    {game.id === "hachuping-memory" && "기억력"}
                    {game.id === "hachuping-whack-a-mole" && "반응속도"}
                    {game.id === "hachuping-slither" && "성장"}
                    {game.id === "hachuping-jump" && "점프"}
                    {game.id === "hachuping-dodge" && "회피"}
                    {game.id === "hachuping-balloon" && "터치"}
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full transform group-hover:scale-150 transition-transform duration-300"
                      style={{ backgroundColor: game.accentColor }}
                    />
                    <h3 className="text-base font-bold text-white truncate">{game.title}</h3>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                    {game.description}
                  </p>
                </div>

                {/* CTA */}
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-white/70 group-hover:text-white transition">
                  지금 시작하기
                  <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </button>
          ))}

          {/* Coming Soon */}
          <div
            style={{ animationDelay: `${games.length * 50}ms` }}
            className="motion-safe:animate-card-in flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 p-8 text-center text-white/40 hover:border-white/20 hover:text-white/50 transition"
          >
            <PlusIcon size={28} weight="bold" />
            <div>
              <div className="text-sm font-semibold">새로운 게임</div>
              <div className="text-xs">준비 중입니다</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
