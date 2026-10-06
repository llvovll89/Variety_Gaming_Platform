import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon, ArrowUpRightIcon, CaretLeftIcon, CaretRightIcon, DesktopIcon, GameControllerIcon, MagnifyingGlassIcon, MoonIcon, PlayIcon, SunIcon, XIcon } from "@phosphor-icons/react";
import type { GameDefinition, GameGenre } from "./types";
import { availableGames, comingSoonGames, filterHubGames, HUB_GENRES, readRecentGameIds } from "./hubCatalog";
import { safeGetItem, safeSetItem } from "../shared/storage";
import "./hub.css";

interface HubProps {
  games: GameDefinition[];
  onSelect: (gameId: string) => void;
  profile: { name: string; characterImage: string };
}
type Theme = "system" | "light" | "dark";
const THEME_KEY = "gh-hub-theme";
const THEME_NAMES = { system: "시스템 설정", light: "밝은 화면", dark: "어두운 화면" };
const NEXT_THEME: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };

// Covers are promotional artwork, not screenshots of the game interface.
function Cover({ game, featured = false }: { game: GameDefinition; featured?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <span className={`hub-image${loaded ? " is-loaded" : ""}${failed ? " has-error" : ""}`}>
    {failed ? <span className="hub-image-fallback"><GameControllerIcon size={36} /><span>{game.title}</span></span> :
      <img src={featured ? game.cover ?? game.thumbnail : game.thumbnail}
        srcSet={featured && game.cover ? `${game.thumbnail} 640w, ${game.cover} 1280w` : undefined}
        sizes={featured ? "(min-width: 1024px) 60vw, (min-width: 768px) 70vw, 100vw" : "(min-width: 1280px) 320px, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"}
        alt={featured ? `${game.title} 커버 아트` : ""} width={1280} height={720}
        loading={featured ? "eager" : "lazy"} fetchPriority={featured ? "high" : "auto"} decoding="async"
        onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
  </span>;
}

export default function Hub({ games, onSelect, profile }: HubProps) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<"전체" | GameGenre>("전체");
  const [theme, setTheme] = useState<Theme>(() => {
    const value = safeGetItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : "system";
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  const searchRef = useRef<HTMLInputElement>(null);
  const shelfRef = useRef<HTMLElement>(null);
  const featureRail = useRef<HTMLDivElement>(null);
  const playableAll = useMemo(() => availableGames(games), [games]);
  const playable = useMemo(() => filterHubGames(games, query, genre), [games, query, genre]);
  const upcoming = useMemo(() => comingSoonGames(games), [games]);
  const recent = useMemo(() => readRecentGameIds(games).map(id => games.find(game => game.id === id))
    .filter((game): game is GameDefinition => Boolean(game)), [games]);
  const [stageId, setStageId] = useState(() => (playableAll.find(game => game.id === "ghost-movers") ?? playableAll[0])?.id);
  const stage = playableAll.find(game => game.id === stageId) ?? playableAll[0];
  const resolvedTheme = theme === "system" ? systemDark ? "dark" : "light" : theme;
  const ThemeIcon = theme === "system" ? DesktopIcon : theme === "light" ? SunIcon : MoonIcon;
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const change = () => setSystemDark(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const cycleTheme = () => { const next = NEXT_THEME[theme]; setTheme(next); safeSetItem(THEME_KEY, next); };
  const clearFilters = () => { setQuery(""); setGenre("전체"); searchRef.current?.focus(); };
  const jumpToSearch = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    shelfRef.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" });
    searchRef.current?.focus({ preventScroll: true });
  };
  const scrollFeatures = (direction: number) => {
    const rail = featureRail.current;
    rail?.scrollBy({ left: direction * rail.clientWidth * .8, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  return <div className="hub" data-theme={resolvedTheme}>
    <header className="hub-top">
      <span className="hub-logo">GH ARCADE</span>
      <button type="button" className="hub-find" onClick={jumpToSearch}><MagnifyingGlassIcon size={18} /><span>게임 찾기</span></button>
      <div className="hub-account">
        <button type="button" className="hub-theme" onClick={cycleTheme} aria-label={`화면 테마: ${THEME_NAMES[theme]}. ${THEME_NAMES[NEXT_THEME[theme]]}으로 변경`} title={`화면 테마: ${THEME_NAMES[theme]}`}><ThemeIcon size={20} /></button>
        <span className="hub-me"><img src={profile.characterImage} alt="" width={32} height={32} /><span>{profile.name || "플레이어"}</span></span>
      </div>
    </header>
    <main className="hub-main">
      {stage && <section className="hub-feature" aria-label="추천 게임">
        <div className="hub-feature-stage">
          <div className="hub-feature-art"><Cover key={stage.id} game={stage} featured /></div>
          <div className="hub-feature-info">
            <p className="hub-feature-category">{stage.genres.join(" / ")}</p>
            <h1>{stage.title}</h1>
            <p className="hub-feature-description">{stage.spotlightText ?? stage.description}</p>
            <button type="button" className="hub-play" onClick={() => onSelect(stage.id)}><PlayIcon size={18} weight="fill" />시작하기</button>
          </div>
        </div>
        <div className="hub-feature-picker">
          <div className="hub-feature-rail" role="group" aria-label="게임 고르기" ref={featureRail}>
            {playableAll.map(game => <button key={game.id} type="button" className="hub-feature-choice" aria-pressed={game.id === stage.id} onClick={event => {
              setStageId(game.id);
              event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
            }}><img src={game.previewThumbnail ?? game.thumbnail} alt="" width={80} height={45} loading="lazy" /><span>{game.title}</span></button>)}
          </div>
          <div className="hub-rail-controls"><button type="button" onClick={() => scrollFeatures(-1)} aria-label="이전 추천 게임 보기"><CaretLeftIcon size={18} /></button><button type="button" onClick={() => scrollFeatures(1)} aria-label="다음 추천 게임 보기"><CaretRightIcon size={18} /></button></div>
        </div>
      </section>}

      {recent.length > 0 && <section className="hub-block" aria-labelledby="recent-title">
        <h2 id="recent-title">이어서 하기</h2>
        <div className="hub-recent-row">{recent.map(game => <button key={game.id} type="button" className="hub-recent" onClick={() => onSelect(game.id)}>
          <img src={game.thumbnail} alt="" width={112} height={63} loading="lazy" /><span><strong>{game.title}</strong><small>{game.genres.join(" / ")}</small></span><PlayIcon size={17} weight="fill" />
        </button>)}</div>
      </section>}

      <section id="hub-shelf" className="hub-block hub-shelf" aria-labelledby="shelf-title" ref={shelfRef}>
        <div className="hub-shelf-head"><h2 id="shelf-title">게임 전체 <span>{playableAll.length}</span></h2>
          <label className="hub-search"><MagnifyingGlassIcon size={18} /><span className="sr-only">게임 검색</span>
            <input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="게임 이름이나 태그로 찾기" />
            {query && <button type="button" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="검색어 지우기"><XIcon size={16} /></button>}
          </label>
        </div>
        <div className="hub-genres" role="group" aria-label="장르">{HUB_GENRES.map(item => <button key={item} type="button" aria-pressed={genre === item} onClick={() => setGenre(item)}>{item}<small>{filterHubGames(games, "", item).length}</small></button>)}</div>
        <p className="sr-only" role="status">게임 {playable.length}개</p>
        {playable.length > 0 ? <div className="hub-game-grid">{playable.map(game => <button key={game.id} type="button" className="hub-game" onClick={() => onSelect(game.id)} aria-label={`${game.title} 시작하기`}>
          <Cover game={game} /><span className="hub-game-caption"><span className="hub-game-genre">{game.genres.join(" / ")}</span><strong>{game.title}</strong><span className="hub-game-description">{game.description}</span><span className="hub-game-launch">시작하기<ArrowUpRightIcon size={17} /></span></span>
        </button>)}</div> : <div className="hub-empty"><MagnifyingGlassIcon size={36} /><h3>검색 결과가 없어요</h3><p>{query ? `‘${query}’에 맞는 ${genre === "전체" ? "" : `${genre} `}게임을 찾지 못했어요.` : `${genre} 게임이 아직 없어요.`}<br />검색어를 바꾸거나 다른 장르를 선택해 주세요.</p><button type="button" onClick={clearFilters}>검색 초기화</button></div>}
      </section>

      {upcoming.length > 0 && <section className="hub-block hub-upcoming" aria-labelledby="soon-title"><h2 id="soon-title">준비 중인 게임</h2>
        <div className="hub-soon-grid">{upcoming.map(game => <article key={game.id} className="hub-soon"><Cover game={game} /><div><span className="hub-soon-status">준비 중</span><h3>{game.title}</h3><p>{game.description}</p></div></article>)}</div>
      </section>}
    </main>
    <footer className="hub-foot"><span className="hub-logo">GH ARCADE</span><p>지금 할 수 있는 게임 {playableAll.length}개, 준비 중인 게임 {upcoming.length}개</p><button type="button" onClick={jumpToSearch}>게임 찾기<ArrowRightIcon size={16} /></button></footer>
  </div>;
}
