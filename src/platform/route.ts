import type { GameDefinition } from "./types";

/** Each game lives at /play/<id>, so it can be shared, refreshed and reached with the browser's back button. */
export const PLAY_PREFIX = "/play/";

export const gamePath = (id: string) => `${PLAY_PREFIX}${encodeURIComponent(id)}`;

export const isPlayable = (game: GameDefinition) => game.releaseStatus !== "coming-soon" && !game.disabled;

/**
 * The game a URL points at, or null for the hub. Unknown, unreleased and malformed ids are
 * treated as the hub so a stale or hand-typed link never opens something unfinished.
 */
export function gameIdFromPath(pathname: string, games: readonly GameDefinition[]): string | null {
  if (!pathname.startsWith(PLAY_PREFIX)) return null;
  let id: string;
  try { id = decodeURIComponent(pathname.slice(PLAY_PREFIX.length).replace(/\/+$/, "")); } catch { return null; }
  const game = games.find(item => item.id === id);
  return game && isPlayable(game) ? game.id : null;
}

/** What the tab and the history menu show for a game page. */
export const documentTitle = (game?: GameDefinition) => (game ? `${game.title} · GH ARCADE` : "GH ARCADE");
