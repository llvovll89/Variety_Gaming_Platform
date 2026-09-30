import { useMemo, useRef, useState, type CSSProperties } from "react";
import { MagnifyingGlassIcon, PlayIcon, XIcon } from "@phosphor-icons/react";
import type { GameDefinition, GameGenre } from "./types";
import { availableGames, comingSoonGames, filterHubGames, HUB_GENRES, readableInk, readRecentGameIds } from "./hubCatalog";
import "./hub.css";

interface HubProps {
  games: GameDefinition[];
  onSelect: (gameId: string) => void;
  profile: { name: string; characterImage: string };
}

const FEATURED_DEFAULT_ID = "three-kingdoms-card";

const shellStyle = (game: GameDefinition) =>
  ({ "--shell": game.accentColor }) as CSSProperties;

export default function Hub({ games, onSelect, profile }: HubProps) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<"전체" | GameGenre>("전체");
  const searchRef = useRef<HTMLInputElement>(null);

  const playableAll = useMemo(() => availableGames(games), [games]);
  const playable = useMemo(() => filterHubGames(games, query, genre), [games, query, genre]);
  const upcoming = useMemo(() => comingSoonGames(games), [games]);
  const recent = useMemo(
    () => readRecentGameIds(games)
      .map(id => games.find(game => game.id === id))
      .filter((game): game is GameDefinition => Boolean(game)),
    [games],
  );

  const [stageId, setStageId] = useState(
    () => (playableAll.find(game => game.id === FEATURED_DEFAULT_ID) ?? playableAll[0])?.id,
  );
  const stage = playableAll.find(game => game.id === stageId) ?? playableAll[0];

  const clearFilters = () => {
    setQuery("");
    setGenre("전체");
    searchRef.current?.focus();
  };
  const jumpToSearch = () => {
    document.querySelector("#hub-shelf")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => searchRef.current?.focus({ preventScroll: true }), 400);
  };

  return (
    <div className="hub">
      <header className="hub-top">
        <span className="hub-logo">GH ARCADE</span>
        <button type="button" className="hub-find" onClick={jumpToSearch}>
          <MagnifyingGlassIcon size={18} weight="bold" />
          <span>게임 찾기</span>
        </button>
        <span className="hub-me">
          <img src={profile.characterImage} alt="" />
          <span>{profile.name || "플레이어"}</span>
        </span>
      </header>

      <main className="hub-main">
        {stage && (
          <section className="console" style={shellStyle(stage)} aria-label="추천 게임">
            <div className="console-screen">
              <span className="console-led" aria-hidden="true" />
              <img key={stage.id} className="console-art" src={stage.thumbnail} alt={`${stage.title} 화면`} />
            </div>

            <div className="console-info">
              <h1 key={stage.id}>{stage.title}</h1>
              <p>{stage.featuredText ?? stage.description}</p>
              <ul className="console-tags" aria-label="태그">
                {stage.tags.slice(0, 4).map(tag => <li key={tag}>{tag}</li>)}
              </ul>
              <button type="button" className="console-start" onClick={() => onSelect(stage.id)}>
                <PlayIcon size={20} weight="fill" />
                시작하기
              </button>
            </div>

            <div className="console-slots" role="group" aria-label="게임 고르기">
              {playableAll.map(game => (
                <button
                  key={game.id}
                  type="button"
                  className="slot"
                  aria-pressed={game.id === stage.id}
                  onClick={() => setStageId(game.id)}
                  style={shellStyle(game)}
                >
                  <img src={game.thumbnail} alt="" />
                  <span>{game.title}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {recent.length > 0 && (
          <section className="hub-block" aria-labelledby="recent-title">
            <h2 id="recent-title" className="hub-h2">이어서 하기</h2>
            <div className="recent-row">
              {recent.map(game => (
                <button key={game.id} type="button" className="recent" onClick={() => onSelect(game.id)}>
                  <img src={game.thumbnail} alt="" />
                  <span>{game.title}</span>
                  <PlayIcon size={16} weight="fill" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section id="hub-shelf" className="hub-block shelf" aria-labelledby="shelf-title">
          <div className="shelf-head">
            <h2 id="shelf-title" className="hub-h2">게임 전체</h2>
            <label className="shelf-search">
              <MagnifyingGlassIcon size={18} weight="bold" />
              <span className="sr-only">게임 검색</span>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="게임 이름이나 태그로 찾기"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기">
                  <XIcon size={14} weight="bold" />
                </button>
              )}
            </label>
          </div>

          <div className="shelf-genres" role="group" aria-label="장르">
            {HUB_GENRES.map(item => (
              <button key={item} type="button" aria-pressed={genre === item} onClick={() => setGenre(item)}>
                {item}
                <small>{filterHubGames(games, "", item).length}</small>
              </button>
            ))}
          </div>

          <p className="sr-only" role="status">게임 {playable.length}개</p>

          {playable.length > 0 ? (
            <div className="shelf-grid">
              {playable.map(game => <Cartridge key={game.id} game={game} onSelect={onSelect} />)}
            </div>
          ) : (
            <div className="shelf-empty">
              <p>
                {query ? `‘${query}’에 맞는 ${genre === "전체" ? "" : `${genre} `}게임이 없어요.` : `${genre} 게임이 아직 없어요.`}
                <br />검색어를 지우거나 다른 장르를 골라 보세요.
              </p>
              <button type="button" onClick={clearFilters}>검색 초기화</button>
            </div>
          )}
        </section>

        {upcoming.length > 0 && (
          <section className="hub-block" aria-labelledby="soon-title">
            <h2 id="soon-title" className="hub-h2">준비 중인 게임</h2>
            <div className="soon-row">
              {upcoming.map(game => (
                <article key={game.id} className="soon">
                  <img src={game.thumbnail} alt="" />
                  <div>
                    <h3>{game.title}</h3>
                    <p>{game.description}</p>
                  </div>
                  <span className="soon-sticker">준비 중</span>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="hub-foot">
        <span className="hub-logo">GH ARCADE</span>
        <p>지금 할 수 있는 게임 {playableAll.length}개, 준비 중인 게임 {upcoming.length}개</p>
      </footer>
    </div>
  );
}

function Cartridge({ game, onSelect }: { game: GameDefinition; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      className={`cart cart-${readableInk(game.accentColor)}`}
      style={shellStyle(game)}
      onClick={() => onSelect(game.id)}
      aria-label={`${game.title} 시작하기`}
    >
      <span className="cart-grip" aria-hidden="true" />
      <span className="cart-label">
        <img src={game.thumbnail} alt="" />
      </span>
      <span className="cart-body">
        <span className="cart-genres">
          {game.genres.map(item => <span key={item}>{item}</span>)}
        </span>
        <strong>{game.title}</strong>
        <span className="cart-desc">{game.description}</span>
      </span>
    </button>
  );
}
