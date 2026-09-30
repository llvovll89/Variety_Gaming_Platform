import type { GameDefinition, GameGenre } from "./types";
import { gameStorageKey, safeGetItem, safeSetItem } from "../shared/storage";

export const HUB_RECENT_KEY = gameStorageKey("hub", "recentGames");
export const HUB_GENRES: readonly ("전체" | GameGenre)[] = ["전체", "전략", "액션", "캐주얼", "키즈"];

export function availableGames(games: readonly GameDefinition[]) {
  return games.filter(game => !game.disabled && game.releaseStatus !== "coming-soon");
}

export function comingSoonGames(games: readonly GameDefinition[]) {
  return games.filter(game => game.disabled || game.releaseStatus === "coming-soon");
}

export function filterHubGames(games: readonly GameDefinition[], query: string, genre: "전체" | GameGenre) {
  const normalized = query.trim().toLocaleLowerCase("ko");
  return availableGames(games).filter(game => {
    const matchesGenre = genre === "전체" || game.genres.includes(genre);
    const searchable = [game.title, game.description, ...game.genres, ...game.tags].join(" ").toLocaleLowerCase("ko");
    return matchesGenre && (!normalized || searchable.includes(normalized));
  });
}

/** Picks dark ink or white text for a solid #rrggbb background (WCAG relative luminance). */
export function readableInk(hex: string): "dark" | "light" {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return "dark";
  const value = parseInt(match[1], 16);
  const channel = (shift: number) => {
    const c = ((value >> shift) & 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(16) + 0.7152 * channel(8) + 0.0722 * channel(0);
  return luminance > 0.22 ? "dark" : "light";
}

export function parseRecentGameIds(raw: string | null, games: readonly GameDefinition[]) {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const playable = new Set(availableGames(games).map(game => game.id));
    return parsed.filter((id): id is string => typeof id === "string" && playable.has(id))
      .filter((id, index, list) => list.indexOf(id) === index)
      .slice(0, 4);
  } catch {
    return [];
  }
}

export function readRecentGameIds(games: readonly GameDefinition[]) {
  return parseRecentGameIds(safeGetItem(HUB_RECENT_KEY), games);
}

export function recordRecentGame(gameId: string, games: readonly GameDefinition[]) {
  if (!availableGames(games).some(game => game.id === gameId)) return readRecentGameIds(games);
  const next = [gameId, ...readRecentGameIds(games).filter(id => id !== gameId)].slice(0, 4);
  safeSetItem(HUB_RECENT_KEY, JSON.stringify(next));
  return next;
}
