import type { ComponentType } from "react";
import type { Profile } from "../shared/profile/useProfile";
import type { GameMeta } from "./meta/types";

export interface GameProps {
  onExit: () => void;
  launchIntent?: "start" | "resume";
  /** Cross-game player identity (name + character), owned by the platform shell. */
  profile: Profile;
}

export interface GameDefinition {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  /** Larger version of the promotional cover art for the hub spotlight. */
  cover?: string;
  /** Small cover for the horizontal recommendation picker. */
  previewThumbnail?: string;
  /** Short spotlight copy, kept separate from detailed game descriptions. */
  spotlightText?: string;
  accentColor: string; // CSS color used for the card's glow/accent
  genres: readonly GameGenre[];
  tags: readonly string[];
  featuredText?: string;
  releaseStatus?: "available" | "coming-soon";
  /** Who the game is mainly for; decides how rewards are shown. Defaults from the 키즈 genre. */
  audience?: Audience;
  /** Records, achievements and daily challenges the game takes part in (data only). */
  meta?: GameMeta;
  disabled?: boolean;
  Component: ComponentType<GameProps>;
}

export type GameGenre = "전략" | "액션" | "캐주얼" | "키즈";
export type Audience = "kids" | "general";

/** Kids games show stickers and gentle wording; the rest show achievements and numbers. */
export function audienceOf(game: Pick<GameDefinition, "audience" | "genres">): Audience {
  return game.audience ?? (game.genres.includes("키즈") ? "kids" : "general");
}
