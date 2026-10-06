import type { ComponentType } from "react";
import type { Profile } from "../shared/profile/useProfile";

export interface GameProps {
  onExit: () => void;
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
  disabled?: boolean;
  Component: ComponentType<GameProps>;
}

export type GameGenre = "전략" | "액션" | "캐주얼" | "키즈";
